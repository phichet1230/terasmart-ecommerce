const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('Banners in public:', files.filter(f => f.includes('banner') || f.includes('hero') || f.includes('our_brands')));
