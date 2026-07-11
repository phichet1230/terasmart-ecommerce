const pool = require('../config/db');

// GET /api/v1/payment-methods - ดึงรายการวิธีชำระเงิน
exports.getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, id ASC',
      [req.user.id]
    );
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// POST /api/v1/payment-methods - บันทึกวิธีชำระเงิน
// รองรับประเภท: 'promptpay' เท่านั้น (ตามที่ระบุ)
exports.addPaymentMethod = async (req, res) => {
  const { type, label, promptpay_number, is_default } = req.body;

  if (!type || type !== 'promptpay') {
    return res.status(400).json({ status: 'error', message: 'รองรับเฉพาะประเภท promptpay เท่านั้น' });
  }
  if (!promptpay_number) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุเบอร์โทร/เลขประจำตัวสำหรับ PromptPay' });
  }

  try {
    if (is_default) {
      await pool.query('UPDATE payment_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const existing = await pool.query('SELECT COUNT(*) FROM payment_methods WHERE user_id = $1', [req.user.id]);
    const forceDefault = parseInt(existing.rows[0].count) === 0 ? true : !!is_default;

    const result = await pool.query(
      `INSERT INTO payment_methods (user_id, type, label, promptpay_number, is_default)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, type, label || 'PromptPay', promptpay_number, forceDefault]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// DELETE /api/v1/payment-methods/:id - ลบวิธีชำระเงิน
exports.deletePaymentMethod = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการนี้' });
    }

    await pool.query('DELETE FROM payment_methods WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'ลบวิธีชำระเงินสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// PATCH /api/v1/payment-methods/:id/set-default - ตั้งเป็น default
exports.setDefaultPaymentMethod = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการนี้' });
    }

    await pool.query('UPDATE payment_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
    const result = await pool.query('UPDATE payment_methods SET is_default = true WHERE id = $1 RETURNING *', [id]);

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// GET /api/v1/payment-methods/promptpay-qr?amount=XXX - สร้าง QR PromptPay พร้อมราคา
// ใช้ข้อมูลจาก PROMPTPAY_ID ใน .env (บัญชีบริษัท) และ generate QR via promptpay-qr library
exports.getPromptPayQR = async (req, res) => {
  const { amount } = req.query;
  const promptpayId = process.env.PROMPTPAY_ID;

  if (!promptpayId) {
    return res.status(503).json({
      status: 'error',
      message: 'ยังไม่ได้ตั้งค่าบัญชี PromptPay ของบริษัท กรุณาตั้งค่า PROMPTPAY_ID ใน .env'
    });
  }

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุจำนวนเงินที่ถูกต้อง' });
  }

  try {
    const generatePayload = require('promptpay-qr');
    const qrcode = require('qrcode');

    const payload = generatePayload(promptpayId, { amount: parsedAmount });
    const qrDataUrl = await qrcode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    res.json({
      status: 'success',
      data: {
        promptpay_id: promptpayId,
        amount: parsedAmount,
        currency: 'THB',
        qr_image: qrDataUrl  // base64 PNG - frontend สามารถ <img src="data:..."> หรือบันทึกเป็นไฟล์ได้
      }
    });
  } catch (err) {
    console.error('PromptPay QR generation error:', err);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถสร้าง QR ได้' });
  }
};
