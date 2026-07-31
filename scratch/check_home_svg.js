const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('Homepage SVG/PNG files in public:', files.filter(f => f.includes('หน้าแรก') || f.includes('home') || f.endsWith('.svg')));
