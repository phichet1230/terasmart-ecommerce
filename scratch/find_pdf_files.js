const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
console.log('PDF files in public:', pdfFiles);

pdfFiles.forEach(f => {
  const stat = fs.statSync(path.join(publicDir, f));
  console.log(`${f}: ${stat.size} bytes`);
});
