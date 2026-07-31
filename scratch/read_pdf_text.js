const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  console.log('Total pages:', data.numpages);
  console.log('PDF info:', data.info);
  console.log('PDF text length:', data.text.length);

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, data.text, 'utf8');
  console.log(`Saved extracted text to ${outPath}`);
}).catch(function(error) {
  console.error('Error parsing PDF:', error);
});
