const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/หน้าแรกตอนเข้าเว็บ.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const categories = [
  'ระบบอัตโนมัติและโรบอท',
  'อินเวอร์เตอร์และเซอร์โว',
  'PLC, HMI และคอนโทรล',
  'ระบบ IoT และเครื่องจักร',
  'การเกษตรและเทคโนโลยี',
  'ตู้ควบคุม & ตู้ MDB',
  'พลังงานแสงอาทิตย์',
  'อะไหล่และอุปกรณ์เสริม'
];

categories.forEach(cat => {
  const pos = svg.indexOf(cat);
  if (pos !== -1) {
    const chunk = svg.substring(Math.max(0, pos - 500), Math.min(svg.length, pos + 500));
    console.log(`=== CATEGORY: ${cat} ===`);
    const patterns = chunk.match(/url\(#([^)]+)\)/g);
    console.log('Patterns found nearby:', patterns);
    const rects = chunk.match(/<rect[^>]+>/g);
    console.log('Rects nearby:', rects ? rects.slice(0, 5) : 'none');
  }
});
