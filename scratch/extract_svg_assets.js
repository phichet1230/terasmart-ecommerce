const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Find all href / xlink:href data URIs
const regex = /(?:href|xlink:href)="(data:image\/([^;]+);base64,([^"]+))"/g;
let match;
let i = 0;

while ((match = regex.exec(svg)) !== null) {
  i++;
  const mime = match[2];
  const base64Data = match[3];
  const ext = mime === 'jpeg' ? 'jpg' : mime;
  const fileName = `extracted_img_${i}.${ext}`;
  const outputPath = path.join(__dirname, '../public', fileName);
  fs.writeFileSync(outputPath, base64Data, 'base64');
  console.log(`Extracted image #${i}: ${fileName} (${(base64Data.length/1024).toFixed(1)} KB)`);
}

console.log(`Total images extracted: ${i}`);
