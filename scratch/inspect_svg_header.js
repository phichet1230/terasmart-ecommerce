const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
if (fs.existsSync(svgPath)) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  console.log('SVG Header elements search:');
  const logoMatch = svg.match(/<image[^>]+>/g);
  if (logoMatch) {
    console.log(`Found ${logoMatch.length} image tags in SVG`);
    logoMatch.slice(0, 5).forEach((img, idx) => {
      console.log(`Image ${idx}:`, img.substring(0, 150));
    });
  }
} else {
  console.log('SVG file not found at path');
}
