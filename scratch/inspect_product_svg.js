const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/สินค้า.svg');
if (fs.existsSync(svgPath)) {
  const stats = fs.statSync(svgPath);
  console.log(`สินค้า.svg exists! Size: ${stats.size} bytes`);
  const content = fs.readFileSync(svgPath, 'utf8');
  console.log('First 500 chars:', content.slice(0, 500));
} else {
  console.log('สินค้า.svg not found');
}
