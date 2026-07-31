const fs = require('fs');
const path = require('path');
const { imageSize } = require('image-size'); // if available, or write custom inspection

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('extracted_img_'));

files.forEach(f => {
  const filePath = path.join(publicDir, f);
  const stat = fs.statSync(filePath);
  console.log(`${f}: ${(stat.size/1024).toFixed(1)} KB`);
});
