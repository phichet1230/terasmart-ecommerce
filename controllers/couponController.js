const pool = require('../config/db');

exports.validateCoupon = async (req, res) => {
  const { code, order_amount } = req.body;

  if (!code) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกรหัสคูปอง' });
  }

  try {
    const couponResult = await pool.query(
      'SELECT * FROM coupons WHERE code = $1',
      [code.trim().toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรหัสคูปองส่วนลดนี้' });
    }

    const coupon = couponResult.rows[0];
    const now = new Date();

    // 1. ตรวจสอบวันหมดอายุ
    if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
      return res.status(400).json({ status: 'error', message: 'คูปองส่วนลดนี้หมดอายุแล้ว' });
    }

    // 2. ตรวจสอบจำนวนสิทธิ์ที่จำกัด
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ status: 'error', message: 'คูปองส่วนลดนี้มีผู้ใช้งานเต็มจำนวนสิทธิ์แล้ว' });
    }

    // 3. ตรวจสอบยอดสั่งซื้อขั้นต่ำ
    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (parseFloat(order_amount) < minAmount) {
      return res.status(400).json({
        status: 'error',
        message: `ยอดสั่งซื้อยังไม่ถึงเกณฑ์ขั้นต่ำ (ยอดขั้นต่ำ: ${minAmount.toFixed(2)} บาท)`
      });
    }

    res.json({
      status: 'success',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        min_order_amount: parseFloat(coupon.min_order_amount),
        expiry_date: coupon.expiry_date,
        usage_limit: coupon.usage_limit,
        used_count: coupon.used_count
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};
