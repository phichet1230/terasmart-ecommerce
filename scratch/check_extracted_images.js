const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('svg_extracted_'));

console.log('Extracted Image sizes and names:');
files.forEach(f => {
  const stat = fs.statSync(path.join(publicDir, f));
  console.log(`${f}: ${stat.size} bytes`);
});
