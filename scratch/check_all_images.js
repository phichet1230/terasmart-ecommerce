const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

files.forEach(f => {
  if (f.endsWith('.png') || f.endsWith('.svg')) {
    const stat = fs.statSync(path.join(publicDir, f));
    console.log(`${f}: ${stat.size} bytes`);
  }
});
