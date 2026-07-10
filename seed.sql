-- 1. เพิ่มหมวดหมู่
INSERT INTO categories (name) VALUES ('Gadgets'), ('Accessories');

-- 2. เพิ่มสินค้า (อ้างอิง category_id = 1 คือ Gadgets)
INSERT INTO products (category_id, name, slug, short_description, is_active) 
VALUES (1, 'Tera Phone 15', 'tera-phone-15', 'สุดยอดมือถือจาก Tera Group', true);

-- 3. เพิ่มราคาและสต็อก (อ้างอิง product_id = 1)
INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity) 
VALUES (1, 'Standard', 'TERA-P15-STD', 25900.00, 10);