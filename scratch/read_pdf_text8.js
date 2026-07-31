const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');

  const parser = new PDFParse({ url: pdfPath, verbosity: 0 });
  await parser.load();

  const info = await parser.getInfo();
  console.log('Info:', info);

  const textResult = await parser.getText();
  console.log('Text result type:', typeof textResult);

  let textString = '';
  if (typeof textResult === 'string') {
    textString = textResult;
  } else if (textResult && textResult.text) {
    textString = textResult.text;
  } else {
    textString = JSON.stringify(textResult, null, 2);
  }

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, textString, 'utf8');
  console.log(`Saved text to ${outPath} (${textString.length} bytes)`);
}

main().catch(console.error);
