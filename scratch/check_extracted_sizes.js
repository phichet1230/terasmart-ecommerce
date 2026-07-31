const fs = require('fs');
const path = require('path');

// Inspect dimensions of images
const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('extracted_img_'));
files.forEach(f => {
  const stat = fs.statSync(path.join(publicDir, f));
  console.log(`${f}: ${stat.size} bytes`);
});
