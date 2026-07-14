const pool = require('../config/db');

// 1. ตรวจสอบความถูกต้องของคูปอง (Validate Promo Code)
exports.validateCoupon = async (req, res) => {
  const { code, order_amount } = req.body;

  if (!code) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุรหัสคูปอง' });
  }

  try {
    const couponResult = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP) 
       LIMIT 1`,
      [code.trim().toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคูปองส่วนลดนี้ หรือคูปองหมดอายุแล้ว' });
    }

    const coupon = couponResult.rows[0];

    // ตรวจสอบลิมิตการใช้งาน
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ status: 'error', message: 'สิทธิ์การใช้งานคูปองนี้เต็มแล้ว' });
    }

    // ตรวจสอบยอดสั่งซื้อขั้นต่ำ
    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (parseFloat(order_amount) < minAmount) {
      return res.status(400).json({ 
        status: 'error', 
        message: `ยอดสั่งซื้อยังไม่ถึงขั้นต่ำสำหรับคูปองนี้ (ขั้นต่ำ: ${minAmount.toFixed(2)} ฿)` 
      });
    }

    res.json({
      status: 'success',
      message: 'ใช้คูปองส่วนลดสำเร็จ',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        min_order_amount: minAmount
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
