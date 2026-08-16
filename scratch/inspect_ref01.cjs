const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgPath = path.resolve('public/images/product/ref_01.png');
console.log("Checking ref_01.png file size:", fs.statSync(imgPath).size);

const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; background: #333; }
  .box { width: 350px; height: 350px; border: 4px solid red; background: yellow; overflow: hidden; }
  img { width: 100%; height: 100%; object-fit: contain; }
</style>
</head>
<body>
  <div class="box">
    <img src="file:///${imgPath.replace(/\\/g, '/')}" />
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_img.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\ref01_raw.png';
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=400,400 --screenshot="${outputPath}" "file:///${path.resolve('scratch/test_img.html').replace(/\\/g, '/')}"`);

console.log("Saved raw image test screenshot to:", outputPath);
