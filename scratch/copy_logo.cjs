const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\.user_uploaded\\media_1786839904643.png';
const destDir = 'C:\\Users\\luanl\\.gemini\antigravity\\scratch\\body-shapewear-lp\\public\\images';
const dest = path.join(destDir, 'logo.png');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Logo copied successfully from', src, 'to', dest);
