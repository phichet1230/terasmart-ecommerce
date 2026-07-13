const pool = require('../config/db');

// 1. สร้างคำสั่งซื้อใหม่ (Checkout จากตะกร้า)
exports.createOrder = async (req, res) => {
  const user_id = req.user.id;
  const { address_id, coupon_id = null } = req.body;

  if (!address_id) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุที่อยู่จัดส่ง' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. ดึงข้อมูลที่อยู่จัดส่ง และตรวจสอบว่าเป็นของคนนี้จริง
    const addressCheck = await client.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [address_id, user_id]);
    if (addressCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'ไม่พบที่อยู่จัดส่งนี้' });
    }

    // 2. ดึงสินค้าในตะกร้า
    const cartResult = await client.query(`
      SELECT ci.id, ci.variant_id, ci.quantity, v.price, v.stock_quantity, v.variant_name
      FROM cart_items ci
      JOIN product_variants v ON ci.variant_id = v.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = $1
    `, [user_id]);

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'ไม่มีสินค้าในตะกร้า' });
    }

    // 3. ตรวจสอบสต็อกสินค้าทุกชิ้น
    for (const item of cartResult.rows) {
      if (item.quantity > item.stock_quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          status: 'error', 
          message: `สินค้า ${item.variant_name} ในสต็อกไม่เพียงพอ (สต็อกปัจจุบัน: ${item.stock_quantity})` 
        });
      }
    }

    // 4. คำนวณเงิน
    let subtotal = 0;
    for (const item of cartResult.rows) {
      subtotal += parseFloat(item.price) * item.quantity;
    }

    let discount_amount = 0.00;
    
    // 4.1 ตรวจสอบและคำนวณส่วนลดจากคูปอง
    if (coupon_id) {
      const couponCheck = await client.query('SELECT * FROM coupons WHERE id = $1', [coupon_id]);
      if (couponCheck.rows.length > 0) {
        const coupon = couponCheck.rows[0];
        
        // ตรวจสอบความถูกต้องของวันหมดอายุ ขีดจำกัดการใช้งาน และยอดซื้อขั้นต่ำ
        const isNotExpired = !coupon.expiry_date || new Date(coupon.expiry_date) > new Date();
        const isNotOverLimit = !coupon.usage_limit || coupon.used_count < coupon.usage_limit;
        const meetsMinAmount = subtotal >= parseFloat(coupon.min_order_amount || 0);
        
        if (isNotExpired && isNotOverLimit && meetsMinAmount) {
          if (coupon.discount_type === 'percentage') {
            discount_amount = parseFloat((subtotal * (parseFloat(coupon.discount_value) / 100)).toFixed(2));
          } else if (coupon.discount_type === 'fixed') {
            discount_amount = parseFloat(parseFloat(coupon.discount_value).toFixed(2));
          }
          
          // บันทึกการใช้งานคูปองเพิ่ม 1 สิทธิ์
          await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [coupon_id]);
        }
      }
    }

    const tax_amount = parseFloat((subtotal * 0.07).toFixed(2)); // ภาษี 7%
    const total_price = Math.max(0.00, subtotal + tax_amount - discount_amount);

    // 5. บันทึกลงตาราง orders
    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, coupon_id, subtotal, discount_amount, total_price, tax_amount, status, address_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, total_price, created_at`,
      [user_id, coupon_id, subtotal, discount_amount, total_price, tax_amount, 'pending', address_id]
    );
    const order_id = orderInsert.rows[0].id;

    // 6. ย้ายข้อมูลจากตะกร้าไปที่ order_items และอัปเดตสต็อกสินค้า
    for (const item of cartResult.rows) {
      // บันทึก order_item
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order_id, item.variant_id, item.quantity, item.price]
      );

      // ตัดสต็อกสินค้าอัตโนมัติ
      await client.query(
        `UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, item.variant_id]
      );
    }

    // 7. เคลียร์ตะกร้าสินค้าของผู้ใช้
    const userCart = await client.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
    if (userCart.rows.length > 0) {
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [userCart.rows[0].id]);
    }

    // 8. สร้างแถวเริ่มต้นในตาราง payments
    await client.query(
      `INSERT INTO payments (order_id, amount, payment_status) VALUES ($1, $2, $3)`,
      [order_id, total_price, 'pending']
    );

    // 9. สร้างแถวเริ่มต้นในตาราง shipping
    await client.query(
      `INSERT INTO shipping (order_id, status) VALUES ($1, $2)`,
      [order_id, 'preparing']
    );

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', message: 'สั่งซื้อสินค้าสำเร็จ', data: orderInsert.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

// 2. ดึงประวัติการสั่งซื้อของผู้ใช้
exports.getMyOrders = async (req, res) => {
  const user_id = req.user.id;
  try {
    const ordersResult = await pool.query(
      `SELECT o.*, 
              s.tracking_number, s.courier_name, s.status as shipping_status,
              p.method as payment_method, p.payment_status, p.slip_url
       FROM orders o
       LEFT JOIN shipping s ON o.id = s.order_id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    res.json({ status: 'success', data: ordersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 3. ดึงรายละเอียดออเดอร์เดี่ยว (พร้อมรายการสินค้า)
exports.getOrderDetail = async (req, res) => {
  const user_id = req.user.id;
  const order_id = req.params.id;

  try {
    // ดึงออเดอร์หลัก
    const orderResult = await pool.query(
      `SELECT o.*, 
              s.tracking_number, s.courier_name, s.status as shipping_status,
              p.method as payment_method, p.payment_status, p.slip_url,
              a.receiver_name, a.phone, a.address_detail, a.sub_district, a.district, a.province, a.postal_code
       FROM orders o
       LEFT JOIN shipping s ON o.id = s.order_id
       LEFT JOIN payments p ON o.id = p.order_id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [order_id, user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderResult.rows[0];

    // ดึงรายการสินค้าในออเดอร์
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name, p.slug as product_slug, v.variant_name
       FROM order_items oi
       JOIN product_variants v ON oi.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       WHERE oi.order_id = $1`,
      [order_id]
    );
    order.items = itemsResult.rows;

    res.json({ status: 'success', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
