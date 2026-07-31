const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg'), 'utf8');

// Find all patterns and images inside defs
const patternMatches = svgContent.match(/<pattern[^>]+id="([^"]+)"[\s\S]*?<\/pattern>/g) || [];
console.log(`Found ${patternMatches.length} patterns.`);

// Find rects and paths with coordinates
const rects = [];
const rectRegex = /<rect\s+([^>]+)\/>/g;
let rMatch;
while ((rMatch = rectRegex.exec(svgContent)) !== null) {
  const attrs = rMatch[1];
  const x = (attrs.match(/x="([^"]+)"/) || [])[1] || '0';
  const y = (attrs.match(/y="([^"]+)"/) || [])[1] || '0';
  const width = (attrs.match(/width="([^"]+)"/) || [])[1] || '0';
  const height = (attrs.match(/height="([^"]+)"/) || [])[1] || '0';
  const fill = (attrs.match(/fill="([^"]+)"/) || [])[1] || '';
  rects.push({ x: parseFloat(x), y: parseFloat(y), width: parseFloat(width), height: parseFloat(height), fill });
}

console.log('Top level rects (sorted by Y):');
rects.sort((a,b) => a.y - b.y).slice(0, 25).forEach(r => console.log(r));
