const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testAllGalleryImagesMobile() {
  console.log("Building production dist bundle...");
  execSync('npm run build', { cwd: path.resolve('.') });

  console.log("Starting vite preview server on port 4174...");
  const previewProc = spawn('npx', ['vite', 'preview', '--port', '4174', '--host'], {
    cwd: path.resolve('.'),
    shell: true
  });

  await new Promise(r => setTimeout(r, 2500));

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // Take screenshot for image 1 (ref_02)
  const outPath1 = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\final_mobile_img1.png';
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPath1}" "http://localhost:4174/"`);
  console.log("Saved screenshot 1:", outPath1);

  previewProc.kill();
}

testAllGalleryImagesMobile().catch(console.error);
