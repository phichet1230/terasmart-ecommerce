const nodemailer = require('nodemailer');

const smtpUser = process.env.SMTP_USER || 'oppo0620255009@gmail.com';
const smtpPass = (process.env.SMTP_PASS || 'eovlkoywyobdutap').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * ส่งอีเมลรหัสยืนยันการกู้คืนรหัสผ่าน
 * @param {string} toEmail - อีเมลผู้รับ
 * @param {string} token - รหัส PIN กู้คืน 6 หลัก
 */
exports.sendRecoveryEmail = async (toEmail, token) => {
  const mailOptions = {
    from: `"TeraSmart E-Commerce" <${process.env.SMTP_USER || 'no-reply@terasmart.com'}>`,
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

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Real email sent successfully to ${toEmail}`);
};

/**
 * ส่งอีเมลยืนยันการรับชำระเงินและคำสั่งซื้อสินค้าสำเร็จ
 * @param {string} toEmail - อีเมลผู้รับ
 * @param {object} order - ข้อมูลคำสั่งซื้อ { id, total_price, ... }
 */
exports.sendOrderConfirmationEmail = async (toEmail, order) => {
  const mailOptions = {
    from: `"TeraSmart E-Commerce" <${process.env.SMTP_USER || 'no-reply@terasmart.com'}>`,
    to: toEmail,
    subject: `ยืนยันการชำระเงินและคำสั่งซื้อสำเร็จ #${order.id.substring(0, 8)}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ff3201; text-align: center;">ยืนยันคำสั่งซื้อและชำระเงินสำเร็จ</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p>สวัสดีคุณลูกค้า,</p>
        <p>เราได้รับการยืนยันการชำระเงินสำหรับคำสั่งซื้อของคุณเรียบร้อยแล้ว รายละเอียดออเดอร์มีดังนี้:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>หมายเลขคำสั่งซื้อ:</strong> ${order.id}</p>
          <p><strong>ยอดชำระเงินสุทธิ:</strong> ${parseFloat(order.total_price).toFixed(2)} ฿</p>
          <p><strong>สถานะออเดอร์:</strong> ชำระเงินเรียบร้อย (Paid)</p>
          <p><strong>วันเวลาที่ชำระเงิน:</strong> ${new Date().toLocaleString('th-TH')}</p>
        </div>
        <p>เราจะรีบเตรียมการจัดส่งพัสดุให้คุณโดยเร็วที่สุด คุณสามารถติดตามสถานะการจัดส่งได้จากเมนูประวัติการสั่งซื้อบนเว็บไซต์</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">© TeraSmart E-Commerce. All rights reserved.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Real order confirmation email sent successfully to ${toEmail}`);
  } catch (e) {
    console.error('Order email notice:', e.message);
  }
};
