-- 1. ลบข้อมูลเดิมอย่างปลอดภัย
DELETE FROM order_items;
DELETE FROM shipping;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;

-- 2. หมวดหมู่สินค้า (Categories)
INSERT INTO categories (id, name) VALUES 
(1, 'ปั๊มน้ำ & พลังงานโซล่าเซลล์'),
(2, 'สมาร์ทไอที & อิเล็กทรอนิกส์'),
(3, 'อุปกรณ์เสริม & สายไฟโซล่าร์')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. เพิ่มรายการสินค้า (Products)
INSERT INTO products (id, category_id, name, slug, description, short_description, is_active, image_url) VALUES 
(1, 1, 'ปั๊มน้ำซับเมิร์สโซล่าเซลล์ Tera Solar Pump 4 นิ้ว (DC Brushless)', 'tera-solar-pump-4-inch', 'ปั๊มน้ำบาดาลโซล่าเซลล์ มอเตอร์ DC บรัสเลส ไร้แปรงถ่าน ประสิทธิภาพสูง ตัวเรือนสแตนเลส 304 ทนทาน รองรับแรงดันกว้าง', 'ปั๊มบาดาลโซล่าเซลล์ DC Brushless ประสิทธิภาพสูง', true, '/checkout_images/image 156.svg'),
(2, 1, 'แผงโซล่าเซลล์ Tera Mono Half-Cut 550W (Tier 1 N-Type High Efficiency)', 'tera-mono-half-cut-550w', 'แผงโซล่าเซลล์ ชนิด โมโนคริสตัลไลน์ N-Type Half-Cut Cell กำลังผลิตสูงสุด 550W ผ่านการรับรองมาตรฐานสากล Tier 1', 'แผงโมโนคริสตัลไลน์ 550W Tier 1 N-Type', true, '/checkout_images/image 206.svg'),
(3, 1, 'ตู้ควบคุมปั๊มน้ำโซล่าเซลล์อัตโนมัติ (DC Surge & Breaker Control Box)', 'tera-dc-control-box', 'ตู้ควบคุมระบบปั๊มน้ำโซล่าเซลล์สำเร็จรูป พร้อมอุปกรณ์ป้องกันฟ้าผ่า (Surge Protection) และเบรกเกอร์ DC ตัดการทำงานอัตโนมัติเมื่อน้ำแห้ง', 'ตู้สำเร็จรูป เบรกเกอร์ + ป้องกันฟ้าผ่า DC', true, '/checkout_images/image 207.svg'),
(4, 2, 'Tera Phone 15 Pro Max 5G (Flagship Smartphone)', 'tera-phone-15-pro-max', 'สมาร์ทโฟนระดับเรือธง ชิปประมวลผลรุ่นใหม่ล่าสุด จอแสดงผล 120Hz Super Retina XDR กล้องถ่ายภาพความละเอียดสูง 108MP พร้อมระบบชาร์จไว', 'สุดยอดสมาร์ทโฟนเรือธงจาก Tera Group', true, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800'),
(5, 2, 'Tera Laptop Pro 16 Workstation Notebook', 'tera-laptop-pro-16', 'แล็ปท็อปสำหรับการทำงานวิศวกรรมและการประมวลผลหนัก หน้าจอ 16 นิ้ว 4K OLED ตัวเรือนอลูมิเนียมแอร์คราฟต์เกรด', 'โน้ตบุ๊กประสิทธิภาพสูงเพื่อการทำงานระดับมืออาชีพ', true, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'),
(6, 2, 'Tera Smart Watch Ultra 2 (Solar Charging & GPS)', 'tera-smart-watch-ultra-2', 'นาฬิกาสมาร์ทวอทช์สายลุย ชาร์จพลังงานแสงอาทิตย์ได้ในตัว วัดระดับออกซิเจน การเต้นของหัวใจ พร้อมระบบ GPS นำทางแม่นยำสูง', 'สมาร์ทวอทช์ชาร์จแสงอาทิตย์ พร้อม GPS', true, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800'),
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

-- 4. เพิ่มรายการรุ่น/ตัวเลือกสินค้า (Product Variants)
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

(8, 'ความยาว 50 เมตร + กิ๊บล็อก 4 ตัว', 'TERA-ROPE-50M', 980.00, 35);

-- 5. ปรับอัปเดตค่า Auto-Increment Sequence ให้สอดคล้องกับ ID ที่เพิ่มใหม่
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 1));