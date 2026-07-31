const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const imgDir = path.join(publicDir, 'ecommerce-project_images');

fs.copyFileSync(path.join(imgDir, 'image 171.svg'), path.join(publicDir, 'cat_card_1.svg'));
fs.copyFileSync(path.join(imgDir, 'image 170.svg'), path.join(publicDir, 'cat_card_2.svg'));
fs.copyFileSync(path.join(imgDir, 'image 175.svg'), path.join(publicDir, 'cat_card_3.svg'));
fs.copyFileSync(path.join(imgDir, 'image 176.svg'), path.join(publicDir, 'cat_card_4.svg'));
fs.copyFileSync(path.join(imgDir, 'image 173.svg'), path.join(publicDir, 'cat_card_5.svg'));
fs.copyFileSync(path.join(imgDir, 'image 174.svg'), path.join(publicDir, 'cat_card_6.svg'));
fs.copyFileSync(path.join(imgDir, 'image 177.svg'), path.join(publicDir, 'cat_card_7.svg'));
fs.copyFileSync(path.join(imgDir, 'image 172.svg'), path.join(publicDir, 'cat_card_8.svg'));

console.log('Copied cat_card_1.svg to cat_card_8.svg successfully!');
