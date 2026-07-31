const fs = require('fs');
const path = require('path');

async function parse() {
  const mod = require('pdf-parse');
  console.log('pdf-parse module keys:', Object.keys(mod));

  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  let data;
  if (typeof mod === 'function') {
    data = await mod(dataBuffer);
  } else if (mod.pdfParse) {
    data = await mod.pdfParse(dataBuffer);
  } else if (mod.PDFParse) {
    const parser = new mod.PDFParse();
    data = await parser.parse(dataBuffer);
  } else {
    console.log('Unknown module structure:', mod);
    return;
  }

  console.log('Total pages:', data.numpages || data.numpages || data.numPages);
  console.log('PDF text length:', (data.text || '').length);

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, data.text || JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved extracted text to ${outPath}`);
}

parse().catch(console.error);
