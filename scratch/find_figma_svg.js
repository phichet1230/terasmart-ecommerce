const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);
const targetSvg = files.find(f => f.includes('หน้าแรก') || f.endsWith('.svg'));
console.log('Target SVG file:', targetSvg);

if (targetSvg) {
  const content = fs.readFileSync(path.join(publicDir, targetSvg), 'utf8');
  console.log('SVG Length:', content.length);
}
