// Script to create employee accounts for Stock and Accounting departments
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function createEmployeeAccounts() {
  try {
    console.log('🔧 Creating employee accounts...\n');

    const stockPasswordHash = await bcrypt.hash('stock1234', 10);
    const accountingPasswordHash = await bcrypt.hash('accounting1234', 10);

    // Check if stock user already exists
    const existingStock = await pool.query("SELECT id FROM users WHERE email = 'stock@terasmart.com'");
    if (existingStock.rows.length === 0) {
      const stockUser = await pool.query(
        `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role`,
        ['StockTera', 'stock@terasmart.com', stockPasswordHash, '0811111111', 'stock', 'active']
      );
      console.log('✅ Stock employee created:', stockUser.rows[0]);
    } else {
      // Update existing to make sure password and role are correct
      await pool.query(
        "UPDATE users SET password_hash = $1, role = 'stock', account_status = 'active' WHERE email = 'stock@terasmart.com'",
        [stockPasswordHash]
      );
      console.log('✅ Stock employee already exists — password reset to stock1234');
    }

    // Check if accounting user already exists
    const existingAccounting = await pool.query("SELECT id FROM users WHERE email = 'accounting@terasmart.com'");
    if (existingAccounting.rows.length === 0) {
      const accountingUser = await pool.query(
        `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role`,
        ['AccountingTera', 'accounting@terasmart.com', accountingPasswordHash, '0822222222', 'accounting', 'active']
      );
      console.log('✅ Accounting employee created:', accountingUser.rows[0]);
    } else {
      await pool.query(
        "UPDATE users SET password_hash = $1, role = 'accounting', account_status = 'active' WHERE email = 'accounting@terasmart.com'",
        [accountingPasswordHash]
      );
      console.log('✅ Accounting employee already exists — password reset to accounting1234');
    }

    // Also reset admin password just in case
    const adminPasswordHash = await bcrypt.hash('admin1234', 10);
    const existingAdmin = await pool.query("SELECT id FROM users WHERE email = 'admin@terasmart.com'");
    if (existingAdmin.rows.length > 0) {
      await pool.query(
        "UPDATE users SET password_hash = $1, role = 'admin', account_status = 'active' WHERE email = 'admin@terasmart.com'",
        [adminPasswordHash]
      );
      console.log('✅ Admin password reset to admin1234');
    }

    console.log('\n========================================');
    console.log('📋 Employee Account Summary:');
    console.log('========================================');
    console.log('');
    console.log('👨‍💼 Admin (ผู้ดูแลระบบ)');
    console.log('   Email:    admin@terasmart.com');
    console.log('   Password: admin1234');
    console.log('');
    console.log('📦 Stock (ฝ่ายคลังสินค้า)');
    console.log('   Email:    stock@terasmart.com');
    console.log('   Password: stock1234');
    console.log('');
    console.log('💰 Accounting (ฝ่ายการเงิน/บัญชี)');
    console.log('   Email:    accounting@terasmart.com');
    console.log('   Password: accounting1234');
    console.log('========================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating employee accounts:', err.message);
    process.exit(1);
  }
}

createEmployeeAccounts();
