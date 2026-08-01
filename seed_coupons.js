const db = require('./config/db');

async function seedCoupons() {
  try {
    const sql = `
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit)
      VALUES 
        ('WELCOME10', 'percentage', 10.00, 0.00, '2030-12-31 23:59:59', 100),
        ('TERASUPER', 'fixed', 100.00, 500.00, '2030-12-31 23:59:59', 100),
        ('TERA500', 'fixed', 500.00, 2000.00, '2030-12-31 23:59:59', 100),
        ('SPECIAL20', 'percentage', 20.00, 1000.00, '2030-12-31 23:59:59', 100),
        ('FREEVIP', 'fixed', 1000.00, 5000.00, '2030-12-31 23:59:59', 100)
      ON CONFLICT (code) DO NOTHING;
    `;
    await db.query(sql);
    const res = await db.query('SELECT * FROM coupons ORDER BY id ASC');
    console.log('Current Coupons in Database:');
    console.table(res.rows);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit();
  }
}

seedCoupons();
