const pool = require('../config/db');

// 1. ดึงรายการสินค้าทั้งหมด พร้อมเงื่อนไขตัวกรองและการแบ่งหน้า (Pagination)
exports.getAllProducts = async (req, res) => {
  try {
    const { category, min_price, max_price, search, limit = 10, offset = 0 } = req.query;
    
    // ค้นหาเฉพาะสินค้าที่ยังไม่ถูกลบ (deleted_at IS NULL) และเปิดใช้งานอยู่ (is_active = true)
    let query = `
      SELECT p.*, 
             c.name as category_name,
             MIN(v.price) as min_price, 
             MAX(v.price) as max_price,
             SUM(v.stock_quantity) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.deleted_at IS NULL AND p.is_active = true
    `;
    
    const params = [];

    if (category) {
      const catIds = category.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (catIds.length > 0) {
        query += ` AND p.category_id IN (${catIds.join(',')})`;
      }
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.short_description ILIKE $${params.length})`;
    }

    query += ` GROUP BY p.id, c.name`;

    // กรองช่วงราคาหลัง Group (หรือกรองโดยใช้ HAVING)
    let havingClauses = [];
    if (min_price) {
      params.push(min_price);
      havingClauses.push(`MIN(v.price) >= $${params.length}`);
    }
    if (max_price) {
      params.push(max_price);
      havingClauses.push(`MAX(v.price) <= $${params.length}`);
    }

    if (havingClauses.length > 0) {
      query += ` HAVING ` + havingClauses.join(' AND ');
    }

    // ทำ Pagination
    params.push(parseInt(limit));
    const limitParam = `$${params.length}`;
    params.push(parseInt(offset));
    const offsetParam = `$${params.length}`;

    query += ` ORDER BY p.id DESC LIMIT ${limitParam} OFFSET ${offsetParam}`;
    
    const productsResult = await pool.query(query, params);

    // ดึงจำนวนแถวทั้งหมดสำหรับการคำนวณหน้า (Pagination Total count)
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) 
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.deleted_at IS NULL AND p.is_active = true
    `;
    const countParams = [];
    if (category) {
      const catIds = category.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (catIds.length > 0) {
        countQuery += ` AND p.category_id IN (${catIds.join(',')})`;
      }
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (p.name ILIKE $${countParams.length} OR p.short_description ILIKE $${countParams.length})`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      status: 'success',
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      results: productsResult.rows.length,
      data: productsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 2. ดึงรายละเอียดสินค้าเดี่ยว (ตาม Slug หรือ ID)
exports.getProductDetail = async (req, res) => {
  const { idOrSlug } = req.params;
  
  try {
    // 1. ค้นหารายละเอียดสินค้าหลัก
    let productQuery = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL AND p.is_active = true
    `;
    
    let productResult;
    // ตรวจสอบว่า parameter เป็น UUID, ID (integer) หรือ Slug
    if (/^[0-9]+$/.test(idOrSlug)) {
      productQuery += ` AND p.id = $1`;
      productResult = await pool.query(productQuery, [parseInt(idOrSlug)]);
    } else {
      productQuery += ` AND p.slug = $1`;
      productResult = await pool.query(productQuery, [idOrSlug]);
    }

    if (productResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้าชิ้นนี้' });
    }

    const product = productResult.rows[0];

    // 2. ดึงรายการ Variants (สี/ขนาด/ราคา/สต็อก)
    const variantsResult = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
      [product.id]
    );
    product.variants = variantsResult.rows;

    // คำนวณสต็อกและราคาโดยรวมของสินค้า
    let totalStock = 0;
    let isOutOfStock = true;
    product.variants.forEach(v => {
      totalStock += v.stock_quantity;
      if (v.stock_quantity > 0) {
        isOutOfStock = false;
      }
    });
    product.total_stock = totalStock;
    product.is_out_of_stock = isOutOfStock;

    // 3. ดึงสินค้าที่เกี่ยวข้อง (Related Products) ในหมวดหมู่เดียวกัน (ดึงมา 4 รายการ)
    const relatedResult = await pool.query(
      `SELECT p.*, MIN(v.price) as price, SUM(v.stock_quantity) as stock
       FROM products p
       LEFT JOIN product_variants v ON p.id = v.product_id
       WHERE p.category_id = $1 AND p.id != $2 AND p.deleted_at IS NULL AND p.is_active = true
       GROUP BY p.id
       LIMIT 4`,
      [product.category_id, product.id]
    );
    product.related_products = relatedResult.rows;

    res.json({
      status: 'success',
      data: product
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};