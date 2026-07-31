const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const imgDir = path.join(publicDir, 'ecommerce-project_images');

// Copy SVG files to descriptive public asset names so Storefront.tsx can render SVG files natively!
const map = {
  // Brand partner logos
  'brand_veichi.svg': 'image 101.svg',
  'brand_powran.svg': 'image 90.svg',
  'brand_mitsubishi.svg': 'image 96.svg',
  'brand_hitachi.svg': 'image 91.svg',
  'brand_fuji.svg': 'image 92.svg',
  'brand_sunways.svg': 'image 93.svg',
  'brand_risen.svg': 'image 94.svg',
  'brand_huawei.svg': 'image 95.svg',

  // Category card thumbnails
  'cat_robot.svg': 'image 171.svg',
  'cat_inverter.svg': 'image 170.svg',
  'cat_plc.svg': 'image 175.svg',
  'cat_iot.svg': 'image 176.svg',
  'cat_agri.svg': 'image 173.svg',
  'cat_cabinet.svg': 'image 174.svg',
  'cat_solar.svg': 'image 177.svg',
  'cat_parts.svg': 'image 172.svg',

  // Social icons
  'social_fb.svg': 'image 112.svg',
  'social_line.svg': 'image 113.svg',
  'social_tiktok.svg': 'image 114.svg',
  'social_yt.svg': 'image 115.svg',
  'social_shopee.svg': 'image 116.svg',
  'social_lazada.svg': 'image 117.svg',

  // Location card assets
  'company_map.svg': 'image 119.svg',
  'company_scan_qr.svg': 'image 120.svg',
  'company_qr.svg': 'image 121.svg',
  'building_pin.svg': 'building 1.svg',

  // Header & Footer logos
  'header_logo.svg': 'image 39.svg',
  'hero_banner_full.svg': 'image 165.svg'
};

Object.entries(map).forEach(([target, src]) => {
  const srcPath = path.join(imgDir, src);
  const targetPath = path.join(publicDir, target);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, targetPath);
    console.log(`Copied ${src} -> ${target}`);
  } else {
    console.log(`Src file missing: ${src}`);
  }
});
