const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// List category files
const catFiles = [
  'cat_robot.png', 'cat_robot.svg',
  'cat_inverter.png', 'cat_inverter.svg',
  'cat_plc.png', 'cat_plc.svg',
  'cat_iot.png', 'cat_iot.svg',
  'cat_agri.png', 'cat_agri.svg',
  'cat_cabinet.png', 'cat_cabinet.svg',
  'cat_solar.png', 'cat_solar.svg',
  'cat_parts.png', 'cat_parts.svg',
  'cat_card_1.svg', 'cat_card_2.svg', 'cat_card_3.svg', 'cat_card_4.svg',
  'cat_card_5.svg', 'cat_card_6.svg', 'cat_card_7.svg', 'cat_card_8.svg'
];

catFiles.forEach(f => {
  const fp = path.join(publicDir, f);
  if (fs.existsSync(fp)) {
    const stat = fs.statSync(fp);
    console.log(`${f}: ${stat.size} bytes`);
  } else {
    console.log(`${f}: NOT FOUND`);
  }
});
