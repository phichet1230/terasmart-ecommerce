const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function autoMigrateDatabase() {
  try {
    // Check if 'users' table exists
    const checkRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'users'
      );
    `);

    const tableExists = checkRes.rows[0].exists;
    const initSqlPath = path.join(__dirname, '../init.sql');
    const seedSqlPath = path.join(__dirname, '../seed.sql');

    if (!tableExists) {
      console.log('⚡ Initializing Database Schema (init.sql & seed.sql)...');

      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        await pool.query(initSql);
        console.log('✅ Schema tables created successfully!');
      }

      if (fs.existsSync(seedSqlPath)) {
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        await pool.query(seedSql);
        console.log('✅ Initial seed data inserted successfully!');
      }
    } else {
      // Check if products table has items or needs rich seed refresh
      const prodCountRes = await pool.query('SELECT COUNT(*) FROM products');
      const count = parseInt(prodCountRes.rows[0].count, 10);
      if (fs.existsSync(seedSqlPath)) {
        console.log('⚡ Synchronizing rich catalog seed data (seed.sql)...');
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        await pool.query(seedSql);
        console.log('✅ Rich catalog seed data synchronized!');
      }
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
