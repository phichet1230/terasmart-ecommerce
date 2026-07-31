const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, '../public/ecommerce-project_icon');
const files = fs.readdirSync(iconDir);

files.forEach(file => {
  const content = fs.readFileSync(path.join(iconDir, file), 'utf8');
  console.log(`${file}: length ${content.length}`);
});
