const pool = require('c:/Users/WIN11/Downloads/terasmartecom-backend/config/db');

async function checkPB() {
  try {
    const res = await pool.query(`
      SELECT p.id, p.name, SUM(v.stock_quantity) as total_stock, json_agg(v.*) as variants
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.name LIKE '%PowerBank%'
      GROUP BY p.id
    `);
    console.log("Product:", res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkPB();
