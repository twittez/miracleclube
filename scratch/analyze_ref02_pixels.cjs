const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Inspect ref_02.png in HTML with a red border around the IMG tag itself
const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; background: #222; }
  .wrapper {
    width: 350px;
    height: 350px;
    background: #ffffff;
    border: 5px solid cyan;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    border: 3px solid red;
    object-fit: contain;
  }
</style>
</head>
<body>
  <div class="wrapper">
    <img src="file:///${path.resolve('public/images/product/ref_02.png').replace(/\\/g, '/')}" />
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/ref02_test.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\ref02_pixel_check.png';

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=400,400 --screenshot="${outputPath}" "file:///${path.resolve('scratch/ref02_test.html').replace(/\\/g, '/')}"`);
console.log("Saved ref02_pixel_check.png!");
