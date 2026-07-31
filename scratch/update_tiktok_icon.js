const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const srcSvg = path.join(publicDir, 'tiktok-logo-2--1.svg');

if (fs.existsSync(srcSvg)) {
  fs.copyFileSync(srcSvg, path.join(publicDir, 'social_tiktok.svg'));
  console.log('Successfully copied tiktok-logo-2--1.svg to social_tiktok.svg');
} else {
  console.log('tiktok-logo-2--1.svg NOT found!');
}
