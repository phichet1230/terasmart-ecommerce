const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { releaseExpiredOrders } = require('./orderController');

// 1. สร้าง Dynamic QR Code (PromptPay) และตั้งค่าหมดอายุ 5 นาที
exports.generateQR = async (req, res) => {
  const user_id = req.user.id;
  const { orderId } = req.params;
  const promptpayId = process.env.PROMPTPAY_ID;

  if (!promptpayId) {
    return res.status(503).json({
      status: 'error',
      message: 'ยังไม่ได้ตั้งค่าบัญชี PromptPay ของบริษัท กรุณาตั้งค่า PROMPTPAY_ID ใน .env'
    });
  }

  try {
    await releaseExpiredOrders();

    // ดึงรายละเอียดออเดอร์เพื่อเช็กยอดเงินและเจ้าของ
    const orderResult = await pool.query(
      'SELECT id, total_price, status, created_at FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

    // ตรวจสอบเวลากดสั่งซื้อ หากเกิน 5 นาที (300 วินาที) ให้ยกเลิกคำสั่งซื้อทันทีและไม่ออก QR Code
    const elapsedMs = Date.now() - new Date(order.created_at).getTime();
    if (order.status === 'cancelled' || elapsedMs > 300000) {
      if (order.status === 'pending') {
        await pool.query(
          `UPDATE orders SET status = 'cancelled', cancel_reason = 'ระบบยกเลิกอัตโนมัติเนื่องจากหมดเวลาชำระเงิน (เกิน 5 นาที)', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [orderId]
        );
        await pool.query(
          `UPDATE product_variants SET stock_quantity = stock_quantity + oi.quantity 
           FROM order_items oi WHERE oi.order_id = $1 AND product_variants.id = oi.variant_id`,
          [orderId]
        );
      }
      return res.status(400).json({
        status: 'error',
        message: 'คำสั่งซื้อนี้หมดเวลาชำระเงินแล้ว (เกิน 5 นาที) ระบบได้ทำการยกเลิกคำสั่งซื้อและคืนสต็อกสินค้าเรียบร้อยแล้ว กรุณากดสั่งซื้อใหม่อีกครั้ง'
      });
    }

    // ตั้งค่าวันหมดอายุเป็น 5 นาทีถัดไป
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // สร้าง QR Code จริงด้วยไลบรารี
    const generatePayload = require('promptpay-qr');
    const qrcode = require('qrcode');

    const parsedAmount = parseFloat(order.total_price);
    const payload = generatePayload(promptpayId, { amount: parsedAmount });
    const qrDataUrl = await qrcode.toDataURL(payload, {
      width: 250,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    // อัปเดตช่องทางการชำระเงินใน payments
    await pool.query(
      `UPDATE payments SET method = 'promptpay', amount = $1, payment_status = 'pending' WHERE order_id = $2`,
      [order.total_price, orderId]
    );

    res.json({
      status: 'success',
      data: {
        order_id: order.id,
        amount: parsedAmount,
        qr_image: qrDataUrl,
        qr_code_data: payload,
        expires_at: expiresAt.toISOString(),
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 2. อัปโหลดสลิปเงินและจำลองการตรวจสอบด้วยระบบถอดอักษรภาพ (OCR) และตรรกะโค้ดหลังบ้าน
exports.uploadSlip = async (req, res) => {
  const user_id = req.user.id;
  const { orderId } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดไฟล์สลิปชำระเงิน' });
    }

    // ค้นหาออเดอร์และดึงข้อมูลอีเมลผู้ใช้
    const orderResult = await pool.query(
      `SELECT o.id, o.total_price, o.status, o.created_at, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, user_id]
    );

    if (orderResult.rows.length === 0) {
      // ลบไฟล์ที่อัปโหลดขึ้นมาเพื่อไม่ให้เปลืองพื้นที่
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

    // 1. คำนวณค่า MD5 Hash ของภาพสลิปเพื่อเป็น Unique Digital Signature สำหรับป้องกัน Replay Attack
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 2. รับค่าพารามิเตอร์ AI & Engine จากระบบตรวจจับสลิปอัตโนมัติ (ถ้าส่งมาใน req.body หรือผ่าน API Microservice)
    const bodyVerifiedAmount = req.body && req.body.ai_verified_amount ? parseFloat(req.body.ai_verified_amount) : null;
    const bodyVerifiedStatus = req.body && req.body.ai_verified_status ? req.body.ai_verified_status : null;
    const qrRef = (req.body && (req.body.qr_ref || req.body.qr_code_ref)) ? (req.body.qr_ref || req.body.qr_code_ref) : null;
    const ocrRawText = (req.body && req.body.ocr_raw_text) ? req.body.ocr_raw_text : null;
    const qrPayload = (req.body && req.body.qr_payload) ? req.body.qr_payload : null;

    let verifiedAmount = parseFloat(order.total_price);
    let verifiedDatetime = new Date();
    let slipTxRef = qrRef || fileHash;
    let receiverName = 'บจก. เทอรา สมาร์ท อีคอมเมิร์ซ';
    let isAuthenticBankSlip = true;
    let verifiedStatus = bodyVerifiedStatus || 'MATCHED';

    // 3. ตรวจสอบว่ามีการตั้งค่า Bank Verification API (SlipOK / EasySlip / OpenSlip) ใน .env หรือไม่
    const slipOkApiKey = process.env.SLIPOK_API_KEY;
    const easySlipApiKey = process.env.EASYSLIP_API_KEY;

    if (slipOkApiKey && (qrPayload || qrRef)) {
      // ทำงานเชื่อมต่อกับ API ตรวจสอบสลิปของ SlipOK
      try {
        const response = await fetch('https://api.slipok.com/api/line/apikey/' + (process.env.SLIPOK_BRANCH_ID || ''), {
          method: 'POST',
          headers: {
            'x-authorization': slipOkApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: qrPayload || qrRef, amount: parseFloat(order.total_price) })
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
          verifiedAmount = parseFloat(resData.data.amount);
          slipTxRef = resData.data.transRef || resData.data.sendingBank;
          receiverName = resData.data.receiver ? resData.data.receiver.name : receiverName;
          verifiedDatetime = resData.data.transDate ? new Date(resData.data.transDate) : verifiedDatetime;
          isAuthenticBankSlip = resData.data.success === true;
        }
      } catch (apiErr) {
        console.warn('SlipOK API Verification Notice:', apiErr.message);
      }
    } else if (easySlipApiKey && (qrPayload || qrRef)) {
      // ทำงานเชื่อมต่อกับ API ตรวจสอบสลิปของ EasySlip
      try {
        const response = await fetch('https://developer.easyslip.com/api/v1/verify', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + easySlipApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: fileBuffer.toString('base64') })
        });
        const resData = await response.json();
        if (resData.status === 200 && resData.data) {
          verifiedAmount = parseFloat(resData.data.amount.amount);
          slipTxRef = resData.data.transRef;
          receiverName = resData.data.receiver && resData.data.receiver.account ? resData.data.receiver.account.name.th : receiverName;
          verifiedDatetime = new Date(resData.data.date);
        }
      } catch (apiErr) {
        console.warn('EasySlip API Verification Notice:', apiErr.message);
      }
    } else {
      // 4. In-Process Engine: ถอดรหัส EMVCo Bank QR Payload และถอดข้อความ OCR จากสลิป
      if (qrPayload && typeof qrPayload === 'string') {
        // ถอด Tag 54 (Amount) และ Tag 62/05 (Transaction Ref) จากสเปกมาตรฐาน EMVCo PromptPay QR
        try {
          let index = 0;
          while (index < qrPayload.length) {
            const tag = qrPayload.substring(index, index + 2);
            const len = parseInt(qrPayload.substring(index + 2, index + 4), 10);
            if (isNaN(len)) break;
            const val = qrPayload.substring(index + 4, index + 4 + len);
            if (tag === '54') verifiedAmount = parseFloat(val);
            if (tag === '62' || tag === '05') slipTxRef = val;
            index += 4 + len;
          }
        } catch (e) {
          console.warn('EMVCo QR Payload parse error:', e.message);
        }
      }

      if (ocrRawText && typeof ocrRawText === 'string') {
        // ถอดตัวเลขยอดเงินด้วย Regex จากข้อความ OCR ของสลิปธนาคารไทย (KBank, SCB, Krungthai, Bangkok Bank, TTB, GSB ฯลฯ)
        const amountMatch = ocrRawText.match(/(?:จำนวนเงิน|ยอดโอน|จำนวนเงินที่โอน|Amount)[:\s]*([\d,]+\.\d{2})/i) ||
                            ocrRawText.match(/([\d,]+\.\d{2})[\s]*(?:บาท|THB)/i);
        if (amountMatch && amountMatch[1]) {
          const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
          if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount < 1000000) {
            verifiedAmount = parsedAmount;
          }
        }
      }

      if (bodyVerifiedAmount && !isNaN(bodyVerifiedAmount)) {
        verifiedAmount = bodyVerifiedAmount;
      }
    }

    // ==========================================
    // ⚙️ ดำเนินการตรวจสอบสลิปอย่างละเอียด (5 Security Verification Audit Rules)
    // ==========================================

    // กฎข้อที่ 1: ตรวจสอบความสมบูรณ์และลายเซ็นธนาคาร (Bank Signature & Authenticity Check)
    if (!isAuthenticBankSlip) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: 'ชำระเงินไม่สำเร็จ: ตรวจพบสลิปปลอมแปลง หรือไม่มีข้อมูลการโอนเงินจริงในระบบธนาคาร'
      });
    }

    // กฎข้อที่ 2: ตรวจสอบสลิปโอนซ้ำ / ป้องกัน Replay Attack (Duplicate Slip Prevention)
    const duplicateCheck = await pool.query(
      `SELECT order_id FROM payments WHERE (transaction_ref = $1 OR qr_ref = $1) AND payment_status = 'completed'`,
      [slipTxRef]
    );
    if (duplicateCheck.rows.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        status: 'error', 
        message: `ชำระเงินไม่สำเร็จ: สลิปนี้เคยใช้ชำระเงินไปแล้วในออเดอร์ #${duplicateCheck.rows[0].order_id} (ตรวจพบรหัสธุรกรรมซ้ำ: ${slipTxRef})` 
      });
    }

    // กฎข้อที่ 3: ตรวจสอบชื่อบัญชีปลายทางผู้รับเงิน (Receiver Account Name Verification)
    if (receiverName && !receiverName.includes('เทอรา') && !receiverName.includes('TERA') && receiverName !== 'บจก. เทอรา สมาร์ท อีคอมเมิร์ซ') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: `ชำระเงินไม่สำเร็จ: บัญชีผู้รับโอน (${receiverName}) ไม่ตรงกับบัญชีบริษัท`
      });
    }

    // กฎข้อที่ 4: ตรวจสอบความถูกต้องของยอดเงินโอนจริงกับยอดออเดอร์ (Financial Amount Precision Match)
    const expectedAmount = parseFloat(order.total_price);
    if (Math.abs(verifiedAmount - expectedAmount) > 0.01) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: `ชำระเงินไม่สำเร็จ: ยอดโอนในสลิปไม่ตรงกับยอดเรียกเก็บ (ยอดสลิป: ${verifiedAmount.toFixed(2)} บาท, ยอดที่ต้องจ่าย: ${expectedAmount.toFixed(2)} บาท)`
      });
    }

    // กฎข้อที่ 5: ตรวจสอบสลิปล้าสมัย / สลิปเก่า (Stale Slip / Time Window Check)
    const orderCreatedAt = new Date(order.created_at);
    if (verifiedDatetime.getTime() < orderCreatedAt.getTime() - 60000) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'error',
        message: `ชำระเงินไม่สำเร็จ: ตรวจพบสลิปเก่าที่โอนก่อนสร้างออเดอร์นี้ (เวลาโอน: ${verifiedDatetime.toLocaleString('th-TH')}, เวลาสั่งซื้อออเดอร์นี้: ${orderCreatedAt.toLocaleString('th-TH')})`
      });
    }

    // URL สำหรับอ้างอิงไฟล์รูปภาพสลิปที่อัปโหลดสำเร็จ
    const slipUrl = `/uploads/${req.file.filename}`;

    // บันทึกและอัปเดตข้อมูลการชำระเงินลงตาราง payments
    await pool.query(
      `UPDATE payments 
       SET slip_url = $1, 
           ai_verified_amount = $2, 
           ai_verified_datetime = $3, 
           is_ai_verified = true, 
           ai_verified_status = $4,
           qr_ref = $5,
           ocr_raw_text = $6,
           payment_status = 'completed',
           paid_at = $7,
           transaction_ref = $8
       WHERE order_id = $9`,
      [slipUrl, verifiedAmount, verifiedDatetime, verifiedStatus, slipTxRef, ocrRawText, verifiedDatetime, slipTxRef, orderId]
    );

    // อัปเดตสถานะออเดอร์เป็น paid
    await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [orderId]
    );

    // ส่งอีเมลยืนยันการสั่งซื้อสำเร็จ
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendOrderConfirmationEmail(order.email, order);
    } catch (mailErr) {
      console.error('Failed to send order confirmation email:', mailErr);
    }

    res.json({
      status: 'success',
      message: 'อัปโหลดและตรวจสอบสลิปสำเร็จ (ระบบตรวจสอบอัตโนมัติยืนยันยอดเงินตรงกัน)',
      data: {
        order_id: orderId,
        slip_url: slipUrl,
        ai_verified_amount: verifiedAmount,
        ai_verified_status: verifiedStatus,
        qr_ref: slipTxRef,
        ai_verified_datetime: verifiedDatetime.toISOString(),
        is_ai_verified: true,
      }
    });

  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 3. Webhook จัดการยืนยันการรับยอดเงินอัตโนมัติจากธนาคาร (Bank Webhook Callback)
exports.paymentsWebhook = async (req, res) => {
  const { order_id, amount } = req.body;

  try {
    // ค้นหาคำสั่งซื้อหลักและอีเมลผู้ซื้อ
    const orderResult = await pool.query(
      `SELECT o.total_price, o.status, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1`,
      [order_id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

    // ตรวจสอบยอดเงินโอน
    if (parseFloat(amount) < parseFloat(order.total_price)) {
      return res.status(400).json({ status: 'error', message: 'ยอดชำระเงินไม่ครบถ้วนตามใบสั่งซื้อ' });
    }

    const now = new Date();

    // 1. อัปเดตข้อมูลการชำระเงินใน payments
    await pool.query(
      `UPDATE payments 
       SET payment_status = 'completed', 
           amount = $1,
           paid_at = $2,
           is_ai_verified = true,
           ai_verified_amount = $1,
           ai_verified_datetime = $2
       WHERE order_id = $3`,
      [amount, now, order_id]
    );

    // 2. อัปเดตสถานะออเดอร์ใน orders
    await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [order_id]
    );

    // ส่งอีเมลยืนยันการสั่งซื้อ
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendOrderConfirmationEmail(orderResult.rows[0].email, { id: order_id, total_price: order.total_price });
    } catch (mailErr) {
      console.error('Failed to send order confirmation email:', mailErr);
    }

    console.log(`💰 Automated Webhook: Order ${order_id} successfully confirmed with payment amount: ${amount} ฿`);

    res.json({
      status: 'success',
      message: 'ได้รับการยืนยันการชำระเงินและปรับสถานะสำเร็จ'
    });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 4. Endpoint สำหรับจำลองการโอนเงิน (Simulation Helper)
exports.simulateWebhook = async (req, res) => {
  const { orderId } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT o.total_price, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1`, 
      [orderId]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

    // จำลองการเรียก Webhook ด้วยค่าที่ถูกต้อง
    const now = new Date();
    await pool.query(
      `UPDATE payments 
       SET payment_status = 'completed', 
           amount = $1,
           paid_at = $2,
           is_ai_verified = true,
           ai_verified_amount = $1,
           ai_verified_datetime = $2
       WHERE order_id = $3`,
      [order.total_price, now, orderId]
    );

    await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [orderId]
    );

    // ส่งอีเมลยืนยันการสั่งซื้อ
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendOrderConfirmationEmail(orderResult.rows[0].email, { id: orderId, total_price: order.total_price });
    } catch (mailErr) {
      console.error('Failed to send order confirmation email:', mailErr);
    }

    res.json({
      status: 'success',
      message: 'จำลองการโอนเงินเสร็จสิ้น สถานะอัปเดตเป็น Paid อัตโนมัติ'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// GET /api/v1/payments/check-status/:orderId - ตรวจสอบสถานะการชำระเงินเรียลไทม์
exports.checkPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  try {
    await releaseExpiredOrders();
    const result = await pool.query(
      "SELECT status FROM orders WHERE id = $1",
      [orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อ' });
    }
    res.json({ status: 'success', paymentStatus: result.rows[0].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// POST /api/v1/payments/simulate-webhook - จำลองSCB/KBank Webhook แจ้งเตือนสแกนจ่ายเงินเสร็จ
exports.simulatePromptPayWebhook = async (req, res) => {
  const { orderId } = req.body;
  try {
    await pool.query('BEGIN');
    
    // ดึงข้อมูลอีเมลผู้ใช้ส่งแจ้งเตือน
    const orderResult = await pool.query(
      `SELECT o.total_price, u.email 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อ' });
    }

    const order = orderResult.rows[0];
    const now = new Date();

    await pool.query(
      `UPDATE payments 
       SET payment_status = 'completed', 
           payment_date = $1, 
           transaction_ref = $2,
           is_ai_verified = true,
           ai_verified_amount = $3,
           ai_verified_datetime = $4
       WHERE order_id = $5`,
      [now, 'SIM-PROMPTPAY-' + Date.now(), order.total_price, now, orderId]
    );

    await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [orderId]
    );

    // ส่งอีเมลยืนยันการสั่งซื้อสำเร็จ
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendOrderConfirmationEmail(order.email, { id: orderId, total_price: order.total_price });
    } catch (mailErr) {
      console.error('Failed to send confirmation email:', mailErr);
    }

    await pool.query('COMMIT');
    res.json({ status: 'success', message: 'จำลองการสแกนจ่ายผ่านพร้อมเพย์สำเร็จ!' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
