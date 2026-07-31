const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../public/assets_extracted');
const dstDir = path.join(__dirname, '../public');

const copyMap = {
  'asset_5_w906_h258.png': 'tera_banner_logo.png',
  'asset_31_w918_h247.png': 'tera_footer_logo.png',
  'asset_39_w320_h114.png': 'tera_logo_red_badge.png',
  'asset_10_w1448_h1086.png': 'hero_machinery_showcase.png',
  'asset_11_w1448_h1086.png': 'hero_machinery_showcase_alt.png',
  
  // Category images
  'asset_13_w480_h360.png': 'cat_robot.png',
  'asset_14_w262_h400.png': 'cat_inverter.png',
  'asset_15_w336_h400.png': 'cat_plc.png',
  'asset_16_w312_h377.png': 'cat_iot.png',
  'asset_17_w246_h320.png': 'cat_agri.png',
  'asset_18_w360_h480.png': 'cat_cabinet.png',
  'asset_19_w565_h800.png': 'cat_solar.png',
  'asset_20_w360_h480.png': 'cat_parts.png',

  // Brands
  'asset_23_w361_h69.png': 'brand_veichi.png',
  'asset_24_w360_h180.png': 'brand_powran.png',
  'asset_25_w400_h122.png': 'brand_mitsubishi.png',
  'asset_26_w384_h216.png': 'brand_hitachi.png',
  'asset_27_w500_h500.png': 'brand_fuji.png',
  'asset_28_w395_h132.png': 'brand_sunways.png',
  'asset_29_w400_h121.png': 'brand_risen.png',
  'asset_30_w433_h95.png': 'brand_huawei.png',

  // Location & Contact
  'asset_37_w800_h754.png': 'company_map.png',
  'asset_40_w358_h362.png': 'company_qr.png',
  'asset_38_w800_h480.png': 'company_scan_qr.png'
};

for (const [srcName, dstName] of Object.entries(copyMap)) {
  const srcPath = path.join(srcDir, srcName);
  const dstPath = path.join(dstDir, dstName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
    console.log(`Copied ${srcName} -> ${dstName}`);
  } else {
    console.warn(`File missing: ${srcName}`);
  }
}

console.log('Copy finished successfully!');
