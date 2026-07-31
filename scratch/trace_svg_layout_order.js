const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

console.log('=== SVG OVERALL DIMENSIONS ===');
const viewBox = svg.match(/viewBox="([^"]+)"/);
console.log('viewBox:', viewBox ? viewBox[1] : 'unknown');

// Extract all <rect>, <g>, <image> with x, y, width, height
const rectRegex = /<(rect|image|g|path)[^>]*?(?:x="([^"]+)"|y="([^"]+)"|width="([^"]+)"|height="([^"]+)"|fill="([^"]+)"|id="([^"]+)"|transform="([^"]+)")+[^>]*?>/g;

// Let's parse all top level elements inside clip0
const topElements = [];
let match;
const elemRegex = /<([a-zA-Z0-9]+)\s+[^>]*?y="([\d\.-]+)"[^>]*?>/g;
while ((match = elemRegex.exec(svg)) !== null) {
  topElements.push({ tag: match[1], y: parseFloat(match[2]), raw: match[0].substring(0, 120) });
}

topElements.sort((a, b) => a.y - b.y);

console.log('\n=== TOP ELEMENTS ORDER BY Y-POSITION ===');
topElements.slice(0, 40).forEach((item, i) => {
  console.log(`${i + 1}. [y=${item.y}] <${item.tag}> ${item.raw}`);
});
