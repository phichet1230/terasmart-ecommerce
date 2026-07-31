const fs = require('fs');
const path = require('path');

// Let's inspect embedded base64 URIs in หน้าแรกตอนเข้าเว็บ.svg
const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Find all pattern images
const patternRegex = /<pattern id="([^"]+)"[\s\S]*?<image[^>]*xlink:href="data:image\/png;base64,([^"]+)"/g;
let match;
let idx = 0;
while ((match = patternRegex.exec(svg)) !== null) {
  idx++;
  const patternId = match[1];
  const base64Data = match[2];
  const buf = Buffer.from(base64Data, 'base64');
  console.log(`Pattern ${patternId}: ${buf.length} bytes -> extracted_img_${idx}.png`);
}
