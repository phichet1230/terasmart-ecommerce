const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const logoFiles = ['header_logo.png', 'tera_footer_logo.png', 'tera_logo_red_badge.png', 'tera_banner_logo.png'];

logoFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`${file}: ${stats.size} bytes`);
  }
});
