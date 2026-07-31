const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const content = fs.readFileSync(svgPath, 'utf8');

console.log('=== SVG Dimensions ===');
const svgMatch = content.match(/<svg[^>]+>/);
if (svgMatch) console.log(svgMatch[0]);

console.log('\n=== All Text Nodes in SVG ===');
const textRegex = /<text[^>]*>(.*?)<\/text>/g;
let match;
const texts = [];
while ((match = textRegex.exec(content)) !== null) {
  texts.push(match[1].replace(/<[^>]+>/g, '').trim());
}

// Also check path text / font definitions / image elements / colors
console.log(`Found ${texts.length} text elements:`);
texts.forEach((t, i) => console.log(`${i+1}. ${t}`));

// Find all hex colors
const colors = [...new Set(content.match(/#[0-9A-Fa-f]{3,8}/g) || [])];
console.log('\n=== Unique Colors ===', colors);

// Find images / xlink
const images = [...new Set(content.match(/xlink:href="[^"]+"/g) || [])];
console.log('\n=== Image References ===', images.slice(0, 10));
