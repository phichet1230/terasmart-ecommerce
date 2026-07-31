const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../public/ecommerce-project_images');
const files = fs.readdirSync(imgDir);

files.forEach(file => {
  const content = fs.readFileSync(path.join(imgDir, file), 'utf8');
  const wMatch = content.match(/width="([^"]+)"/);
  const hMatch = content.match(/height="([^"]+)"/);
  const w = wMatch ? parseFloat(wMatch[1]) : 0;
  const h = hMatch ? parseFloat(hMatch[1]) : 0;
  console.log(`${file}: w=${w}, h=${h}`);
});
