const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Migrating products table schema...');
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS spec_table JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Added images and spec_table columns to products table successfully!');

    // Seed demo images and technical spec tables for existing solar and electronic products
    const productsRes = await pool.query('SELECT id, name, image_url, description FROM products');
    for (const prod of productsRes.rows) {
      // Create multi-image array with 3-4 high quality product images
      let multiImages = [];
      if (prod.image_url) {
        multiImages.push(prod.image_url);
      }
      
      if (prod.name.includes('Buds')) {
        multiImages.push('https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80');
      } else if (prod.name.includes('Watch')) {
        multiImages.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80');
      } else if (prod.name.includes('Phone')) {
        multiImages.push('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80');
      } else {
        // Solar / Power / Hardware products
        multiImages.push('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80');
        multiImages.push('https://images.unsplash.com/photo-1548611716-3000632a9c7c?auto=format&fit=crop&w=800&q=80');
      }

      // Spec table array format: [{ label: "กำลังไฟฟ้าสูงสุด (Max Power)", value: "500W" }, ...]
      let specTable = [
        { label: 'ประเภทอุปกรณ์ (Device Type)', value: prod.name.includes('Buds') ? 'Wireless Earbuds' : prod.name.includes('Watch') ? 'Smart Watch' : 'Solar Hardware / Power System' },
        { label: 'กำลังไฟฟ้าสูงสุด (Rated Power)', value: prod.name.includes('PowerBank') ? '20,000 mAh (65W Fast Charge)' : '5,000W On-Grid Inverter' },
        { label: 'แรงดันไฟฟ้าขาเข้า (Input Voltage)', value: 'AC 220V - 240V / DC 150V - 500V' },
        { label: 'ประสิทธิภาพการทำงาน (Max Efficiency)', value: '98.6%' },
        { label: 'มาตรฐานการกันน้ำ/กันฝุ่น (IP Rating)', value: 'IP65 Water & Dustproof' },
        { label: 'การรับประกันสินค้า (Warranty)', value: 'รับประกันศูนย์ไทย 2 ปีเต็ม (2 Years Warranty)' }
      ];

      await pool.query(
        'UPDATE products SET images = $1, spec_table = $2 WHERE id = $3',
        [JSON.stringify(multiImages), JSON.stringify(specTable), prod.id]
      );
    }
    console.log('✅ Seeded demo multi-images and spec_table for all products!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
