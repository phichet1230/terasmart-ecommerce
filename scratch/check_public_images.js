const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('Images in public:', files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg')));
