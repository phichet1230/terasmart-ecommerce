const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Find rects with y between 700 and 900
const rectRegex = /<rect[^>]*y="([\d\.-]+)"[^>]*>/g;
let match;
while ((match = rectRegex.exec(svg)) !== null) {
  const y = parseFloat(match[1]);
  if (y >= 700 && y <= 900) {
    console.log(`[y=${y}] ${match[0]}`);
  }
}
