const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database for setup...');

    // 1. Read and execute init.sql to ensure database structure is created
    const initSqlPath = path.join(__dirname, 'init.sql');
    console.log('Reading init.sql from:', initSqlPath);
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS cart_items, carts, audit_logs, shipping, payments, order_items, orders, addresses, flash_sales, product_variants, products, categories, password_resets, refresh_tokens, coupons, users CASCADE;
    `);

    console.log('Executing init.sql...');
    // Remove the select lines that might cause syntax error when executed in batch
    const sqlStatements = initSql
      .replace(/SELECT \* FROM users;/g, '')
      .replace(/SELECT count\(\*\) FROM users;/g, '');
    
    await client.query(sqlStatements);
    console.log('Database tables created successfully.');

    // 2. Clear old data
    console.log('Clearing old data...');
    await client.query('TRUNCATE cart_items, carts, audit_logs, shipping, payments, order_items, orders, addresses, flash_sales, product_variants, products, categories, users CASCADE');

    // 3. Seed users
    console.log('Seeding users...');
    const adminPasswordHash = await bcrypt.hash('admin1234', 10);
    const customerPasswordHash = await bcrypt.hash('customer1234', 10);
    const departmentPasswordHash = await bcrypt.hash('password123', 10);

    const adminUser = await client.query(
      `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['AdminTera', 'admin@terasmart.com', adminPasswordHash, '0811111111', 'admin', 'active']
    );
    console.log('Admin user seeded. ID:', adminUser.rows[0].id);

    const stockUser = await client.query(
      `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['StockTera', 'stock@terasmart.com', departmentPasswordHash, '0822222222', 'stock', 'active']
    );
    console.log('Stock user seeded. ID:', stockUser.rows[0].id);

    const accountingUser = await client.query(
      `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['AccountingTera', 'accounting@terasmart.com', departmentPasswordHash, '0833333333', 'accounting', 'active']
    );
    console.log('Accounting user seeded. ID:', accountingUser.rows[0].id);

    const customerUser = await client.query(
      `INSERT INTO users (username, email, password_hash, phone, role, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['TeraCustomer', 'customer@terasmart.com', customerPasswordHash, '0812345678', 'customer', 'active']
    );
    console.log('Customer user seeded. ID:', customerUser.rows[0].id);

    // 4. Seed categories
    console.log('Seeding categories...');
    const catGadgets = await client.query("INSERT INTO categories (name) VALUES ('Gadgets') RETURNING id");
    const catAccessories = await client.query("INSERT INTO categories (name) VALUES ('Accessories') RETURNING id");
    const catWearables = await client.query("INSERT INTO categories (name) VALUES ('Wearables') RETURNING id");

    const gid = catGadgets.rows[0].id;
    const aid = catAccessories.rows[0].id;
    const wid = catWearables.rows[0].id;

    // 5. Seed products & variants
    console.log('Seeding products & variants...');
    
    // Product 1: Tera Phone 15
    const p1 = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [gid, 'Tera Phone 15', 'tera-phone-15', 'สุดยอดสมาร์ทโฟนแห่งยุคจาก Tera Group', 'Tera Phone 15 มาพร้อมกับหน้าจอ Super AMOLED ขนาด 6.7 นิ้ว ชิปเซ็ตประมวลผล Tera Bionic Octa-core กล้องหลังความละเอียดสูง 108MP พร้อมระบบ AI สแกนภาพ แบตเตอรี่ 5000mAh รองรับชาร์จไว 65W พร้อมดีไซน์สุดพรีเมียม ขอบเซรามิกหรูหรา', true]
    );
    const p1Id = p1.rows[0].id;
    await client.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) VALUES
       ($1, 'Titanium Black 128GB', 'TERA-P15-128-BLK', 25900.00, 15),
       ($1, 'Titanium Silver 256GB', 'TERA-P15-256-SLV', 29900.00, 10),
       ($1, 'Titanium Gold 512GB', 'TERA-P15-512-GLD', 34900.00, 0)`,
      [p1Id]
    );

    // Product 2: Tera Watch v2
    const p2 = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [wid, 'Tera Watch v2', 'tera-watch-v2', 'นาฬิกาอัจฉริยะเพื่อคนรักสุขภาพ', 'Tera Watch v2 อัจฉริยะด้วยระบบเซ็นเซอร์วัดอัตราการเต้นของหัวใจตลอด 24 ชั่วโมง, ระบบตรวจวัดออกซิเจนในเลือด SpO2, โหมดออกกำลังกายกว่า 100 ชนิด, หน้าจอ AMOLED ป้องกันรอยขีดข่วน, กันน้ำระดับ 5ATM แบตเตอรี่ใช้งานได้ยาวนานถึง 14 วันต่อการชาร์จหนึ่งครั้ง', true]
    );
    const p2Id = p2.rows[0].id;
    await client.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) VALUES
       ($1, 'Sport Edition Black', 'TERA-W2-SPRT-BLK', 5900.00, 8),
       ($1, 'Classic Edition Leather', 'TERA-W2-CLSC-LTH', 7500.00, 4)`,
      [p2Id]
    );

    // Product 3: Tera Buds Pro
    const p3 = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [aid, 'Tera Buds Pro', 'tera-buds-pro', 'หูฟังไร้สายพร้อมระบบตัดเสียงรบกวนอัจฉริยะ', 'Tera Buds Pro หูฟัง True Wireless ที่ให้พลังเสียงระดับ Hi-Res Audio มาพร้อมระบบ Active Noise Cancellation (ANC) ตัดเสียงรบกวนภายนอกได้สูงสุด 40dB, โหมดรับเสียงภายนอก Ambient Mode, ไมโครโฟน 3 ตัวพร้อมเทคโนโลยี AI ช่วยให้สนทนาโทรศัพท์ได้อย่างชัดเจน เคสชาร์จไร้สาย ใช้งานได้ยาวนานสูงสุด 30 ชั่วโมง', true]
    );
    const p3Id = p3.rows[0].id;
    await client.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) VALUES
       ($1, 'Polar White', 'TERA-BUDS-WHT', 3200.00, 20),
       ($1, 'Midnight Blue', 'TERA-BUDS-BLU', 3200.00, 12)`,
      [p3Id]
    );

    // Product 4: Tera PowerBank 20k
    const p4 = await client.query(
      `INSERT INTO products (category_id, name, slug, short_description, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [aid, 'Tera PowerBank 20K', 'tera-pb-20k', 'พาวเวอร์แบงค์ความจุสูง ชาร์จไว 22.5W', 'Tera PowerBank ความจุ 20,000mAh ขนาดกะทัดรัด พกพาสะดวก รองรับระบบชาร์จเร็ว Power Delivery (PD) และ Quick Charge 3.0 จ่ายไฟสูงสุด 22.5W มีหน้าจอ LED แสดงเปอร์เซ็นต์แบตเตอรี่คงเหลือ รองรับการชาร์จพร้อมกันได้สูงสุด 3 อุปกรณ์ มีระบบป้องกันความปลอดภัยอย่างสมบูรณ์แบบ', true]
    );
    const p4Id = p4.rows[0].id;
    await client.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) VALUES
       ($1, 'Matte Black', 'TERA-PB20-BLK', 1290.00, 2)`,
      [p4Id]
    );

    // 6. Seed addresses for default customer
    console.log('Seeding addresses...');
    const custId = customerUser.rows[0].id;
    await client.query(
      `INSERT INTO addresses (user_id, receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [custId, 'สมชาย สายตรวจ', '0812345678', '999/99 หมู่บ้านสิริกมล ซอย 5', 'คลองกุ่ม', 'บึงกุ่ม', 'กรุงเทพมหานคร', '10240', true]
    );
    await client.query(
      `INSERT INTO addresses (user_id, receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [custId, 'สมชาย สายตรวจ (ที่ทำงาน)', '0812345678', 'อาคารทีซีซี ทาวเวอร์ ชั้น 18', 'ห้วยขวาง', 'ห้วยขวาง', 'กรุงเทพมหานคร', '10310', false]
    );

    console.log('All seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

main();
