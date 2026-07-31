const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const content = fs.readFileSync(svgPath, 'utf8');

const paths = [...content.matchAll(/<path[^>]+d="([^"]+)"[^>]*>/g)];
console.log(`Found ${paths.length} paths in SVG`);

paths.slice(0, 15).forEach((p, idx) => {
  console.log(`Path ${idx}:`, p[0].substring(0, 150));
});
