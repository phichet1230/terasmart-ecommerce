const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Adding image_url column to products table...');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)');
    console.log('Column added successfully.');

    console.log('Seeding sample image URLs...');
    await pool.query(`
      UPDATE products 
      SET image_url = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' 
      WHERE slug = 'tera-phone-15'
    `);
    await pool.query(`
      UPDATE products 
      SET image_url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' 
      WHERE slug = 'tera-watch-v2'
    `);
    await pool.query(`
      UPDATE products 
      SET image_url = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' 
      WHERE slug = 'tera-buds-pro'
    `);
    await pool.query(`
      UPDATE products 
      SET image_url = 'https://images.unsplash.com/photo-1609592424268-3e4b789e5a1e?w=400' 
      WHERE slug = 'tera-pb-20k'
    `);
    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
