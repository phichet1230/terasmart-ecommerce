const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const logoFiles = fs.readdirSync(publicDir).filter(f => f.toLowerCase().includes('logo') || f.toLowerCase().includes('header') || f.toLowerCase().includes('tera'));

console.log('Logo & Header files in public:');
logoFiles.forEach(f => {
  const stat = fs.statSync(path.join(publicDir, f));
  console.log(`${f}: ${stat.size} bytes`);
});
