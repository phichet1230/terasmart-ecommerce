const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const imgPath = path.join(publicDir, 'extracted_img_4.png');

if (fs.existsSync(imgPath)) {
  const stats = fs.statSync(imgPath);
  console.log(`extracted_img_4.png exists! Size: ${stats.size} bytes`);
} else {
  console.log('extracted_img_4.png NOT found!');
}
