const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('TERA files:', files.filter(f => f.toLowerCase().includes('tera')));
