const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const publicDir = path.join(__dirname, '../public');

if (fs.existsSync(svgPath)) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const matches = [...svg.matchAll(/id="(image\d+_[^"]+)"[^>]+xlink:href="data:image\/png;base64,([^"]+)"/g)];
  console.log(`Found ${matches.length} base64 images in SVG`);
  
  matches.forEach((m, idx) => {
    const id = m[1];
    const b64 = m[2];
    const buffer = Buffer.from(b64, 'base64');
    const filename = `svg_extracted_${idx}_${id.split('_')[0]}.png`;
    fs.writeFileSync(path.join(publicDir, filename), buffer);
    console.log(`Saved ${filename} (${buffer.length} bytes)`);
  });
}
