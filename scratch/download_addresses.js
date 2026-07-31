const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';
  const destPath = path.join(__dirname, '../public/thailand_addresses.json');

  console.log('Downloading Thailand Address database from GitHub...');
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    const data = await res.json();
    
    // Save to public directory
    fs.writeFileSync(destPath, JSON.stringify(data, null, 2));
    console.log(`Successfully saved Thailand address database to: ${destPath}`);
  } catch (err) {
    console.error('Failed to download database:', err);
  }
}

download();
