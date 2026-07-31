const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const heroFiles = fs.readdirSync(publicDir).filter(f => f.toLowerCase().includes('hero'));
console.log('Hero files in public:', heroFiles);

heroFiles.forEach(f => {
  const stat = fs.statSync(path.join(publicDir, f));
  console.log(`${f}: ${stat.size} bytes`);
});
