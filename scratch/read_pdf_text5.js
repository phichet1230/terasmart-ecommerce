const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function parse() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  const instance = new PDFParse({ verbosity: 0 });
  const result = await instance.extractText({ data: dataBuffer });
  console.log('Extracted text result:', result);

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, result.text || JSON.stringify(result, null, 2), 'utf8');
}

parse().catch(async (err) => {
  console.log('Primary method failed, trying url method...');
  try {
    const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
    const instance = new PDFParse({ url: pdfPath, verbosity: 0 });
    const result = await instance.extractText();
    console.log('Result length:', (result.text || '').length);
    fs.writeFileSync(path.join(__dirname, 'company_profile_extracted.md'), result.text || '', 'utf8');
  } catch (e2) {
    console.error('URL method error:', e2);
  }
});
