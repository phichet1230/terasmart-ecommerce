const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/ecommerce-project_icon');
const imagesDir = path.join(__dirname, '../public/ecommerce-project_images');

console.log('--- ICONS DIR ---');
if (fs.existsSync(iconsDir)) {
  const files = fs.readdirSync(iconsDir);
  console.log(`Found ${files.length} icon files:`);
  files.forEach(f => console.log('  -', f));
} else {
  console.log('iconsDir does not exist yet:', iconsDir);
}

console.log('\n--- IMAGES DIR ---');
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);
  console.log(`Found ${files.length} image files:`);
  files.forEach(f => console.log('  -', f));
} else {
  console.log('imagesDir does not exist yet:', imagesDir);
}
