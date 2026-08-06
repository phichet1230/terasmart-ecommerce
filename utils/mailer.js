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
exports.sendOrderConfirmationEmail = async (toEmail, order) => {
  const mailOptions = {
    from: `"TeraSmart E-Commerce" <${smtpUser}>`,
    to: toEmail,
    subject: `ยืนยันการชำระเงินและคำสั่งซื้อสำเร็จ #${order.id.substring(0, 8)}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ff3201; text-align: center;">ยืนยันคำสั่งซื้อและชำระเงินสำเร็จ</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p>เราจะรีบเตรียมการจัดส่งพัสดุให้คุณโดยเร็วที่สุด คุณสามารถติดตามสถานะการจัดส่งได้จากเมนูประวัติการสั่งซื้อบนเว็บไซต์</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">© TeraSmart E-Commerce. All rights reserved.</p>
      </div>
    `
  };

  try {
    return await sendEmailWithFallback(mailOptions);
  } catch (e) {
    console.error('Order email notice:', e.message);
  }
};
