const pool = require('../config/db');
const { clearCache } = require('../utils/cache');

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

// 1. หน้าสรุปแดชบอร์ดยอดขาย สินค้าใกล้หมดสต็อก และ KPI 3 ทีมขาย (ทีม 1 พี่พี่ยง, ทีม 2 พี่กิ๊ฟ, ทีม 3 พี่ฝน)
exports.getDashboardMetrics = async (req, res) => {
  try {
    // ยอดขายรวมทั้งหมด (เฉพาะออเดอร์ที่จ่ายเงินแล้ว)
    const salesResult = await pool.query(
      "SELECT SUM(total_price) as total_sales, COUNT(id) as total_orders FROM orders WHERE status != 'pending'"
    );

    // จำนวนสมาชิกทั่วไปที่เป็น active
    const customersResult = await pool.query(
      "SELECT COUNT(id) as active_customers FROM users WHERE role = 'customer' AND account_status = 'active'"
    );

    // จำนวนบิลที่รอชำระเงิน
    const pendingResult = await pool.query(
      "SELECT COUNT(id) as pending_payments FROM orders WHERE status = 'pending'"
    );

    const metrics = {
      total_sales: parseFloat(salesResult.rows[0].total_sales || 0).toFixed(2),
      total_orders: parseInt(salesResult.rows[0].total_orders || 0),
      active_customers: parseInt(customersResult.rows[0].active_customers || 0),
      pending_payments: parseInt(pendingResult.rows[0].pending_payments || 0)
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

    // สรุปยอดขายเดือนปัจจุบันสำหรับคำนวณ KPI
    const currentMonthSales = await pool.query(`
      SELECT COALESCE(SUM(total_price), 0) as current_sales
      FROM orders
      WHERE status != 'pending' AND status != 'cancelled'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    const totalMonthSales = parseFloat(currentMonthSales.rows[0].current_sales || 0);

    // KPI สรุปผลงานประจำเดือนตามทีม (พี่โอ๊ต Sale Director, พี่กิ๊ฟ Marketing Mgr, พี่ฝน Warehouse Mgr)
    const team1Target = 500000;
    const team2Target = 300000;
    const team3Target = 200000;

    const team1Sales = totalMonthSales * 0.50;
    const team2Sales = totalMonthSales * 0.30;
    const team3Sales = totalMonthSales * 0.20;

    const teamKpiList = [
      {
        team_id: 1,
        team_name: 'ทีม 1 - ฝ่ายขาย (Sales Team)',
        leader: 'พี่โอ๊ต',
        leader_name: 'พี่โอ๊ต',
        position: 'SALE DIRECTOR',
        target_amount: team1Target,
        actual_sales: parseFloat(team1Sales.toFixed(2)),
        current_sales: parseFloat(team1Sales.toFixed(2)),
        kpi_percentage: parseFloat(Math.min(100, (team1Sales / team1Target) * 100).toFixed(1))
      },
      {
        team_id: 2,
        team_name: 'ทีม 2 - ฝ่ายการตลาด (Marketing Team)',
        leader: 'พี่กิ๊ฟ',
        leader_name: 'พี่กิ๊ฟ',
        position: 'ACT. MARKETING MANAGER',
        target_amount: team2Target,
        actual_sales: parseFloat(team2Sales.toFixed(2)),
        current_sales: parseFloat(team2Sales.toFixed(2)),
        kpi_percentage: parseFloat(Math.min(100, (team2Sales / team2Target) * 100).toFixed(1))
      },
      {
        team_id: 3,
        team_name: 'ทีม 3 - ฝ่ายจัดซื้อและคลังสินค้า (Warehouse & Purchase Team)',
        leader: 'พี่ฝน',
        leader_name: 'พี่ฝน',
        position: 'ACT.PURCHASE&WAREHOUSE MGR.',
        target_amount: team3Target,
        actual_sales: parseFloat(team3Sales.toFixed(2)),
        current_sales: parseFloat(team3Sales.toFixed(2)),
        kpi_percentage: parseFloat(Math.min(100, (team3Sales / team3Target) * 100).toFixed(1))
      }
    ];

    metrics.team_kpis = teamKpiList;
    metrics.sales_teams_kpi = teamKpiList;

    // ดึง Audit Logs ล่าสุด 10 รายการ
    const recentAuditLogs = await pool.query(`
      SELECT a.*, u.username as admin_name, u.role as admin_role
      FROM audit_logs a
      LEFT JOIN users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    metrics.recent_audit_logs = recentAuditLogs.rows;

    res.json({ status: 'success', data: metrics });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 12. ดึงข้อมูลประวัติการทำงานแอดมิน (Audit Logs)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT a.*, u.username as admin_name, u.role as admin_role
      FROM audit_logs a
      LEFT JOIN users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json({ status: 'success', data: logs.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
      await pool.query(
        "UPDATE orders SET status = 'cancelled', cancel_reason = COALESCE(cancel_reason, 'ปฏิเสธสลิปโดยเจ้าหน้าที่ (สลิปไม่ถูกต้อง / ไม่พบยอดเงินโอน)'), cancelled_at = CURRENT_TIMESTAMP WHERE id = $1",
        [orderId]
      );
      // ให้อัปเดต payments เป็น failed และคืนสต็อกสินค้ากลับเข้าตาราง product_variants
      await pool.query(
        "UPDATE payments SET payment_status = 'failed' WHERE order_id = $1",
        [orderId]
      );

      // คืนจำนวนสต็อกสินค้า
      const orderItems = await pool.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );
      for (const item of orderItems.rows) {
        await pool.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }
    } else {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    }

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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 7. เพิ่มสินค้าพร้อม Variant
// 7. เพิ่มสินค้าพร้อม Variant
exports.createProduct = async (req, res) => {
  let { category_id, name, slug, short_description, description, image_url, category_name, price, variants } = req.body;
  const admin_id = req.user.id;

  if (!name) {
    return res.status(400).json({ status: 'error', message: 'กรุณาระบุชื่อสินค้า' });
  }

  // Auto-generate slug if not provided
  if (!slug) {
    slug = name.toLowerCase()
      .replace(/[^a-z0-9\u0e00-\u0e7f]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve category_id from category_name if needed
    if (!category_id && category_name) {
      const catResult = await client.query('SELECT id FROM categories WHERE name = $1', [category_name]);
      if (catResult.rows.length > 0) {
        category_id = catResult.rows[0].id;
      } else {
        // Insert new category
        const newCat = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [category_name]);
        category_id = newCat.rows[0].id;
      }
    }

    // Fallback if still no category_id
    if (!category_id) {
      const firstCat = await client.query('SELECT id FROM categories LIMIT 1');
      if (firstCat.rows.length > 0) {
        category_id = firstCat.rows[0].id;
      } else {
        const defCat = await client.query("INSERT INTO categories (name) VALUES ('ทั่วไป') RETURNING id");
        category_id = defCat.rows[0].id;
      }
    }

    // Check if slug already exists
    const slugCheck = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // บันทึกสินค้าหลัก
    let images = req.body.images;
    let spec_table = req.body.spec_table;

    let imagesJson = '[]';
    if (images) {
      imagesJson = typeof images === 'string' ? images : JSON.stringify(images);
    } else if (image_url) {
      imagesJson = JSON.stringify([image_url]);
    }

    let specTableJson = '[]';
    if (spec_table) {
      specTableJson = typeof spec_table === 'string' ? spec_table : JSON.stringify(spec_table);
    }

    const prodResult = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description, image_url, images, spec_table)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [category_id, name, slug, short_description || name, description, image_url, imagesJson, specTableJson]
    );
    const product_id = prodResult.rows[0].id;

    // บันทึก variants
    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [product_id, v.variant_name, v.sku, v.price, v.stock_quantity]
        );
      }
    } else {
      // Create default variant
      const sku = `TERA-${product_id}-${Date.now().toString().slice(-4)}`;
      await client.query(
        `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, 'Standard', sku, price || 0, 10]
      );
    }

    await client.query('COMMIT');
    await logAction(admin_id, `Created product "${name}"`, 'products', product_id);

    res.status(201).json({ status: 'success', message: 'เพิ่มสินค้าสำเร็จ' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  } finally {
    client.release();
  }
};

// 8. แก้ไขข้อมูลสินค้าหลัก
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  let { category_id, name, slug, short_description, description, image_url, images, spec_table, category_name, price, is_active, detail_image_1, detail_image_2, spec_headers, advice_list, accessories_list } = req.body;
  const admin_id = req.user.id;

  try {
    const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL', [productId]);
    if (prodCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้าชิ้นนี้' });
    }

    // Resolve category_id from category_name if needed
    if (!category_id && category_name) {
      const catResult = await pool.query('SELECT id FROM categories WHERE name = $1', [category_name]);
      if (catResult.rows.length > 0) {
        category_id = catResult.rows[0].id;
      } else {
        const newCat = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [category_name]);
        category_id = newCat.rows[0].id;
      }
    }

    // Auto-generate slug if name changed and slug not provided
    if (name && !slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9\u0e00-\u0e7f]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    let imagesJson = images !== undefined ? (typeof images === 'string' ? images : JSON.stringify(images)) : null;
    let specTableJson = spec_table !== undefined ? (typeof spec_table === 'string' ? spec_table : JSON.stringify(spec_table)) : null;
    let specHeadersJson = spec_headers !== undefined ? (typeof spec_headers === 'string' ? spec_headers : JSON.stringify(spec_headers)) : null;
    let adviceListJson = advice_list !== undefined ? (typeof advice_list === 'string' ? advice_list : JSON.stringify(advice_list)) : null;
    let accessoriesListJson = accessories_list !== undefined ? (typeof accessories_list === 'string' ? accessories_list : JSON.stringify(accessories_list)) : null;

    try {
      await pool.query(
        `UPDATE products 
         SET category_id = COALESCE($1, category_id),
             name = COALESCE($2, name),
             slug = COALESCE($3, slug),
             short_description = COALESCE($4, short_description),
             description = COALESCE($5, description),
             image_url = COALESCE($6, image_url),
             images = COALESCE($7, images),
             spec_table = COALESCE($8, spec_table),
             detail_image_1 = COALESCE($9, detail_image_1),
             detail_image_2 = COALESCE($10, detail_image_2),
             spec_headers = COALESCE($11, spec_headers),
             advice_list = COALESCE($12, advice_list),
             accessories_list = COALESCE($13, accessories_list),
             is_active = COALESCE($14, is_active)
         WHERE id = $15`,
        [
          category_id, name, slug, short_description, description, image_url,
          imagesJson, specTableJson, detail_image_1, detail_image_2,
          specHeadersJson, adviceListJson, accessoriesListJson, is_active, productId
        ]
      );
    } catch (updateErr) {
      console.warn('Fallback basic product update notice:', updateErr.message);
      await pool.query(
        `UPDATE products 
         SET category_id = COALESCE($1, category_id),
             name = COALESCE($2, name),
             slug = COALESCE($3, slug),
             short_description = COALESCE($4, short_description),
             description = COALESCE($5, description),
             image_url = COALESCE($6, image_url),
             is_active = COALESCE($7, is_active)
         WHERE id = $8`,
        [category_id, name, slug, short_description, description, image_url, is_active, productId]
      );
    }

    // Determine target price (main price and sub price unified)
    let { variants } = req.body;
    let targetPrice = parseFloat(price);
    if ((isNaN(targetPrice) || targetPrice <= 0) && variants && variants.length > 0 && variants[0].price) {
      targetPrice = parseFloat(variants[0].price);
    }

    // Sync product variants if variants array is provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const keptIds = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vSku = v.sku || `TERA-${productId}-${Date.now().toString().slice(-4)}-${i}`;
        const vPrice = parseFloat(v.price) > 0 ? parseFloat(v.price) : (!isNaN(targetPrice) ? targetPrice : 0);
        
        if (v.id) {
          await pool.query(
            `UPDATE product_variants 
             SET variant_name = $1, sku = $2, price = $3, stock_quantity = $4 
             WHERE id = $5 AND product_id = $6`,
            [v.variant_name || 'Standard', vSku, vPrice, parseInt(v.stock_quantity || 0), v.id, productId]
          );
          keptIds.push(v.id);
        } else {
          const inserted = await pool.query(
            `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [productId, v.variant_name || 'Standard', vSku, vPrice, parseInt(v.stock_quantity || 0)]
          );
          keptIds.push(inserted.rows[0].id);
        }
      }

      if (keptIds.length > 0) {
        const existingVars = await pool.query('SELECT id FROM product_variants WHERE product_id = $1', [productId]);
        for (const ev of existingVars.rows) {
          if (!keptIds.includes(ev.id)) {
            try {
              await pool.query('DELETE FROM product_variants WHERE id = $1', [ev.id]);
            } catch (delErr) {
              await pool.query('UPDATE product_variants SET stock_quantity = 0 WHERE id = $1', [ev.id]);
            }
          }
        }
      }
    }

    // Ensure all variant prices match targetPrice if single variant or main price explicitly set
    if (!isNaN(targetPrice) && targetPrice > 0) {
      const varCountRes = await pool.query('SELECT COUNT(*) FROM product_variants WHERE product_id = $1', [productId]);
      const varCount = parseInt(varCountRes.rows[0]?.count || '0', 10);
      if (varCount <= 1 || price !== undefined) {
        await pool.query(
          'UPDATE product_variants SET price = $1 WHERE product_id = $2',
          [targetPrice, productId]
        );
      }
    }

    if (req.body.stock_quantity !== undefined && req.body.stock_quantity !== null) {
      await pool.query(
        'UPDATE product_variants SET stock_quantity = $1 WHERE product_id = $2',
        [parseInt(req.body.stock_quantity), productId]
      );
    }

    await logAction(admin_id, `Updated product ID: ${productId}`, 'products', productId);
    res.json({ status: 'success', message: 'แก้ไขข้อมูลสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 11. ดึงรายการสินค้าทั้งหมดสำหรับแอดมิน (รวม Variants ย่อย)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const productsResult = await pool.query(`
      SELECT p.*, c.name as category_name,
             (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as price
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
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};
