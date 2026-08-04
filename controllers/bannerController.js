const pool = require('../config/db');

// Get all banners
exports.getBanners = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banners ORDER BY id ASC');
    if (result.rows.length === 0) {
      // Seed default banners if table is empty
      const defaultBanners = [
        { title: 'Our Brand of product - Tera Group', src: '/our_brands_all.png', active: true },
        { title: 'Industrial Automation & Inverter Solutions', src: '/hero_banner_full.png', active: true },
        { title: 'VEICHI AC Drives & High Precision Servo Motors', src: '/hero_machinery_showcase.png', active: true }
      ];

      for (const b of defaultBanners) {
        await pool.query(
          'INSERT INTO banners (title, src, active) VALUES ($1, $2, $3)',
          [b.title, b.src, b.active]
        );
      }
      const seeded = await pool.query('SELECT * FROM banners ORDER BY id ASC');
      return res.json({ success: true, data: seeded.rows });
    }
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching banners:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create banner
exports.createBanner = async (req, res) => {
  try {
    const { title, src, active = true } = req.body;
    const result = await pool.query(
      'INSERT INTO banners (title, src, active) VALUES ($1, $2, $3) RETURNING *',
      [title, src, active]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating banner:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, src, active } = req.body;
    const result = await pool.query(
      'UPDATE banners SET title = COALESCE($1, title), src = COALESCE($2, src), active = COALESCE($3, active) WHERE id = $4 RETURNING *',
      [title, src, active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating banner:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM banners WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('Error deleting banner:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
