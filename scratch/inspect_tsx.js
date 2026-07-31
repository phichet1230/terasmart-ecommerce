const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '../src/pages/Storefront.tsx');
const content = fs.readFileSync(tsxPath, 'utf8');
const lines = content.split('\n');

console.log('Lines 1320-1360:');
lines.slice(1320, 1360).forEach((l, i) => {
  console.log(`${1321 + i}: ${l}`);
});
