const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir);

console.log('TikTok files in public:', files.filter(f => f.toLowerCase().includes('tiktok')));
