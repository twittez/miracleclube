const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("1. Deleting dist folder...");
fs.rmSync('dist', { recursive: true, force: true });

console.log("2. Running vite build...");
execSync('npx vite build', { cwd: path.resolve('.') });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const distIndex = path.resolve('dist/index.html').replace(/\\/g, '/');
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\pure_dist_mobile.png';

console.log("3. Capturing headless screenshot directly from dist/index.html at 390x844...");
const cmd = `"${chromePath}" --headless=new --disable-gpu --allow-file-access-from-files --window-size=390,844 --screenshot="${outputPath}" "file:///${distIndex}"`;

try {
  execSync(cmd);
  console.log("SUCCESS! Screenshot saved to:", outputPath);
} catch (err) {
  console.error("Error capturing pure dist screenshot:", err);
}
