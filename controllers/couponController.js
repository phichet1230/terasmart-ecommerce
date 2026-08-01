const pool = require('../config/db');

exports.validateCoupon = async (req, res) => {
  const { code, order_amount, subtotal, orderItems } = req.body;

  if (!code || !code.trim()) {
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

    // คำนวณยอดซื้อรวมสำหรับตรวจสอบและคำนวณส่วนลด
    let calcSubtotal = parseFloat(order_amount || subtotal || 0);
    if ((!calcSubtotal || isNaN(calcSubtotal) || calcSubtotal === 0) && Array.isArray(orderItems)) {
      calcSubtotal = orderItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const itemQty = parseInt(item.quantity || item.qty || 1, 10);
        return sum + (itemPrice * itemQty);
      }, 0);
    }

    // 3. ตรวจสอบยอดสั่งซื้อขั้นต่ำ
    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (calcSubtotal < minAmount) {
      return res.status(400).json({
        status: 'error',
        message: `ยอดสั่งซื้อยังไม่ถึงเกณฑ์ขั้นต่ำสำหรับคูปองนี้ (ยอดขั้นต่ำ: ${minAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท)`
      });
    }

    // 4. คำนวณจำนวนเงินส่วนลด (discount_amount)
    let discount_amount = 0;
    const discountVal = parseFloat(coupon.discount_value || 0);
    if (coupon.discount_type === 'percentage') {
      discount_amount = parseFloat((calcSubtotal * (discountVal / 100)).toFixed(2));
    } else if (coupon.discount_type === 'fixed') {
      discount_amount = parseFloat(Math.min(calcSubtotal, discountVal).toFixed(2));
    }

    res.json({
      status: 'success',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountVal,
        min_order_amount: minAmount,
        discount_amount: discount_amount,
        expiry_date: coupon.expiry_date,
        usage_limit: coupon.usage_limit,
        used_count: coupon.used_count
      }
    });

  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
