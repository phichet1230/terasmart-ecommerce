const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const imageTagRegex = /<image[^>]+>/g;
let match;
let i = 0;

while ((match = imageTagRegex.exec(svg)) !== null) {
  i++;
  const tag = match[0];
  const wMatch = tag.match(/width="([^"]+)"/);
  const hMatch = tag.match(/height="([^"]+)"/);
  const idMatch = tag.match(/id="([^"]+)"/);
  const hrefMatch = tag.match(/(?:href|xlink:href)="(data:image\/([^;]+);base64,([^"]+))"/);
  
  const w = wMatch ? wMatch[1] : '?';
  const h = hMatch ? hMatch[1] : '?';
  const id = idMatch ? idMatch[1] : 'none';
  const mime = hrefMatch ? hrefMatch[2] : '?';
  const base64Data = hrefMatch ? hrefMatch[3] : '';
  const sizeKb = (base64Data.length / 1024).toFixed(1);

  // Save each file with descriptive names if we can identify them by size or index
  const ext = mime === 'jpeg' ? 'jpg' : mime;
  const fileName = `asset_${i}_w${parseInt(w)}_h${parseInt(h)}.${ext}`;
  fs.writeFileSync(path.join(__dirname, '../public/assets_extracted', fileName), base64Data, 'base64');
  console.log(`#${i} [id=${id}]: width=${w}, height=${h}, size=${sizeKb}KB -> ${fileName}`);
}
