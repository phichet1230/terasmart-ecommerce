const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '../src/pages/Storefront.tsx');
const lines = fs.readFileSync(tsxPath, 'utf8').split('\n');

for (let i = 1325; i < 1340; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
