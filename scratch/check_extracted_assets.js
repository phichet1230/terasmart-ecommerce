const fs = require('fs');
const path = require('path');

const extractedDir = path.join(__dirname, '../public/assets_extracted');
if (fs.existsSync(extractedDir)) {
  const files = fs.readdirSync(extractedDir);
  console.log('Extracted assets:', files);
} else {
  console.log('No assets_extracted dir found');
}
