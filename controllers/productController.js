const pool = require('../config/db');
const { getCache, setCache } = require('../utils/cache');

// 1. ดึงรายการสินค้าทั้งหมด พร้อมเงื่อนไขตัวกรองและการแบ่งหน้า (Pagination)
exports.getAllProducts = async (req, res) => {
  try {
    const { category, min_price, max_price, search, limit = 100, offset = 0 } = req.query;

    const cacheKey = `products_${category || ''}_${min_price || ''}_${max_price || ''}_${search || ''}_${limit}_${offset}`;
    const cachedResponse = getCache(cacheKey);

    // Ensure browser fetches fresh inventory status without stale 30s browser cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // ค้นหาเฉพาะสินค้าที่ยังไม่ถูกลบ (deleted_at IS NULL) และเปิดใช้งานอยู่ (is_active = true)
    let query = `
      SELECT p.*, 
             c.name as category_name,
             MIN(v.price) as min_price, 
             MAX(v.price) as max_price,
             COALESCE(SUM(v.stock_quantity), 0) as total_stock
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

    // เรียงลำดับ: 1. สินค้าที่มีสต็อกอยู่ก่อน 2. สินค้าที่ลงล่าสุด
    query += ` ORDER BY (CASE WHEN COALESCE(SUM(v.stock_quantity), 0) > 0 THEN 1 ELSE 0 END) DESC, p.id DESC LIMIT ${limitParam} OFFSET ${offsetParam}`;
    
    // ดึงจำนวนแถวทั้งหมดสำหรับการคำนวณหน้า (Pagination Total count)
    let countQuery = `
      SELECT COUNT(p.id) 
      FROM products p
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

    // Parallel DB execution เพื่อลด latency ของการดึงข้อมูล 50%
    const [productsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    // ดึงรายการ variants ของสินค้าทั้งหมดเพื่อแนบในข้อมูลตอบกลับ
    const productIds = productsResult.rows.map(p => p.id);
    if (productIds.length > 0) {
      const variantsResult = await pool.query(
        `SELECT * FROM product_variants WHERE product_id = ANY($1::int[]) ORDER BY price ASC`,
        [productIds]
      );
      productsResult.rows.forEach(p => {
        p.variants = variantsResult.rows.filter(v => v.product_id === p.id);
        p.total_stock = parseInt(p.total_stock || 0);
      });
    }

    const totalCount = parseInt(countResult.rows[0].count);

    const responsePayload = {
      status: 'success',
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      results: productsResult.rows.length,
      data: productsResult.rows
    };

    // บันทึกลง Memory Cache (30 วินาที)
    setCache(cacheKey, responsePayload, 30);

    res.json(responsePayload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};

// 2. ดึงรายละเอียดสินค้าเดี่ยว (ตาม Slug หรือ ID)
exports.getProductDetail = async (req, res) => {
  const { idOrSlug } = req.params;

  const cacheKey = `product_${idOrSlug}`;
  const cachedResponse = getCache(cacheKey);

  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  if (cachedResponse) {
    return res.json(cachedResponse);
  }
  
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

    // 2. Parallelize ดึง Variants + Related Products
    const [variantsResult, relatedResult] = await Promise.all([
      pool.query(`SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC`, [product.id]),
      pool.query(
        `SELECT p.id, p.name, p.slug, p.image_url, p.category_id, MIN(v.price) as price, COALESCE(SUM(v.stock_quantity), 0) as stock
         FROM products p
         LEFT JOIN product_variants v ON p.id = v.product_id
         WHERE p.category_id = $1 AND p.id != $2 AND p.deleted_at IS NULL AND p.is_active = true
         GROUP BY p.id
         LIMIT 4`,
        [product.category_id, product.id]
      )
    ]);

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
    product.related_products = relatedResult.rows;

    const responsePayload = {
      status: 'success',
      data: product
    };

    setCache(cacheKey, responsePayload, 60);

    res.json(responsePayload);

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};