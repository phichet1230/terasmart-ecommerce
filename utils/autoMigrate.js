const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSqlScript(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  // Split statements cleanly by semicolon
  const statements = content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn(`[DB Migration Log] Notice during SQL execute:`, err.message);
      }
    }
  }
}

async function autoMigrateDatabase() {
  try {
    const initSqlPath = path.join(__dirname, '../init.sql');
    const seedSqlPath = path.join(__dirname, '../seed.sql');

    // Always run init.sql to ensure all missing tables/columns exist (IF NOT EXISTS pattern)
    console.log('⚡ Verifying Database Schema (init.sql)...');
    await runSqlScript(initSqlPath);
    console.log('✅ Database Schema verified!');

    // Check if products table has catalog seed data
    try {
      const prodCountRes = await pool.query('SELECT COUNT(*) FROM products');
      const count = parseInt(prodCountRes.rows[0]?.count || '0', 10);
      if (count < 8) {
        console.log(`⚡ Synchronizing rich catalog seed data (current products: ${count})...`);
        await runSqlScript(seedSqlPath);
        console.log('✅ Rich catalog seed data synchronized!');
      }
    } catch (e) {
      console.warn('⚡ Populating initial catalog seed data...');
      await runSqlScript(seedSqlPath);
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
