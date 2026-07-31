const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractFullText() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const parser = new PDFParse({ url: pdfPath, verbosity: 0 });
  await parser.load();

  console.log('Total pages in PDF:', parser.doc.numPages);
  
  let fullText = '';
  for (let i = 1; i <= parser.doc.numPages; i++) {
    try {
      const pageText = await parser.getPageText(i);
      const text = typeof pageText === 'string' ? pageText : (pageText.text || JSON.stringify(pageText));
      fullText += `\n==================== PAGE ${i} ====================\n` + text;
    } catch (e) {
      console.log(`Error on page ${i}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'company_profile_pages.md');
  fs.writeFileSync(outPath, fullText, 'utf8');
  console.log(`Saved page text to ${outPath} (${fullText.length} bytes)`);
}

extractFullText().catch(console.error);
