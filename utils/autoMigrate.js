const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function autoMigrateDatabase() {
  try {
    console.log('⚡ Ensuring all Database Tables exist...');

    // 1. Extensions
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'); } catch (e) {}
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); } catch (e) {}

    // 2. Core Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        phone VARCHAR(10) UNIQUE,
        role VARCHAR(50) DEFAULT 'customer',
        account_status VARCHAR(50) DEFAULT 'active',
        profile_image VARCHAR(555),
        google_id VARCHAR(255) UNIQUE,
        line_id VARCHAR(255) UNIQUE,
        facebook_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) REFERENCES users(email),
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(555) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20),
        discount_value DECIMAL(10, 2),
        min_order_amount DECIMAL(10, 2),
        expiry_date TIMESTAMP,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        short_description VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        deleted_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        variant_name VARCHAR(255),
        sku VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER REFERENCES product_variants(id),
        sale_price DECIMAL(10, 2),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        receiver_name VARCHAR(255),
        phone VARCHAR(10),
        address_detail TEXT,
        sub_district VARCHAR(100),
        district VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(10),
        is_default BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        coupon_id INTEGER REFERENCES coupons(id),
        subtotal DECIMAL(10, 2),
        discount_amount DECIMAL(10, 2),
        total_price DECIMAL(10, 2),
        tax_amount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        is_email_sent BOOLEAN DEFAULT FALSE,
        address_id INTEGER REFERENCES addresses(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id UUID REFERENCES orders(id),
        variant_id INTEGER REFERENCES product_variants(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID UNIQUE REFERENCES orders(id),
        method VARCHAR(50),
        amount DECIMAL(10, 2),
        payment_status VARCHAR(50) DEFAULT 'pending',
        slip_url VARCHAR(255),
        ai_verified_amount DECIMAL(10, 2),
        ai_verified_datetime TIMESTAMP,
        is_ai_verified BOOLEAN DEFAULT FALSE,
        transaction_ref VARCHAR(100),
        paid_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping (
        id SERIAL PRIMARY KEY,
        order_id UUID UNIQUE REFERENCES orders(id),
        tracking_number VARCHAR(100),
        courier_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'preparing'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(id),
        quantity INTEGER NOT NULL DEFAULT 1
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL DEFAULT 'promptpay',
        label VARCHAR(100) DEFAULT 'PromptPay',
        promptpay_number VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ All Database Tables verified successfully!');

    // 3. Seed default Admin & Customer accounts
    try {
      const adminHash = await bcrypt.hash('Password123!', 10);
      const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@terasmart.com']);
      if (adminCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (username, email, password_hash, phone, role, account_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['AdminTera', 'admin@terasmart.com', adminHash, '0899999999', 'admin', 'active']
        );
        console.log('✅ Default Admin user (admin@terasmart.com / Password123!) seeded!');
      } else {
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [adminHash, 'admin@terasmart.com']);
      }

      const custHash = await bcrypt.hash('customer1234', 10);
      const custCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['customer@terasmart.com']);
      if (custCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (username, email, password_hash, phone, role, account_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['TeraCustomer', 'customer@terasmart.com', custHash, '0812345678', 'customer', 'active']
        );
        console.log('✅ Default Customer user (customer@terasmart.com / customer1234) seeded!');
      }
    } catch (userErr) {
      console.warn('⚠️ Default users seeding notice:', userErr.message);
    }

    // 4. Sync initial products seed if catalog count < 8
    const prodCountRes = await pool.query('SELECT COUNT(*) FROM products');
    const count = parseInt(prodCountRes.rows[0]?.count || '0', 10);
    if (count < 8) {
      console.log(`⚡ Synchronizing rich catalog seed data (current products: ${count})...`);
      const seedSqlPath = path.join(__dirname, '../seed.sql');
      if (fs.existsSync(seedSqlPath)) {
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        const statements = seedSql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
        for (const stmt of statements) {
          try { await pool.query(stmt); } catch (e) {}
        }
      }
      console.log('✅ Catalog seed data synchronized!');
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
