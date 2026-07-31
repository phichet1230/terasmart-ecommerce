const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

console.log('SVG Length:', svg.length);
// Extract width, height, viewBox
const widthMatch = svg.match(/width="([^"]+)"/);
const heightMatch = svg.match(/height="([^"]+)"/);
const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

console.log('Width:', widthMatch ? widthMatch[1] : '?');
console.log('Height:', heightMatch ? heightMatch[1] : '?');
console.log('ViewBox:', viewBoxMatch ? viewBoxMatch[1] : '?');

// Let's inspect the first 20 tags
const tags = svg.match(/<[a-zA-Z0-9]+[^>]*>/g);
console.log('Total tags:', tags ? tags.length : 0);
if (tags) {
  console.log('First 20 tags:');
  tags.slice(0, 20).forEach((t, i) => console.log(`${i+1}: ${t.substring(0, 100)}`));
}
