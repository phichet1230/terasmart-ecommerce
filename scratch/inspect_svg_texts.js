const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Find all text contents in the SVG
const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
let match;
console.log('--- ALL TEXTS IN SVG ---');
let count = 0;
while ((match = textRegex.exec(svg)) !== null && count < 50) {
  count++;
  const cleanText = match[1].replace(/<[^>]+>/g, '').trim();
  if (cleanText) console.log(`${count}: ${cleanText}`);
}
