const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse();
  
  // Try loading buffer or path
  try {
    await parser.load(dataBuffer);
  } catch (e1) {
    console.log('load buffer failed:', e1.message);
    await parser.load({ url: pdfPath });
  }

  const info = await parser.getInfo();
  console.log('Info:', info);

  const text = await parser.getText();
  console.log('Text result type:', typeof text);
  console.log('Text length:', text ? text.length : 0);

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  const textContent = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
  fs.writeFileSync(outPath, textContent, 'utf8');
  console.log(`Saved text to ${outPath} (${textContent.length} bytes)`);
}

main().catch(console.error);
