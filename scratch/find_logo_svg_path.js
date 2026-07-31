const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const content = fs.readFileSync(svgPath, 'utf8');

// Search for TERA logo paths or groups around the top header
console.log('SVG content length:', content.length);

// Let's find path definitions with red colors or circle tags
const circles = content.match(/<circle[^>]+>/g);
console.log('Found circles in SVG:', circles ? circles.length : 0);
if (circles) {
  circles.slice(0, 10).forEach((c, idx) => console.log(`Circle ${idx}:`, c));
}

// Let's search for "TERA" text or logo paths
const teraMatches = content.match(/<path[^>]+>/g);
console.log('Total paths in SVG:', teraMatches ? teraMatches.length : 0);
