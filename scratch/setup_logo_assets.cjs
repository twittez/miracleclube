const fs = require('fs');
const path = require('path');

const userUploadedDir = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\.user_uploaded';
const targetDir = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\public\\images';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Logo 1 (Pink mark)
const logo1 = path.join(userUploadedDir, 'media_1786839904643.png');
if (fs.existsSync(logo1)) {
  fs.copyFileSync(logo1, path.join(targetDir, 'logo.png'));
  console.log('Copied logo.png to public/images/logo.png');
}

// Logo 2 (White body on magenta square background)
const logo2 = path.join(userUploadedDir, 'media_1786841027834.jpg');
if (fs.existsSync(logo2)) {
  fs.copyFileSync(logo2, path.join(targetDir, 'logo-footer.jpg'));
  console.log('Copied logo-footer.jpg to public/images/logo-footer.jpg');
}

// Favicon
fs.copyFileSync(path.join(targetDir, 'logo.png'), path.join('C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\public', 'favicon.png'));
console.log('Copied favicon.png to public/favicon.png');
