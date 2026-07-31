const { PDFParse } = require('pdf-parse');
console.log('PDFParse prototype:', Object.getOwnPropertyNames(PDFParse.prototype));

// Let's also check if pdf-parse-debugging / pdf2json or pdfjs is available
try {
  const pdf2json = require('pdf2json');
  console.log('pdf2json available');
} catch (e) {
  console.log('pdf2json not installed');
}
