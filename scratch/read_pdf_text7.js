const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({ verbosity: 0 });
  
  await parser.load(dataBuffer);

  const info = await parser.getInfo();
  console.log('Info:', info);

  const textResult = await parser.getText();
  console.log('Text result keys/type:', typeof textResult, Object.keys(textResult || {}));

  let textString = '';
  if (typeof textResult === 'string') {
    textString = textResult;
  } else if (textResult && textResult.text) {
    textString = textResult.text;
  } else if (textResult && Array.isArray(textResult.pages)) {
    textString = textResult.pages.map((p, i) => `--- PAGE ${i+1} ---\n${p.text || ''}`).join('\n');
  } else {
    textString = JSON.stringify(textResult, null, 2);
  }

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, textString, 'utf8');
  console.log(`Saved text to ${outPath} (${textString.length} bytes)`);
}

main().catch(console.error);
