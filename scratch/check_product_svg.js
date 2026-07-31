const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('Public files matching สินค้า:', files.filter(f => f.includes('สินค้า') || f.includes('product')));
