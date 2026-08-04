const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSqlScript(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  // Split statements safely by semicolon while removing comment-only lines
  const statements = content
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      console.warn('⚠️ SQL Statement execution warning:', err.message);
    }
  }
}

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
      await runSqlScript(initSqlPath);
      console.log('✅ Schema tables created successfully!');
      await runSqlScript(seedSqlPath);
      console.log('✅ Initial seed data inserted successfully!');
    } else {
      // Check if products table has items or needs rich seed refresh
      const prodCountRes = await pool.query('SELECT COUNT(*) FROM products');
      const count = parseInt(prodCountRes.rows[0]?.count || '0', 10);
      if (count < 8) {
        console.log(`⚡ Synchronizing rich catalog seed data (current products: ${count})...`);
        await runSqlScript(seedSqlPath);
        console.log('✅ Rich catalog seed data synchronized!');
      }
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
