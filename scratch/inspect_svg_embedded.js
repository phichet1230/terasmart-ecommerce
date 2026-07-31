const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

for (let i = 1; i <= 8; i++) {
  const fileName = `cat_card_${i}.svg`;
  const filePath = path.join(publicDir, fileName);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`--- ${fileName} (${content.length} chars) ---`);
    const images = content.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g);
    console.log(`Embedded PNGs in ${fileName}:`, images ? images.length : 0);
  }
}
