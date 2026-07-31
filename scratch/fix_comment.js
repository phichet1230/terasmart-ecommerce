const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '../src/pages/Storefront.tsx');
let content = fs.readFileSync(tsxPath, 'utf8');

content = content.replace('{/* INDUSTRIAL HERO BANNER SECTION (Matched 100% with Figma Image) *', '{/* INDUSTRIAL HERO BANNER SECTION (Matched 100% with Figma Image) */}');
fs.writeFileSync(tsxPath, content, 'utf8');
console.log('Fixed comment on line 1264!');
