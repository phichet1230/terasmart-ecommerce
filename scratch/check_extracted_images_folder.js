const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../public/ecommerce-project_images');
const files = fs.readdirSync(imgDir);

files.forEach(f => {
  const content = fs.readFileSync(path.join(imgDir, f), 'utf8');
  console.log(`${f}: ${content.substring(0, 100)}`);
});
