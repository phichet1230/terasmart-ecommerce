const fs = require('fs');
const path = require('path');

const userUploadedDir = path.join(__dirname, '../.user_uploaded');
if (fs.existsSync(userUploadedDir)) {
  console.log('Files in .user_uploaded:', fs.readdirSync(userUploadedDir));
}

const artifactsDir = 'C:\\Users\\WIN11\\.gemini\\antigravity\\brain\\75a80675-1b7e-4b9d-a255-983f79f6afed';
if (fs.existsSync(artifactsDir)) {
  const files = fs.readdirSync(artifactsDir).filter(f => f.includes('178468') || f.endsWith('.png'));
  console.log('Recent image files in brain artifacts:', files.slice(-10));
}
