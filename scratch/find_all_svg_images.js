const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const imageRegex = /<image[^>]*xlink:href="([^"]+)"/g;
let match;
let count = 0;
while ((match = imageRegex.exec(svg)) !== null) {
  count++;
  console.log(`Image ${count}: length=${match[1].length}, prefix=${match[1].substring(0, 40)}`);
}
