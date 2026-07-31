const fs = require('fs');
const path = require('path');

async function parse() {
  const pdfParse = require('pdf-parse');
  const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || require('pdf-parse/lib/pdf-parse.js');

  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  const data = await pdfFn(dataBuffer);
  console.log('Total pages:', data.numpages);
  console.log('PDF text length:', data.text.length);

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, data.text, 'utf8');
  console.log(`Saved extracted text to ${outPath}`);
}

parse().catch(console.error);
