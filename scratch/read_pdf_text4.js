const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function parse() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse();
  const pdfDoc = await parser.load(dataBuffer);
  console.log('Doc pages:', pdfDoc.numPages);
  
  let fullText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getText();
    fullText += `\n--- PAGE ${i} ---\n` + (textContent || '');
  }

  const outPath = path.join(__dirname, 'company_profile_extracted.md');
  fs.writeFileSync(outPath, fullText, 'utf8');
  console.log(`Saved extracted text to ${outPath} (${fullText.length} chars)`);
}

parse().catch(err => {
  console.error('Error:', err);
  // Try alternative constructor
  try {
    const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ verbosity: 0 });
    parser.load(dataBuffer).then(doc => {
      console.log('Loaded doc pages:', doc.numPages);
    });
  } catch (e2) {
    console.error('Alt error:', e2);
  }
});
