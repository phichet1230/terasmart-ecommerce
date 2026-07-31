const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Parse patterns and their width/height/image href
const patternRegex = /<pattern id="([^"]+)"[^>]*>[\s\S]*?<image[^>]+width="([^"]+)"[^>]+height="([^"]+)"[^>]+href="(data:image\/([^;]+);base64,([^"]+))"/g;

let match;
let count = 0;

while ((match = patternRegex.exec(svg)) !== null) {
  count++;
  const patternId = match[1];
  const w = match[2];
  const h = match[3];
  const mime = match[5];
  const base64 = match[6];
  const sizeKb = (base64.length / 1024).toFixed(1);
  console.log(`Pattern #${count} [${patternId}]: ${w}x${h} (${sizeKb} KB)`);
}

console.log('Done matching patterns');
