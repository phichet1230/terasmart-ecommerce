const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('svg_extracted_'));

console.log('List of extracted images:');
files.forEach(f => {
  const size = fs.statSync(path.join(publicDir, f)).size;
  console.log(`${f}: ${size} bytes`);
});
