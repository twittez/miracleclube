const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #111; padding: 20px; }
  .viewport {
    width: 358px;
    height: 358px;
    background: #ffffff;
    border: 3px solid red;
    overflow: hidden;
    position: relative;
  }
  .img-contain {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .img-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .img-native {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
</head>
<body>
  <h2 style="color:white">1. object-fit: contain (358x358)</h2>
  <div class="viewport">
    <img class="img-contain" src="file:///${path.resolve('public/images/product/ref_01.png').replace(/\\/g, '/')}" />
  </div>

  <h2 style="color:white; margin-top:20px;">2. object-fit: cover (358x358)</h2>
  <div class="viewport">
    <img class="img-cover" src="file:///${path.resolve('public/images/product/ref_01.png').replace(/\\/g, '/')}" />
  </div>

  <h2 style="color:white; margin-top:20px;">3. width: 100%, height: auto (358x358 viewport)</h2>
  <div class="viewport">
    <img class="img-native" src="file:///${path.resolve('public/images/product/ref_01.png').replace(/\\/g, '/')}" />
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_viewport.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\test_viewport_result.png';
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=420,1300 --screenshot="${outputPath}" "file:///${path.resolve('scratch/test_viewport.html').replace(/\\/g, '/')}"`);

console.log("Saved test viewport screenshot to:", outputPath);
