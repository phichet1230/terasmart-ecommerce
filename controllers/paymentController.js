const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

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
    // ดึงรายละเอียดออเดอร์เพื่อเช็กยอดเงินและเจ้าของ
    const orderResult = await pool.query(
      'SELECT id, total_price, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

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

// 2. อัปโหลดสลิปเงินและจำลองการตรวจสอบด้วย AI / OCR
exports.uploadSlip = async (req, res) => {
  const user_id = req.user.id;
  const { orderId } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดไฟล์สลิปชำระเงิน' });
    }

    // ค้นหาออเดอร์และดึงข้อมูลอีเมลผู้ใช้
    const orderResult = await pool.query(
      `SELECT o.id, o.total_price, o.status, u.email 
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

    // 1. คำนวณค่า MD5 Hash ของภาพสลิปเพื่อระบุรหัสธุรกรรมเฉพาะ (Transaction Reference)
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 2. ตรวจสอบการอัปโหลดสลิปซ้ำ (Duplicate Slip Detection)
    const duplicateCheck = await pool.query(
      "SELECT order_id FROM payments WHERE transaction_ref = $1 AND payment_status = 'completed'",
      [fileHash]
    );

    if (duplicateCheck.rows.length > 0) {
      fs.unlinkSync(req.file.path); // ลบไฟล์สลิปที่ซ้ำออก
      return res.status(400).json({ 
        status: 'error', 
        message: 'สลิปนี้เคยใช้ชำระเงินในระบบไปแล้ว (ตรวจพบรหัสธุรกรรมซ้ำในระบบ)' 
      });
    }

    // จำลอง URL ของไฟล์ที่อัปโหลด
    const slipUrl = `/uploads/${req.file.filename}`;

    // ทำ AI OCR Verification Simulator
    // ในสลิปปกติจะอ่าน ยอดเงิน วันเวลา และตรวจเช็กกับ API ธนาคาร
    const verifiedAmount = parseFloat(order.total_price);
    const verifiedDatetime = new Date(); // เวลาปัจจุบัน

    // อัปเดตข้อมูลการชำระเงินใน payments
    await pool.query(
      `UPDATE payments 
       SET slip_url = $1, 
           ai_verified_amount = $2, 
           ai_verified_datetime = $3, 
           is_ai_verified = true, 
           payment_status = 'completed',
           paid_at = $4,
           transaction_ref = $5
       WHERE order_id = $6`,
      [slipUrl, verifiedAmount, verifiedDatetime, verifiedDatetime, fileHash, orderId]
    );

    // อัปเดตสถานะของออเดอร์จาก pending เป็น paid
    await pool.query(
      `UPDATE orders SET status = 'paid' WHERE id = $1`,
      [orderId]
    );

    // ส่งอีเมลยืนยันการสั่งซื้อ
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendOrderConfirmationEmail(order.email, order);
    } catch (mailErr) {
      console.error('Failed to send order confirmation email:', mailErr);
    }

    res.json({
      status: 'success',
      message: 'อัปโหลดและตรวจสอบสลิปสำเร็จ (ระบบ AI ยืนยันยอดเงินตรงกัน)',
      data: {
        order_id: orderId,
        slip_url: slipUrl,
        ai_verified_amount: verifiedAmount,
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
