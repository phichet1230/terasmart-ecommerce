const pool = require('../config/db');
const { getCache, setCache } = require('../utils/cache');

exports.getAllCategories = async (req, res) => {
  try {
    const cached = getCache('categories_all');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    if (cached) {
      return res.json(cached);
    }

    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    const responsePayload = {
      status: 'success',
      data: result.rows
    };
    setCache('categories_all', responsePayload, 300);
    res.json(responsePayload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message || 'ระบบขัดข้องชั่วคราวขณะประมวลผล กรุณาลองใหม่อีกครั้ง' });
  }
};
