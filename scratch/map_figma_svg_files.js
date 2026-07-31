const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/ecommerce-project_icon');
const imagesDir = path.join(__dirname, '../public/ecommerce-project_images');

console.log('=== MATCHING IMAGES ===');
const imageFiles = fs.readdirSync(imagesDir);
imageFiles.forEach(file => {
  const content = fs.readFileSync(path.join(imagesDir, file), 'utf8');
  // check if SVG contains embedded base64 image or vector path or specific attributes/text
  const hasEmbeddedImage = content.includes('<image') || content.includes('data:image');
  const widthMatch = content.match(/width="([^"]+)"/);
  const heightMatch = content.match(/height="([^"]+)"/);
  const w = widthMatch ? widthMatch[1] : '?';
  const h = heightMatch ? heightMatch[1] : '?';
  console.log(`${file}: w=${w}, h=${h}, embeddedImg=${hasEmbeddedImage}`);
});

console.log('\n=== MATCHING ICONS ===');
const iconFiles = fs.readdirSync(iconsDir);
iconFiles.forEach(file => {
  const content = fs.readFileSync(path.join(iconsDir, file), 'utf8');
  const widthMatch = content.match(/width="([^"]+)"/);
  const heightMatch = content.match(/height="([^"]+)"/);
  const w = widthMatch ? widthMatch[1] : '?';
  const h = heightMatch ? heightMatch[1] : '?';
  console.log(`${file}: w=${w}, h=${h}`);
});
