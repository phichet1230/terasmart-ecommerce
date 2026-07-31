const fs = require('fs');
const path = require('path');
const pdfjs = require('pdf-parse');

async function extractText() {
  const pdfPath = path.join(__dirname, '../public/company profile PDF (Ref.) - 2026Rev.01.pdf');
  const parser = new pdfjs.PDFParse({ url: pdfPath, verbosity: 0 });
  
  // Let's inspect parser methods
  console.log('PDFParse loaded PDF document page count:', parser);
  
  // Get document outline / TOC
  const outline = await parser.getOutline();
  console.log('Document Outline:', JSON.stringify(outline, null, 2));

  // Write outline to scratch file
  fs.writeFileSync(path.join(__dirname, 'pdf_outline.json'), JSON.stringify(outline, null, 2), 'utf8');
}

extractText().catch(console.error);
