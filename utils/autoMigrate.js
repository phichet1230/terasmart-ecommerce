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

      ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS spec_table TEXT DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_image_1 VARCHAR(500);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_image_2 VARCHAR(500);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS spec_headers TEXT DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS advice_list TEXT DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS accessories_list TEXT DEFAULT '[]';
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
        cancel_reason TEXT,
        cancelled_at TIMESTAMP,
        is_email_sent BOOLEAN DEFAULT FALSE,
        address_id INTEGER REFERENCES addresses(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure orders table columns exist
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
      ALTER TABLE orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
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
        ai_verified_status VARCHAR(50),
        qr_ref VARCHAR(255),
        ocr_raw_text TEXT,
        sending_bank VARCHAR(100),
        masked_sender_name VARCHAR(100),
        masked_sender_acc VARCHAR(100),
        iso20022_payload TEXT,
        transaction_ref VARCHAR(100),
        payment_date TIMESTAMP,
        paid_at TIMESTAMP
      );
    `);

    // Ensure payments table columns exist & expand slip_url / profile_image to TEXT
    await pool.query(`
      ALTER TABLE payments ALTER COLUMN slip_url TYPE TEXT;
      ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS ai_verified_status VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_ref VARCHAR(255);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS sending_bank VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS masked_sender_name VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS masked_sender_acc VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS iso20022_payload TEXT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping (
        id SERIAL PRIMARY KEY,
        order_id UUID UNIQUE REFERENCES orders(id),
        tracking_number VARCHAR(100),
        courier_name VARCHAR(100),
        tracking_url VARCHAR(255),
        status VARCHAR(50) DEFAULT 'preparing'
      );
    `);

    // Ensure shipping table columns exist
    await pool.query(`
      ALTER TABLE shipping ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(255);
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        src TEXT NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id UUID REFERENCES users(id),
        action VARCHAR(255),
        target_table VARCHAR(100),
        target_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      
      // Ensure Categories exist
      await pool.query(`
        INSERT INTO categories (id, name) VALUES 
        (1, 'ปั้มน้ำบาดาล'),
        (2, 'แผงโซล่าเซลล์ & ระบบพลังงาน'),
        (3, 'อะไหล่ & อุปกรณ์เสริม'),
        (4, 'สมาร์ทไอที & อิเล็กทรอนิกส์')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      `);

      // Ensure Products exist
      await pool.query(`
        INSERT INTO products (id, category_id, name, slug, description, short_description, is_active, image_url) VALUES 
        (1, 1, 'ปั๊มน้ำซับเมิร์สโซล่าเซลล์ Tera Solar Pump 4 นิ้ว (DC Brushless)', 'tera-solar-pump-4-inch', 'ปั๊มน้ำบาดาลโซล่าเซลล์ มอเตอร์ DC บรัสเลส ไร้แปรงถ่าน ประสิทธิภาพสูง ตัวเรือนสแตนเลส 304 ทนทาน รองรับแรงดันกว้าง', 'ปั๊มบาดาลโซล่าเซลล์ DC Brushless ประสิทธิภาพสูง', true, '/checkout_images/image 156.svg'),
        (2, 2, 'แผงโซล่าเซลล์ Tera Mono Half-Cut 550W (Tier 1 N-Type High Efficiency)', 'tera-mono-half-cut-550w', 'แผงโซล่าเซลล์ ชนิด โมโนคริสตัลไลน์ N-Type Half-Cut Cell กำลังผลิตสูงสุด 550W ผ่านการรับรองมาตรฐานสากล Tier 1', 'แผงโมโนคริสตัลไลน์ 550W Tier 1 N-Type', true, '/checkout_images/image 206.svg'),
        (3, 2, 'ตู้ควบคุมปั๊มน้ำโซล่าเซลล์อัตโนมัติ (DC Surge & Breaker Control Box)', 'tera-dc-control-box', 'ตู้ควบคุมระบบปั๊มน้ำโซล่าเซลล์สำเร็จรูป พร้อมอุปกรณ์ป้องกันฟ้าผ่า (Surge Protection) และเบรกเกอร์ DC ตัดการทำงานอัตโนมัติเมื่อน้ำแห้ง', 'ตู้สำเร็จรูป เบรกเกอร์ + ป้องกันฟ้าผ่า DC', true, '/checkout_images/image 207.svg'),
        (4, 4, 'Tera Phone 15 Pro Max 5G (Flagship Smartphone)', 'tera-phone-15-pro-max', 'สมาร์ทโฟนระดับเรือธง ชิปประมวลผลรุ่นใหม่ล่าสุด จอแสดงผล 120Hz Super Retina XDR กล้องถ่ายภาพความละเอียดสูง 108MP พร้อมระบบชาร์จไว', 'สุดยอดสมาร์ทโฟนเรือธงจาก Tera Group', true, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800'),
        (5, 4, 'Tera Laptop Pro 16 Workstation Notebook', 'tera-laptop-pro-16', 'แล็ปท็อปสำหรับการทำงานวิศวกรรมและการประมวลผลหนัก หน้าจอ 16 นิ้ว 4K OLED ตัวเรือนอลูมิเนียมแอร์คราฟต์เกรด', 'โน้ตบุ๊กประสิทธิภาพสูงเพื่อการทำงานระดับมืออาชีพ', true, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'),
        (6, 4, 'Tera Smart Watch Ultra 2 (Solar Charging & GPS)', 'tera-smart-watch-ultra-2', 'นาฬิกาสมาร์ทวอทช์สายลุย ชาร์จพลังงานแสงอาทิตย์ได้ในตัว วัดระดับออกซิเจน การเต้นของหัวใจ พร้อมระบบ GPS นำทางแม่นยำสูง', 'สมาร์ทวอทช์ชาร์จแสงอาทิตย์ พร้อม GPS', true, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800'),
        (7, 3, 'สายไฟจุ่มน้ำ VCT 3x2.5 sq.mm (Submersible Power Cable)', 'tera-submersible-cable-vct-3x25', 'สายไฟชนิด VCT 3 ฉนวนกันน้ำพิเศษ 3-Core สำหรับงานปั๊มน้ำบาดาลจุ่มน้ำ ทนความชื้นและแรงดันน้ำลึกได้อย่างดีเยี่ยม', 'สายไฟจุ่มน้ำปั๊มบาดาลชนิด VCT 3x2.5 sq.mm', true, '/checkout_images/image 208.svg'),
        (8, 3, 'สลิงสแตนเลส 304 หนา 4 มม. (Stainless Steel Wire Rope)', 'tera-stainless-wire-rope-4mm', 'สลิงสแตนเลสเกรด 304 ไร้สนิม ทนทานแรงดึงสูง สำหรับผูกแขวนปั๊มน้ำบาดาลในบ่อลึก ปลอดภัยตลอดอายุการใช้งาน', 'สลิงสแตนเลส 304 หนา 4 มม. พร้อมกิ๊บล็อก', true, '/checkout_images/image 209.svg')
        ON CONFLICT (id) DO UPDATE SET 
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          is_active = EXCLUDED.is_active,
          image_url = EXCLUDED.image_url;
      `);

      // Ensure Variants exist
      await pool.query(`
        INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) VALUES 
        (1, 'รุ่น 1100W (1.5 HP) 80-210V', 'TERA-SI4VS-1100', 18500.00, 15),
        (1, 'รุ่น 1500W (2.0 HP) 110-250V', 'TERA-SI4VS-1500', 24900.00, 10),
        (1, 'รุ่น 2200W (3.0 HP) High Flow', 'TERA-SI4VS-2200', 32500.00, 8),
        (2, 'ชุด 1 แผง (Single Panel)', 'TERA-SOLAR-550W-1', 3500.00, 50),
        (2, 'แพ็ค 4 แผง (Set of 4 Panels)', 'TERA-SOLAR-550W-4', 13200.00, 20),
        (3, 'รุ่นมาตรฐาน DC 1000V (Standard)', 'TERA-BOX-DC-STD', 1450.00, 30),
        (3, 'รุ่นพรีเมียม AC/DC Hybrid Auto Switch', 'TERA-BOX-HYBRID', 3850.00, 15),
        (4, 'ความจุ 256GB - Titanium Natural', 'TERA-P15-256GB', 42900.00, 12),
        (4, 'ความจุ 512GB - Titanium Black', 'TERA-P15-512GB', 48900.00, 5),
        (5, 'RAM 18GB / SSD 512GB', 'TERA-LAP-18GB', 69900.00, 7),
        (5, 'RAM 36GB / SSD 1TB', 'TERA-LAP-36GB', 89900.00, 4),
        (6, 'สายสปอร์ต Titanium Band', 'TERA-WATCH-ULTRA', 14900.00, 25),
        (7, 'ความยาว 50 เมตร', 'TERA-CABLE-50M', 2250.00, 40),
        (7, 'ความยาว 100 เมตร', 'TERA-CABLE-100M', 4100.00, 20),
        (8, 'ความยาว 50 เมตร + กิ๊บล็อก 4 ตัว', 'TERA-ROPE-50M', 980.00, 35)
        ON CONFLICT (sku) DO UPDATE SET 
          variant_name = EXCLUDED.variant_name,
          price = EXCLUDED.price,
          stock_quantity = EXCLUDED.stock_quantity;
      `);

      try {
        await pool.query("SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1))");
        await pool.query("SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1))");
        await pool.query("SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 1))");
      } catch (seqErr) {}

      console.log('✅ Catalog seed data synchronized successfully!');
    }
  } catch (err) {
    console.error('⚠️ Auto migration notice:', err.message);
  }
}

module.exports = autoMigrateDatabase;
