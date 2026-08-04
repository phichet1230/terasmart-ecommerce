/**
 * Utility for parsing incoming Bank Email Notifications (e.g., Krungthai Connext, KBank, SCB, PromptPay alerts)
 * Target Email Address: oppo0620255009@gmail.com
 */

const pool = require('../config/db');
const mailer = require('./mailer');

/**
 * Parse raw text/HTML from bank transaction email notification
 * @param {string} emailSubject 
 * @param {string} emailContent 
 */
function parseBankEmailNotification(emailSubject = '', emailContent = '') {
  const text = `${emailSubject} ${emailContent}`.replace(/\s+/g, ' ');

  let extractedAmount = null;
  let detectedBank = 'ธนาคาร (คำสั่งโอนเงินผ่านระบบ)';
  let isDeposit = false;

  // Check deposit keywords
  const depositKeywords = ['เงินเข้า', 'รับโอน', 'โอนสำเร็จ', 'ชำระเงินสำเร็จ', 'โอนเงิน', 'สำเร็จ', 'TRANSFER', 'DEPOSIT', 'RECEIVED', 'CREDIT'];
  if (depositKeywords.some(kw => text.toUpperCase().includes(kw))) {
    isDeposit = true;
  }

  // 1. Amount Parsing Regex Patterns
  const amountPatterns = [
    /(?:จำนวนเงิน|ยอดเงิน|ยอดโอน|จำนวน|AMOUNT)[:\s]*฿?\s*([\d,]+\.\d{2})/i,
    /([\d,]+\.\d{2})\s*(?:บาท|THB)/i,
    /฿\s*([\d,]+\.\d{2})/i
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        extractedAmount = parsed;
        break;
      }
    }
  }

  // 2. Bank Brand Detection
  if (text.includes('กรุงไทย') || text.includes('KRUNGTHAI') || text.includes('KTB')) {
    detectedBank = 'ธนาคารกรุงไทย (KTB)';
  } else if (text.includes('กสิกรไทย') || text.includes('KBANK')) {
    detectedBank = 'ธนาคารกสิกรไทย (KBank)';
  } else if (text.includes('ไทยพาณิชย์') || text.includes('SCB')) {
    detectedBank = 'ธนาคารไทยพาณิชย์ (SCB)';
  } else if (text.includes('กรุงเทพ') || text.includes('BBL')) {
    detectedBank = 'ธนาคารกรุงเทพ (BBL)';
  } else if (text.includes('พร้อมเพย์') || text.includes('PROMPTPAY')) {
    detectedBank = 'พร้อมเพย์ (PromptPay)';
  }

  return {
    isDeposit,
    amount: extractedAmount,
    bankName: detectedBank,
    rawText: text.substring(0, 500)
  };
}

/**
 * Process bank email notification and automatically settle matching pending orders
 * @param {string} emailSubject 
 * @param {string} emailContent 
 * @param {string} senderEmail 
 */
async function processBankNotificationEmail(emailSubject, emailContent, senderEmail = 'oppo0620255009@gmail.com') {
  const parsed = parseBankEmailNotification(emailSubject, emailContent);

  if (!parsed.amount) {
    return {
      status: 'ignored',
      message: 'ไม่พบบันทึกยอดเงินในอีเมลแจ้งเตือน',
      parsed
    };
  }

  // Find matching pending order in DB (within last 60 minutes)
  const orderResult = await pool.query(
    `SELECT o.* FROM orders o
     LEFT JOIN payments p ON o.id = p.order_id
     WHERE (o.status = 'pending' OR p.payment_status = 'pending') 
       AND ABS(o.total_price - $1) < 0.01 
       AND o.created_at >= NOW() - INTERVAL '60 minutes'
     ORDER BY o.created_at DESC LIMIT 1`,
    [parsed.amount]
  );

  if (orderResult.rows.length === 0) {
    return {
      status: 'not_matched',
      message: `ไม่พบคืนคำสั่งซื้อที่รอยอดชำระ ${parsed.amount.toFixed(2)} บาท ในระบบ`,
      parsed
    };
  }

  const order = orderResult.rows[0];

  // 1. Update order status to paid
  await pool.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [order.id]);

  // 2. Insert or update payment record in database
  const slipRef = `EMAIL-BANK-ALERT-${Date.now()}`;
  await pool.query(
    `INSERT INTO payments (
       order_id, method, amount, payment_status, paid_at, 
       transaction_ref, sending_bank, ocr_raw_text, is_ai_verified, ai_verified_status
     ) VALUES ($1, $2, $3, 'completed', NOW(), $4, $5, $6, true, 'MATCHED')
     ON CONFLICT (order_id) DO UPDATE SET 
       payment_status = 'completed',
       paid_at = NOW(),
       method = EXCLUDED.method,
       amount = EXCLUDED.amount,
       transaction_ref = EXCLUDED.transaction_ref,
       sending_bank = EXCLUDED.sending_bank,
       ocr_raw_text = EXCLUDED.ocr_raw_text,
       is_ai_verified = true,
       ai_verified_status = 'MATCHED'`,
    [order.id, 'bank_email_notification', parsed.amount, slipRef, parsed.bankName, `E-mail Alert (oppo0620255009@gmail.com): ${parsed.rawText}`]
  );

  // 3. Dispatch real order confirmation email to customer
  try {
    await mailer.sendOrderConfirmationEmail(order.email, order);
  } catch (mailErr) {
    console.error('Failed dispatching order confirmation email:', mailErr);
  }

  console.log(`✅ [AUTOMATED EMAIL PAYMENT MATCHED] Order #${order.id} paid ${parsed.amount.toFixed(2)} THB via Email Alert!`);

  return {
    status: 'success',
    message: `อนุมัติคำสั่งซื้อ #${order.id} ยอดเงิน ${parsed.amount.toFixed(2)} บาท เรียบร้อยแล้วผ่านระบบ Email Notification`,
    order_id: order.id,
    amount: parsed.amount,
    bank: parsed.bankName
  };
}

module.exports = {
  parseBankEmailNotification,
  processBankNotificationEmail
};
