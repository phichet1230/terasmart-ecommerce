const nodemailer = require('nodemailer');
const dns = require('dns');

const rawUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
const rawPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '';

const smtpUser = rawUser !== '' ? rawUser : 'oppo0620255009@gmail.com';
const smtpPass = rawPass !== '' ? rawPass.replace(/\s+/g, '') : 'eovlkoywyobdutap';

const createTransporter = (port, secure) => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port,
  secure,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
  tls: { rejectUnauthorized: false }
});

const transporter465 = createTransporter(465, true);
const transporter587 = createTransporter(587, false);
const transporter25 = createTransporter(25, false);

global.emailLogs = global.emailLogs || [];

const sendEmailWithFallback = async (mailOptions) => {
  const logEntry = { timestamp: new Date().toISOString(), to: mailOptions.to, status: 'pending', smtpUser };
  
  // Try Port 465 SSL first
  try {
    const info = await transporter465.sendMail(mailOptions);
    console.log(`✉️ Email sent via Port 465 to ${mailOptions.to} (ID: ${info.messageId})`);
    logEntry.status = 'success';
    logEntry.port = 465;
    logEntry.messageId = info.messageId;
    global.emailLogs.unshift(logEntry);
    if (global.emailLogs.length > 50) global.emailLogs.pop();
    return info;
  } catch (err465) {
    console.warn('⚠️ Port 465 dispatch notice:', err465.message, '- Trying Port 587 STARTTLS fallback...');
    // Try Port 587 STARTTLS fallback
    try {
      const info = await transporter587.sendMail(mailOptions);
      console.log(`✉️ Email sent via Port 587 to ${mailOptions.to} (ID: ${info.messageId})`);
      logEntry.status = 'success';
      logEntry.port = 587;
      logEntry.messageId = info.messageId;
      global.emailLogs.unshift(logEntry);
      if (global.emailLogs.length > 50) global.emailLogs.pop();
      return info;
    } catch (err587) {
      console.warn('⚠️ Port 587 dispatch notice:', err587.message, '- Trying Port 25 TLS fallback...');
      // Try Port 25 TLS fallback
      try {
        const info = await transporter25.sendMail(mailOptions);
        console.log(`✉️ Email sent via Port 25 to ${mailOptions.to} (ID: ${info.messageId})`);
        logEntry.status = 'success';
        logEntry.port = 25;
        logEntry.messageId = info.messageId;
        global.emailLogs.unshift(logEntry);
        if (global.emailLogs.length > 50) global.emailLogs.pop();
        return info;
      } catch (err25) {
        console.error('❌ All SMTP ports failed to dispatch email:', err25.message);
        logEntry.status = 'failed';
        logEntry.error = err25.message;
        logEntry.stack = err25.stack;
        global.emailLogs.unshift(logEntry);
        if (global.emailLogs.length > 50) global.emailLogs.pop();
        throw err25;
      }
    }
  }
};

/**
 * ส่งอีเมลรหัสยืนยันการกู้คืนรหัสผ่าน
 * @param {string} toEmail - อีเมลผู้รับ
 * @param {string} token - รหัส PIN กู้คืน 6 หลัก
 */
exports.sendRecoveryEmail = async (toEmail, token) => {
  const mailOptions = {
    from: `"TeraSmart E-Commerce" <${smtpUser}>`,
    to: toEmail,
    subject: 'รหัสลับกู้คืนรหัสผ่านของคุณ (TeraSmart E-Commerce)',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ff3201; text-align: center;">กู้คืนบัญชีผู้ใช้งาน TeraSmart</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p>สวัสดีคุณผู้ใช้งาน,</p>
        <p>เราได้รับคำขอในการรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาใช้รหัส PIN 6 หลักด้านล่างนี้ในหน้าจอกู้คืนรหัสผ่าน:</p>
        <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ff3201;">${token}</span>
        </div>
        <p style="color: #666666; font-size: 12px; text-align: center;">รหัสลับนี้มีอายุการใช้งาน 15 นาทีนับจากได้รับอีเมลฉบับนี้ หากคุณไม่ได้ทำรายการกู้คืนรหัสผ่าน โปรดมองข้ามอีเมลฉบับนี้</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">© TeraSmart E-Commerce. All rights reserved.</p>
      </div>
    `
  };

  return await sendEmailWithFallback(mailOptions);
};

/**
 * ส่งอีเมลยืนยันการรับชำระเงินและคำสั่งซื้อสินค้าสำเร็จ
 * @param {string} toEmail - อีเมลผู้รับ
 * @param {object} order - ข้อมูลคำสั่งซื้อ { id, total_price, ... }
 */
/**
 * ส่งอีเมลยืนยันการรับชำระเงินและคำสั่งซื้อสินค้าสำเร็จ (Professional E-Commerce HTML Receipt)
 * @param {string} toEmail - อีเมลผู้รับ
 * @param {object} order - ข้อมูลคำสั่งซื้อ { id, total_price, subtotal, tax_amount, discount_amount, items, receiver_name, address_detail, province, district, phone }
 */
exports.sendOrderConfirmationEmail = async (toEmail, order) => {
  const orderIdShort = order.id ? order.id.substring(0, 8) : 'N/A';
  const totalPriceFormatted = order.total_price ? parseFloat(order.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00';
  const subtotalFormatted = order.subtotal ? parseFloat(order.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : totalPriceFormatted;
  const taxFormatted = order.tax_amount ? parseFloat(order.tax_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00';
  const discountFormatted = order.discount_amount ? parseFloat(order.discount_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00';

  const orderItemsHtml = (order.items && Array.isArray(order.items) && order.items.length > 0)
    ? order.items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; vertical-align: middle;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.product_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=80&h=80'}" alt="${item.product_name || 'สินค้า'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div>
                <strong style="color: #1a202c; font-size: 14px; display: block;">${item.product_name || 'รายการสินค้า'}</strong>
                <span style="color: #718096; font-size: 12px;">${item.variant_name ? `ตัวเลือก: ${item.variant_name}` : ''}</span>
              </div>
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center; color: #4a5568; font-weight: 600; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; color: #2d3748; font-weight: 600; font-size: 14px;">
            ${(parseFloat(item.price || 0) * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="3" style="padding: 16px; text-align: center; color: #718096;">รายการสินค้าตามคำสั่งซื้อ #${orderIdShort}</td>
        </tr>
      `;

  const mailOptions = {
    from: `"TERA Smart E-Commerce" <${smtpUser}>`,
    to: toEmail,
    subject: `🎉 ยืนยันคำสั่งซื้อสำเร็จ #${orderIdShort} - TERA Smart E-Commerce`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7fafc; margin: 0; padding: 20px; color: #2d3748; }
          .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #FF3201 0%, #E02B00 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
          .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-top: 12px; border: 1px solid rgba(255,255,255,0.3); }
          .content { padding: 30px 24px; }
          .section-title { font-size: 16px; font-weight: 700; color: #1a202c; margin-bottom: 12px; border-bottom: 2px solid #FF3201; display: inline-block; padding-bottom: 4px; }
          .table-items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .table-items th { background: #edf2f7; color: #4a5568; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; }
          .summary-box { background: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #4a5568; }
          .summary-row.total { border-top: 2px dashed #cbd5e0; padding-top: 10px; font-size: 18px; font-weight: 800; color: #FF3201; margin-bottom: 0; }
          .address-card { background: #fffaf0; border: 1px solid #feebc8; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .btn-track { display: block; width: 100%; max-width: 260px; margin: 24px auto 0 auto; padding: 14px 20px; background: #FF3201; color: #ffffff; text-align: center; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 30px; box-shadow: 0 4px 12px rgba(255,50,1,0.3); }
          .footer { background: #edf2f7; padding: 20px; text-align: center; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TERA SMART E-COMMERCE</h1>
            <p>ยืนยันการรับชำระเงินและคำสั่งซื้อเรียบร้อยแล้ว</p>
            <div class="badge">เลขที่ใบสั่งซื้อ #${orderIdShort}</div>
          </div>
          
          <div class="content">
            <p style="font-size: 15px; line-height: 1.6; color: #2d3748;">
              เรียนคุณผู้ใช้งาน,<br>
              ขอขอบพระคุณสำหรับการสั่งซื้อสินค้ากับ <strong>TERA Smart E-Commerce</strong> ทางเราได้รับยอดชำระเงินของคุณเรียบร้อยแล้ว และกำลังดำเนินการจัดเตรียมสินค้าเพื่อจัดส่งโดยเร็วที่สุด
            </p>

            <div class="section-title">รายการสินค้าที่สั่งซื้อ</div>
            <table class="table-items">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th style="text-align: center;">จำนวน</th>
                  <th style="text-align: right;">ราคารวม</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-row">
                <span>ราคาสินค้า (Subtotal):</span>
                <span>${subtotalFormatted} ฿</span>
              </div>
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                <span>${taxFormatted} ฿</span>
              </div>
              ${parseFloat(discountFormatted) > 0 ? `
              <div class="summary-row" style="color: #38a169;">
                <span>ส่วนลดคูปอง (Discount):</span>
                <span>-${discountFormatted} ฿</span>
              </div>
              ` : ''}
              <div class="summary-row total">
                <span>ยอดชำระสุทธิ (Grand Total):</span>
                <span>${totalPriceFormatted} ฿</span>
              </div>
            </div>

            ${order.address_detail ? `
            <div class="address-card">
              <strong style="color: #c05621; font-size: 14px; display: block; margin-bottom: 6px;">📍 ที่อยู่สำหรับจัดส่งพัสดุ:</strong>
              <span style="font-size: 14px; color: #7b341e; line-height: 1.5;">
                <strong>${order.receiver_name || ''}</strong> (${order.phone || ''})<br>
                ${order.address_detail} ${order.sub_district || ''} ${order.district || ''} ${order.province || ''} ${order.postal_code || ''}
              </span>
            </div>
            ` : ''}

            <a href="https://terasmart-ecommerce-silk.vercel.app" class="btn-track" target="_blank">
              🚚 ติดตามสถานะคำสั่งซื้อ
            </a>
          </div>

          <div class="footer">
            <p style="margin: 0 0 6px 0;">หากมีข้อสงสัยประการใด สามารถติดต่อทีมงานบริการลูกค้าผ่านทางเว็บไซต์ได้ตลอด 24 ชม.</p>
            <p style="margin: 0;">© TERA Smart E-Commerce. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    return await sendEmailWithFallback(mailOptions);
  } catch (e) {
    console.error('Order email notice:', e.message);
  }
};
