const pool = require('../config/db');

// helper for logging admin actions
async function logAction(adminId, action, targetTable, targetId) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_table, target_id) VALUES ($1, $2, $3, $4)`,
      [adminId, action, targetTable, targetId]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// 1. หน้าสรุปแดชบอร์ดยอดขายและสินค้าใกล้หมดสต็อก
exports.getDashboardMetrics = async (req, res) => {
  try {
    // ยอดขายรวมทั้งหมด (เฉพาะออเดอร์ที่จ่ายเงินแล้ว)
    const salesResult = await pool.query(
      "SELECT SUM(total_price) as total_sales, COUNT(id) as total_orders FROM orders WHERE status != 'pending'"
    );
    const metrics = {
      total_sales: parseFloat(salesResult.rows[0].total_sales || 0).toFixed(2),
      total_orders: parseInt(salesResult.rows[0].total_orders || 0),
    };

    // นับจำนวนสินค้าทั้งหมด (ที่ยังไม่โดนลบ)
    const activeProducts = await pool.query("SELECT COUNT(id) FROM products WHERE deleted_at IS NULL");
    metrics.active_products = parseInt(activeProducts.rows[0].count || 0);

    // แจ้งเตือนสินค้าใกล้หมด (สต็อก <= 5)
    const lowStock = await pool.query(`
      SELECT p.name, v.variant_name, v.sku, v.stock_quantity, v.price
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.stock_quantity <= 5 AND p.deleted_at IS NULL
      ORDER BY v.stock_quantity ASC
    `);
    metrics.low_stock_warnings = lowStock.rows;

    // กราฟสรุปยอดขายรายวัน (30 วันล่าสุด)
    const dailySales = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, SUM(total_price) as total_sales
      FROM orders
      WHERE status != 'pending' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);
    metrics.daily_sales = dailySales.rows;

    // กราฟสรุปยอดขายรายเดือน
    const monthlySales = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total_price) as total_sales
      FROM orders
      WHERE status != 'pending'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);
    metrics.monthly_sales = monthlySales.rows;

    // คำนวณยอดขายรายเดือนแยกตามทีม (พี่ยง, กิ๊ฟ, ฝน) อ้างอิงเดือนปัจจุบัน
    const currentMonthOrders = await pool.query(
      `SELECT id, total_price FROM orders 
       WHERE status != 'pending' 
       AND TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM')`
    );

    let team1Sales = 0;
    let team2Sales = 0;
    let team3Sales = 0;

    currentMonthOrders.rows.forEach(order => {
      let hash = 0;
      for (let i = 0; i < order.id.length; i++) {
        hash += order.id.charCodeAt(i);
      }
      const teamIndex = hash % 3;
      const price = parseFloat(order.total_price || 0);
      
      if (teamIndex === 0) team1Sales += price;
      else if (teamIndex === 1) team2Sales += price;
      else team3Sales += price;
    });

    metrics.team_kpis = [
      { name: 'ทีม 1 (พี่พี่ยง)', target: 50000, sales: team1Sales, kpi_percentage: parseFloat(((team1Sales / 50000) * 100).toFixed(2)) },
      { name: 'ทีม 2 (พี่กิ๊ฟ)', target: 40000, sales: team2Sales, kpi_percentage: parseFloat(((team2Sales / 40000) * 100).toFixed(2)) },
      { name: 'ทีม 3 (พี่ฝน)', target: 30000, sales: team3Sales, kpi_percentage: parseFloat(((team3Sales / 30000) * 100).toFixed(2)) }
    ];

    // ดึง Audit Logs 10 รายการล่าสุด
    const auditLogs = await pool.query(
      `SELECT a.*, u.username as admin_name
       FROM audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );
    metrics.audit_logs = auditLogs.rows;

    res.json({ status: 'success', data: metrics });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 2. ดึงรายการคำสั่งซื้อทั้งหมด
exports.getAllOrders = async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT o.*, u.username, u.email,
             s.tracking_number, s.courier_name, s.status as shipping_status,
             p.method as payment_method, p.payment_status, p.slip_url
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN shipping s ON o.id = s.order_id
      LEFT JOIN payments p ON o.id = p.order_id
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` WHERE o.status = $1`;
    }
    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 3. เปลี่ยนสถานะออเดอร์และการจัดส่ง
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status, courier_name, tracking_number } = req.body;
  const admin_id = req.user.id;

  try {
    // ตรวจสอบว่าออเดอร์มีอยู่จริง
    const orderCheck = await pool.query('SELECT status, total_price FROM orders WHERE id = $1', [orderId]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อนี้' });
    }

    // 1. อัปเดตสถานะหลักใน orders
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

    // 2. ถ้าเปลี่ยนสถานะเป็นชำระเงินแล้ว ให้ไปอัปเดต payments เป็น completed
    if (status === 'paid') {
      await pool.query(
        "UPDATE payments SET payment_status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = $1",
        [orderId]
      );
    }

    // 3. ถ้าเป็นกำลังส่ง (shipping) หรือส่งแล้ว (delivered) ให้ลงข้อมูลในตาราง shipping
    if (status === 'shipping' || status === 'delivered') {
      const shippingStatus = status === 'shipping' ? 'shipped' : 'delivered';
      
      const shipCheck = await pool.query('SELECT id FROM shipping WHERE order_id = $1', [orderId]);
      if (shipCheck.rows.length > 0) {
        await pool.query(
          `UPDATE shipping 
           SET courier_name = COALESCE($1, courier_name), 
               tracking_number = COALESCE($2, tracking_number), 
               status = $3
           WHERE order_id = $4`,
          [courier_name, tracking_number, shippingStatus, orderId]
        );
      } else {
        await pool.query(
          `INSERT INTO shipping (order_id, courier_name, tracking_number, status) VALUES ($1, $2, $3, $4)`,
          [orderId, courier_name, tracking_number, shippingStatus]
        );
      }
    }

    await logAction(admin_id, `Updated order status to ${status}`, 'orders', orderId);

    res.json({ status: 'success', message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 4. จัดการสมาชิก (ดึงรายชื่อลูกค้าทั้งหมด)
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await pool.query(`
      SELECT id, username, email, phone, role, account_status, created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count,
             (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE user_id = users.id AND status != 'pending') as total_spent
      FROM users
      WHERE role = 'customer'
      ORDER BY created_at DESC
    `);
    res.json({ status: 'success', data: customers.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 5. ระงับ / เปิดการใช้งานสมาชิก (Account Status active/suspended)
exports.toggleCustomerStatus = async (req, res) => {
  const customerId = req.params.id;
  const { status } = req.body; // active, suspended
  const admin_id = req.user.id;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ status: 'error', message: 'สถานะไม่ถูกต้อง (ต้องเป็น active หรือ suspended)' });
  }

  try {
    const userCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [customerId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้นี้' });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถระงับการใช้งานบัญชีผู้ดูแลระบบ (Admin) ได้' });
    }

    await pool.query('UPDATE users SET account_status = $1 WHERE id = $2', [status, customerId]);
    await logAction(admin_id, `Changed user status to ${status}`, 'users', customerId);

    res.json({ status: 'success', message: `เปลี่ยนสถานะสมาชิกเป็น ${status} สำเร็จ` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 6. ดึงประวัติการสั่งซื้อของลูกค้ารายคน
exports.getCustomerOrders = async (req, res) => {
  const customerId = req.params.id;
  try {
    const orders = await pool.query(
      `SELECT o.*, s.tracking_number, s.courier_name, s.status as shipping_status 
       FROM orders o
       LEFT JOIN shipping s ON o.id = s.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );
    res.json({ status: 'success', data: orders.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 7. เพิ่มสินค้าพร้อม Variant
exports.createProduct = async (req, res) => {
  const { category_id, name, slug, short_description, description, variants } = req.body;
  const admin_id = req.user.id;

  if (!category_id || !name || !slug || !variants || !Array.isArray(variants)) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (category_id, name, slug, variants)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const slugCheck = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'Slug นี้มีอยู่แล้วในระบบ กรุณาเปลี่ยนใหม่' });
    }

    // บันทึกสินค้าหลัก
    const prodResult = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [category_id, name, slug, short_description, description]
    );
    const product_id = prodResult.rows[0].id;

    // บันทึก variants
    for (const v of variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, v.variant_name, v.sku, v.price, v.stock_quantity]
      );
    }

    await client.query('COMMIT');
    await logAction(admin_id, `Created product "${name}" with variants`, 'products', product_id);

    res.status(201).json({ status: 'success', message: 'เพิ่มสินค้าและตัวเลือกสินค้าสำเร็จ' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

// 8. แก้ไขข้อมูลสินค้าหลัก
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { category_id, name, slug, short_description, description, is_active } = req.body;
  const admin_id = req.user.id;

  try {
    const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL', [productId]);
    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้าชิ้นนี้' });
    }

    await pool.query(
      `UPDATE products 
       SET category_id = COALESCE($1, category_id),
           name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           short_description = COALESCE($4, short_description),
           description = COALESCE($5, description),
           is_active = COALESCE($6, is_active)
       WHERE id = $7`,
      [category_id, name, slug, short_description, description, is_active, productId]
    );

    await logAction(admin_id, `Updated product ID: ${productId}`, 'products', productId);
    res.json({ status: 'success', message: 'แก้ไขข้อมูลสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 9. แก้ไข Variant สินค้า
exports.updateProductVariant = async (req, res) => {
  const variantId = req.params.id;
  const { variant_name, sku, price, stock_quantity } = req.body;
  const admin_id = req.user.id;

  try {
    const varCheck = await pool.query('SELECT id, product_id FROM product_variants WHERE id = $1', [variantId]);
    if (varCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบตัวเลือกสินค้าชิ้นนี้' });
    }

    await pool.query(
      `UPDATE product_variants 
       SET variant_name = COALESCE($1, variant_name),
           sku = COALESCE($2, sku),
           price = COALESCE($3, price),
           stock_quantity = COALESCE($4, stock_quantity)
       WHERE id = $5`,
      [variant_name, sku, price, stock_quantity, variantId]
    );

    await logAction(admin_id, `Updated product variant ID: ${variantId}`, 'product_variants', variantId);
    res.json({ status: 'success', message: 'แก้ไขตัวเลือกสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 10. ลบสินค้า (Soft Delete)
exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;
  const admin_id = req.user.id;

  try {
    const check = await pool.query('SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL', [productId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้าชิ้นนี้' });
    }

    // ทำ Soft Delete โดยอัปเดตฟิลด์ deleted_at
    await pool.query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [productId]);
    await logAction(admin_id, `Soft deleted product ID: ${productId}`, 'products', productId);

    res.json({ status: 'success', message: 'ลบสินค้าสำเร็จ (Soft Deleted)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 11. ดึงรายการสินค้าทั้งหมดสำหรับแอดมิน (รวม Variants ย่อย)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const productsResult = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.id DESC
    `);
    
    const products = productsResult.rows;

    for (let p of products) {
      const varResult = await pool.query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC', [p.id]);
      p.variants = varResult.rows;
    }

    res.json({ status: 'success', data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 12. ส่งออกข้อมูลคำสั่งซื้อเป็น CSV (รองรับภาษาไทย Excel BOM)
exports.exportOrdersCSV = async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.id as order_id, u.username, o.total_price, o.discount_amount, o.status, o.created_at, 
             s.tracking_number, s.courier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN shipping s ON o.id = s.order_id
      ORDER BY o.created_at DESC
    `);

    const headers = ['Order ID', 'Username', 'Total Price', 'Discount Amount', 'Status', 'Created At', 'Tracking Number', 'Courier Name'];
    const rows = ordersResult.rows.map(row => {
      return [
        row.order_id,
        row.username,
        row.total_price,
        row.discount_amount,
        row.status,
        row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '',
        row.tracking_number || '',
        row.courier_name || ''
      ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 13. ส่งออกข้อมูลสินค้าและสต็อกเป็น CSV (รองรับภาษาไทย Excel BOM)
exports.exportProductsCSV = async (req, res) => {
  try {
    const productsResult = await pool.query(`
      SELECT p.id as product_id, p.name as product_name, c.name as category_name, 
             v.variant_name, v.sku, v.price, v.stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.id DESC, v.id ASC
    `);

    const headers = ['Product ID', 'Product Name', 'Category Name', 'Variant Name', 'SKU', 'Price', 'Stock Quantity'];
    const rows = productsResult.rows.map(row => {
      return [
        row.product_id,
        row.product_name,
        row.category_name || '',
        row.variant_name || '',
        row.sku || '',
        row.price || '0.00',
        row.stock_quantity !== undefined ? row.stock_quantity : '0'
      ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=products_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
