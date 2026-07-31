const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.png') || f.endsWith('.svg'));
console.log('Public PNG/SVG files:', files);
