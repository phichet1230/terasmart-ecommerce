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
    let { category_id, name, slug, short_description, description, image_url, images, spec_table, category_name, price, variants } = req.body;

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
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

// 8. แก้ไขข้อมูลสินค้าหลัก
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  let { category_id, name, slug, short_description, description, image_url, images, spec_table, category_name, price, is_active } = req.body;
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

    let imagesJson = null;
    if (images !== undefined) {
      imagesJson = typeof images === 'string' ? images : JSON.stringify(images);
    }

    let specTableJson = null;
    if (spec_table !== undefined) {
      specTableJson = typeof spec_table === 'string' ? spec_table : JSON.stringify(spec_table);
    }

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
           is_active = COALESCE($9, is_active)
       WHERE id = $10`,
      [category_id, name, slug, short_description, description, image_url, imagesJson, specTableJson, is_active, productId]
    );

    // Sync product variants if variants array is provided
    let { variants } = req.body;
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const keptIds = [];
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vSku = v.sku || `TERA-${productId}-${Date.now().toString().slice(-4)}-${i}`;
        
        if (v.id) {
          // Update existing variant
          await pool.query(
            `UPDATE product_variants 
             SET variant_name = $1, sku = $2, price = $3, stock_quantity = $4 
             WHERE id = $5 AND product_id = $6`,
            [v.variant_name || 'Standard', vSku, parseFloat(v.price || price || 0), parseInt(v.stock_quantity || 0), v.id, productId]
          );
          keptIds.push(v.id);
        } else {
          // Insert new variant
          const inserted = await pool.query(
            `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [productId, v.variant_name || 'Standard', vSku, parseFloat(v.price || price || 0), parseInt(v.stock_quantity || 0)]
          );
          keptIds.push(inserted.rows[0].id);
        }
      }

      // Safely delete or deactivate variants removed from product
      if (keptIds.length > 0) {
        const existingVars = await pool.query('SELECT id FROM product_variants WHERE product_id = $1', [productId]);
        for (const ev of existingVars.rows) {
          if (!keptIds.includes(ev.id)) {
            try {
              await pool.query('DELETE FROM product_variants WHERE id = $1', [ev.id]);
            } catch (delErr) {
              // If referenced in order_items, mark stock as 0
              await pool.query('UPDATE product_variants SET stock_quantity = 0 WHERE id = $1', [ev.id]);
            }
          }
        }
      }
    } else if (price !== undefined && price !== null) {
      await pool.query(
        'UPDATE product_variants SET price = $1 WHERE product_id = $2',
        [parseFloat(price), productId]
      );
    }

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
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
