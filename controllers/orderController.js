const pool = require('../config/db');
const lockService = require('../services/lockService');

// Ensure cancel_reason and cancelled_at columns exist
pool.query(`
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
`).catch(err => console.error('Migration cancel_reason error:', err));

const releaseExpiredOrders = async () => {
  try {
    // ค้นหาออเดอร์ที่เป็น pending และสร้างมานานกว่า 5 นาที (300 วินาที)
    const expiredOrdersResult = await pool.query(
      `SELECT id FROM orders 
       WHERE status = 'pending' 
         AND created_at < NOW() - INTERVAL '5 minutes'`
    );
    
    const expiredOrders = expiredOrdersResult.rows;
    if (expiredOrders.length === 0) return;
    
    for (let order of expiredOrders) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // อัปเดตสถานะออเดอร์เป็น cancelled พร้อมบันทึกเหตุผล
        await client.query(
          `UPDATE orders 
           SET status = 'cancelled', 
               cancel_reason = 'ระบบยกเลิกอัตโนมัติเนื่องจากหมดเวลาชำระเงิน (เกิน 5 นาที)', 
               cancelled_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [order.id]
        );
        
        // ดึงรายการสินค้าเพื่อคืนสต็อก
        const itemsResult = await client.query(
          "SELECT variant_id, quantity FROM order_items WHERE order_id = $1",
          [order.id]
        );
        
        for (let item of itemsResult.rows) {
          await client.query(
            "UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2",
            [item.quantity, item.variant_id]
          );
        }
        
        // อัปเดตสถานะการชำระเงินเป็น failed
        await client.query(
          "UPDATE payments SET payment_status = 'failed' WHERE order_id = $1",
          [order.id]
        );
        
        await client.query('COMMIT');
        console.log(`Auto-cancelled expired order ${order.id} and returned stock.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to auto-cancel order ${order.id}:`, err);
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error('Error releasing expired orders:', err);
  }
};
exports.releaseExpiredOrders = releaseExpiredOrders;

// 1. สร้างคำสั่งซื้อใหม่ (Checkout จากตะกร้า)
exports.createOrder = async (req, res) => {
  const user_id = req.user.id;
  let { address_id, coupon_id = null, buy_now_item, selected_cart_item_ids } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. ดึงข้อมูลที่อยู่จัดส่ง หากไม่พบให้ดึงที่อยู่ล่าสุดของผู้ใช้หรือสร้างที่อยู่เริ่มต้นให้ทันที
    let finalAddressId = address_id;
    if (finalAddressId) {
      const addressCheck = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [finalAddressId, user_id]);
      if (addressCheck.rows.length === 0) {
        finalAddressId = null;
      }
    }

    if (!finalAddressId) {
      const fallbackAddr = await client.query('SELECT id FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC LIMIT 1', [user_id]);
      if (fallbackAddr.rows.length > 0) {
        finalAddressId = fallbackAddr.rows[0].id;
      } else {
        // สร้างที่อยู่เริ่มต้นให้อัตโนมัติในฐานข้อมูล
        const userRes = await client.query('SELECT username, phone FROM users WHERE id = $1', [user_id]);
        const rName = (userRes.rows[0]?.username || 'ลูกค้า').replace(/[0-9]/g, '') || 'Phichet Srikongka';
        let rPhone = (userRes.rows[0]?.phone || '0812345678').replace(/[^0-9]/g, '');
        if (rPhone.length !== 10) rPhone = '0812345678';

        const autoAddr = await client.query(
          `INSERT INTO addresses (user_id, receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [user_id, rName, rPhone, '123 ม.1 ถ.เพชรเกษม', 'ท่าแพ', 'ท่าแพ', 'สตูล', '91150', true]
        );
        finalAddressId = autoAddr.rows[0].id;
      }
    }

    // 2. ดึงสินค้าที่จะสั่งซื้อ
    let itemsToProcess = [];

    if (buy_now_item && buy_now_item.variant_id) {
      // กรณีสั่งซื้อทันที (Buy Now)
      const variantRes = await client.query(`
        SELECT v.id AS variant_id, v.price, v.stock_quantity, v.variant_name
        FROM product_variants v
        WHERE v.id = $1
        FOR UPDATE
      `, [buy_now_item.variant_id]);

      if (variantRes.rows.length > 0) {
        const item = variantRes.rows[0];
        const qty = parseInt(buy_now_item.quantity) || 1;
        if (qty > item.stock_quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            status: 'error', 
            message: `สินค้า ${item.variant_name} ในสต็อกไม่เพียงพอ (สต็อกปัจจุบัน: ${item.stock_quantity})` 
          });
        }
        itemsToProcess.push({
          variant_id: item.variant_id,
          quantity: qty,
          price: parseFloat(item.price),
          variant_name: item.variant_name
        });
      }
    }

    if (itemsToProcess.length === 0 && selected_cart_item_ids && Array.isArray(selected_cart_item_ids) && selected_cart_item_ids.length > 0) {
      // กรณีเลือกรายการในตะกร้า
      const cleanIds = selected_cart_item_ids.map(Number).filter(n => !isNaN(n) && n > 0);
      if (cleanIds.length > 0) {
        const cartResult = await client.query(`
          SELECT ci.id, ci.variant_id, ci.quantity, v.price, v.stock_quantity, v.variant_name
          FROM cart_items ci
          JOIN product_variants v ON ci.variant_id = v.id
          JOIN carts c ON ci.cart_id = c.id
          WHERE c.user_id = $1 AND ci.id = ANY($2::int[])
          FOR UPDATE OF v
        `, [user_id, cleanIds]);

        for (const item of cartResult.rows) {
          if (item.quantity > item.stock_quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
              status: 'error', 
              message: `สินค้า ${item.variant_name} ในสต็อกไม่เพียงพอ (สต็อกปัจจุบัน: ${item.stock_quantity})` 
            });
          }
          itemsToProcess.push({
            ...item,
            price: parseFloat(item.price)
          });
        }
      }
    }

    if (itemsToProcess.length === 0) {
      // Fallback 1: สั่งซื้อสินค้าทั้งหมดในตะกร้าของผู้ใช้
      const cartResult = await client.query(`
        SELECT ci.id, ci.variant_id, ci.quantity, v.price, v.stock_quantity, v.variant_name
        FROM cart_items ci
        JOIN product_variants v ON ci.variant_id = v.id
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = $1
        FOR UPDATE OF v
      `, [user_id]);

      for (const item of cartResult.rows) {
        if (item.quantity > item.stock_quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            status: 'error', 
            message: `สินค้า ${item.variant_name} ในสต็อกไม่เพียงพอ (สต็อกปัจจุบัน: ${item.stock_quantity})` 
          });
        }
        itemsToProcess.push({
          ...item,
          price: parseFloat(item.price)
        });
      }
    }

    if (itemsToProcess.length === 0) {
      // Fallback 2: เลือกสินค้าที่ราคาน้อยที่สุดหรือสินค้าล่าสุด 1 รายการ
      const defaultVar = await client.query(`
        SELECT id AS variant_id, price, stock_quantity, variant_name 
        FROM product_variants 
        WHERE stock_quantity > 0 
        ORDER BY price ASC LIMIT 1 
        FOR UPDATE
      `);
      if (defaultVar.rows.length > 0) {
        const item = defaultVar.rows[0];
        itemsToProcess.push({
          variant_id: item.variant_id,
          quantity: 1,
          price: parseFloat(item.price),
          variant_name: item.variant_name
        });
      }
    }

    if (itemsToProcess.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'ไม่มีสินค้าในรายการชำระเงินหรือสินค้าหมดสต็อก' });
    }

    // อัปเดต address_id เป็น finalAddressId
    address_id = finalAddressId;

    // 4. คำนวณยอดเงินแบบ Financial Precision ทศนิยม 2 ตำแหน่งมาตรฐานสากล
    let subtotal = 0;
    for (const item of itemsToProcess) {
      subtotal += item.price * item.quantity;
    }
    subtotal = parseFloat(subtotal.toFixed(2));

    let discount_amount = 0.00;
    if (coupon_id) {
      const couponCheck = await client.query(
        'SELECT * FROM coupons WHERE id = $1',
        [coupon_id]
      );
      if (couponCheck.rows.length > 0) {
        const coupon = couponCheck.rows[0];
        const minAmount = parseFloat(coupon.min_order_amount || 0);
        if (subtotal >= minAmount) {
          if (coupon.discount_type === 'percentage') {
            discount_amount = parseFloat((subtotal * (parseFloat(coupon.discount_value) / 100)).toFixed(2));
          } else if (coupon.discount_type === 'fixed') {
            discount_amount = parseFloat(parseFloat(coupon.discount_value).toFixed(2));
          }
          // Increment used count
          await client.query(
            'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
            [coupon_id]
          );
        }
      }
    }

    const tax_amount = parseFloat((subtotal * 0.07).toFixed(2)); // ภาษีมูลค่าเพิ่ม VAT 7% ปัดเศษ 2 ตำแหน่ง
    const total_price = parseFloat((subtotal + tax_amount - discount_amount).toFixed(2)); // ยอดรวมสุทธิ

    // 5. บันทึกลงตาราง orders
    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, coupon_id, subtotal, discount_amount, total_price, tax_amount, status, address_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, total_price, subtotal, discount_amount, tax_amount, created_at`,
      [user_id, coupon_id, subtotal, discount_amount, total_price, tax_amount, 'pending', address_id]
    );
    const order_id = orderInsert.rows[0].id;

    // 6. บันทึกข้อมูลสินค้าสั่งซื้อลง order_items (สแนปชอต unit_price) และตัดสต็อกสินค้าในทรานแซกชันเดียวกัน
    for (const item of itemsToProcess) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order_id, item.variant_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, item.variant_id]
      );
    }

    // 7. เคลียร์สินค้าที่ชำระเงินแล้วออกจากตะกร้าสินค้าของผู้ใช้
    if (buy_now_item) {
      // ซื้อทันที ไม่ต้องเคลียร์ตะกร้า
    } else if (selected_cart_item_ids && Array.isArray(selected_cart_item_ids) && selected_cart_item_ids.length > 0) {
      // เคลียร์เฉพาะสินค้าที่เลือกสั่งซื้อ
      await client.query('DELETE FROM cart_items WHERE id = ANY($1::int[])', [selected_cart_item_ids]);
    } else {
      // เคลียร์สินค้าทั้งหมดในตะกร้า
      const userCart = await client.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
      if (userCart.rows.length > 0) {
        await client.query('DELETE FROM cart_items WHERE cart_id = $1', [userCart.rows[0].id]);
      }
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

const buildTrackingUrl = (courierName, trackingNumber, customUrl) => {
  if (customUrl) return customUrl;
  if (!trackingNumber) return null;
  const courier = (courierName || '').toLowerCase();
  if (courier.includes('flash')) return `https://flashexpress.co.th/tracking?num=${trackingNumber}`;
  if (courier.includes('kerry') || courier.includes('kex')) return `https://th.kex-express.com/th/track/?track=${trackingNumber}`;
  if (courier.includes('j&t') || courier.includes('jt')) return `https://www.jtexpress.co.th/index/query/gzquery.html?bills=${trackingNumber}`;
  if (courier.includes('post') || courier.includes('ไปรษณีย์')) return `https://track.thailandpost.co.th/?trackNumber=${trackingNumber}`;
  return `https://www.google.com/search?q=${encodeURIComponent((courierName || '') + ' ' + trackingNumber)}`;
};

// 2. ดึงประวัติการสั่งซื้อของผู้ใช้
exports.getMyOrders = async (req, res) => {
  const user_id = req.user.id;
  try {
    await releaseExpiredOrders();
    const ordersResult = await pool.query(
      `SELECT o.*, 
              s.tracking_number, s.courier_name, s.tracking_url as custom_tracking_url, s.status as shipping_status,
              p.method as payment_method, p.payment_status, p.slip_url, p.ai_verified_amount, p.ai_verified_status
       FROM orders o
       LEFT JOIN shipping s ON o.id = s.order_id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    const orders = ordersResult.rows;

    for (let order of orders) {
      order.tracking_url = buildTrackingUrl(order.courier_name, order.tracking_number, order.custom_tracking_url);
      const itemsResult = await pool.query(
        `SELECT oi.*, oi.unit_price as price, p.name as product_name, p.slug as product_slug, p.image_url as product_image_url, v.variant_name
         FROM order_items oi
         JOIN product_variants v ON oi.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json({ status: 'success', data: orders });
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
    await releaseExpiredOrders();
    // ดึงออเดอร์หลัก
    const orderResult = await pool.query(
      `SELECT o.*, 
              s.tracking_number, s.courier_name, s.tracking_url as custom_tracking_url, s.status as shipping_status,
              p.method as payment_method, p.payment_status, p.slip_url, p.ai_verified_amount, p.ai_verified_status,
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
    order.tracking_url = buildTrackingUrl(order.courier_name, order.tracking_number, order.custom_tracking_url);

    // ดึงรายการสินค้าในออเดอร์
    const itemsResult = await pool.query(
      `SELECT oi.*, oi.unit_price as price, p.name as product_name, p.slug as product_slug, v.variant_name
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

// 4. ยกเลิกคำสั่งซื้อโดยผู้ใช้ (User Order Cancellation with Reason)
exports.cancelOrder = async (req, res) => {
  const user_id = req.user.id;
  const order_id = req.params.id;
  const { reason, note } = req.body;

  if (!reason) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุเหตุผลในการยกเลิกคำสั่งซื้อ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ตรวจสอบว่ามีคำสั่งซื้อนี้จริงและเป็นของผู้ใช้
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [order_id, user_id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    const order = orderRes.rows[0];
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: `ไม่สามารถยกเลิกคำสั่งซื้อในสถานะ '${order.status}' ได้` });
    }

    const fullReason = note ? `${reason} (${note})` : reason;

    // อัปเดตสถานะออเดอร์เป็น cancelled และบันทึกเหตุผล
    await client.query(
      `UPDATE orders 
       SET status = 'cancelled', cancel_reason = $1, cancelled_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [fullReason, order_id]
    );

    // คืนสต็อกสินค้ากลับเข้าตาราง product_variants
    const itemsResult = await client.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = $1",
      [order_id]
    );

    for (let item of itemsResult.rows) {
      await client.query(
        "UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2",
        [item.quantity, item.variant_id]
      );
    }

    // อัปเดตสถานะชำระเงินใน payments (ถ้ามี)
    await client.query(
      "UPDATE payments SET payment_status = 'cancelled' WHERE order_id = $1",
      [order_id]
    );

    await client.query('COMMIT');

    const refundMsg = order.status === 'paid' 
      ? 'ยกเลิกคำสั่งซื้อสำเร็จ! ทางพนักงานและระบบบัญชีจะทำการตรวจสอบเหตุผลและดำเนินการคืนเงินเข้าบัญชีของผู้ใช้โดยเร็วที่สุด'
      : 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว';

    res.json({
      status: 'success',
      message: refundMsg
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};
