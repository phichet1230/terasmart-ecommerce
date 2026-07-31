const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const scratchDir = path.join(__dirname, '../scratch');

for (let i = 1; i <= 8; i++) {
  const svgFile = path.join(publicDir, `cat_card_${i}.svg`);
  const content = fs.readFileSync(svgFile, 'utf8');
  const match = content.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (match) {
    const buffer = Buffer.from(match[1], 'base64');
    const outPath = path.join(scratchDir, `preview_cat_card_${i}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved preview_cat_card_${i}.png (${buffer.length} bytes)`);
  }
}
