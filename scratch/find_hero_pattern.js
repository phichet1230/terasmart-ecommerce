const fs = require('fs');
const path = require('path');

// Let's inspect the SVG text to see which pattern or image ID is placed inside the hero machinery container element in the SVG!
const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Search for hero elements or rects around y=64 to y=800
const rectRegex = /<rect[^>]+fill="url\(#([^)]+)\)"[^>]*>/g;
let match;
while ((match = rectRegex.exec(svg)) !== null) {
  console.log('Rect fill pattern:', match[1], 'full tag:', match[0].substring(0, 100));
}
