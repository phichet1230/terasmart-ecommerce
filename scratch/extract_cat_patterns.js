const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const publicDir = path.join(__dirname, '../public');

for (let i = 9; i <= 23; i++) {
  const patternId = `pattern${i}_199_125`;
  const pRegex = new RegExp(`<pattern id="${patternId}"[\\s\\S]*?<image[^>]*xlink:href="data:image\\/png;base64,([^"]+)"`);
  const match = pRegex.exec(svg);
  if (match) {
    const base64Data = match[1];
    const buf = Buffer.from(base64Data, 'base64');
    // Save to public as cat_real_img_${i}.png
    const outName = `cat_real_img_${i}.png`;
    fs.writeFileSync(path.join(publicDir, outName), buf);
    console.log(`Saved pattern${i} -> ${outName} (${buf.length} bytes)`);
  } else {
    console.log(`Pattern not found: ${patternId}`);
  }
}
