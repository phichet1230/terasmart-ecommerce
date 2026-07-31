const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Copy extracted_img_32.png to 36 + 41 as social icons
fs.copyFileSync(path.join(publicDir, 'extracted_img_32.png'), path.join(publicDir, 'social_fb.png'));
fs.copyFileSync(path.join(publicDir, 'extracted_img_33.png'), path.join(publicDir, 'social_line.png'));
fs.copyFileSync(path.join(publicDir, 'extracted_img_34.png'), path.join(publicDir, 'social_tiktok.png'));
fs.copyFileSync(path.join(publicDir, 'extracted_img_35.png'), path.join(publicDir, 'social_yt.png'));
fs.copyFileSync(path.join(publicDir, 'extracted_img_36.png'), path.join(publicDir, 'social_shopee.png'));
fs.copyFileSync(path.join(publicDir, 'extracted_img_41.png'), path.join(publicDir, 'social_lazada.png'));

console.log('Copied social_*.png icons!');
