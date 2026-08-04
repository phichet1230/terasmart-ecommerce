-- 1. เปิดใช้งาน Extension สำหรับรหัสสุ่ม UUID (ใช้อันที่มีในระบบ)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. สร้างตารางสมาชิกและสิทธิ์การใช้งาน
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

-- 3. ตารางรีเซ็ตรหัสผ่าน
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) REFERENCES users(email),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- 3.5 ตารางเก็บ Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(555) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- 4. ตารางคูปองส่วนลด
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20), -- fixed, percentage
    discount_value DECIMAL(10, 2),
    min_order_amount DECIMAL(10, 2),
    expiry_date TIMESTAMP,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0
);

-- 5. ตารางสินค้าและหมวดหมู่
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE products (
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

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(255),
    sku VARCHAR(255) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0
);

-- 6. ตาราง Flash Sales
CREATE TABLE flash_sales (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER REFERENCES product_variants(id),
    sale_price DECIMAL(10, 2),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. ตารางที่อยู่จัดส่ง
CREATE TABLE addresses (
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

-- 8. ตารางคำสั่งซื้อและรายการสินค้า
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

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    variant_id INTEGER REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- 9. ตารางการชำระเงินและการจัดส่ง
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

-- Anti-Replay Protection: UNIQUE partial indexes (Idempotency & ISO 20022)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_bank_txref_unique
  ON payments (sending_bank, transaction_ref)
  WHERE payment_status = 'completed' AND transaction_ref IS NOT NULL AND sending_bank IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_qr_ref_unique
  ON payments (qr_ref)
  WHERE payment_status = 'completed' AND qr_ref IS NOT NULL;


CREATE TABLE IF NOT EXISTS shipping (
    id SERIAL PRIMARY KEY,
    order_id UUID UNIQUE REFERENCES orders(id),
    tracking_number VARCHAR(100),
    courier_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'preparing'
);

-- 10. ตารางบันทึกการทำงานแอดมิน (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    action VARCHAR(255),
    target_table VARCHAR(100),
    target_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางตะกร้าสินค้า (Carts)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางรายการในตะกร้า (Cart Items)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1
);

-- 13. ตารางวิธีชำระเงินที่บันทึกไว้ (Saved Payment Methods - PromptPay)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'promptpay',   -- ประเภท: promptpay
    label VARCHAR(100) DEFAULT 'PromptPay',           -- ชื่อที่แสดง เช่น "PromptPay ธนาคารไทย"
    promptpay_number VARCHAR(20),                      -- เบอร์มือถือหรือเลขบัตรประชาชน
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);