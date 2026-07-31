const fs = require('fs');
const path = require('path');

const userUploadedDir = 'C:\\Users\\WIN11\\.gemini\\antigravity\\brain\\75a80675-1b7e-4b9d-a255-983f79f6afed\\.user_uploaded';
const targetPublicDir = path.join(__dirname, '../public');

if (fs.existsSync(userUploadedDir)) {
  const files = fs.readdirSync(userUploadedDir);
  console.log('All files in user_uploaded:', files);
  
  files.forEach(f => {
    if (f.endsWith('.png') || f.endsWith('.jpg')) {
      const srcPath = path.join(userUploadedDir, f);
      const destPath = path.join(targetPublicDir, f);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${f} to public/`);
    }
  });

  // Specifically check for latest brand image and copy as our_brands_all.png
  const latestBrandFile = files[files.length - 1];
  if (latestBrandFile) {
    fs.copyFileSync(path.join(userUploadedDir, latestBrandFile), path.join(targetPublicDir, 'our_brands_all.png'));
    console.log(`Saved ${latestBrandFile} as public/our_brands_all.png`);
  }
}
