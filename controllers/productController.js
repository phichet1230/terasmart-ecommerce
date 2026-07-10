const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    // รองรับการ Filter ตามหมวดหมู่ และ ช่วงราคา ตามบรีฟ Frontend
    const { category, min_price, max_price, search } = req.query;
    
    let query = `
      SELECT p.*, v.price, v.stock_quantity 
      FROM products p 
      JOIN product_variants v ON p.id = v.product_id 
      WHERE p.is_active = true
    `;
    
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND p.category_id = $${params.length}`;
    }
    
    if (min_price) {
      params.push(min_price);
      query += ` AND v.price >= $${params.length}`;
    }

    if (max_price) {
      params.push(max_price);
      query += ` AND v.price <= $${params.length}`;
    }

    const products = await pool.query(query, params);

    res.json({
      status: 'success',
      results: products.rows.length,
      data: products.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};