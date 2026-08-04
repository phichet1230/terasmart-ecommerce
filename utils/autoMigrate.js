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
    if (!tableExists) {
      console.log('⚡ Initializing Database Schema (init.sql & seed.sql)...');

      const initSqlPath = path.join(__dirname, '../init.sql');
      const seedSqlPath = path.join(__dirname, '../seed.sql');

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
      console.log('✅ Database schema is up-to-date.');
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
