const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '../src/pages/Storefront.tsx');
let content = fs.readFileSync(tsxPath, 'utf8');

content = content.replace(/\\\${/g, '${');
fs.writeFileSync(tsxPath, content, 'utf8');
console.log('Fixed template literal escapes in Storefront.tsx!');
