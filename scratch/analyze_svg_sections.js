const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg'), 'utf8');

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

console.log('--- Lower Section Rects (Y > 800) ---');
rects.filter(r => r.y > 800).sort((a,b) => a.y - b.y).forEach(r => console.log(r));
