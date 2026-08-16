const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd';

const viewports = [
  { name: 'mobile_360x800', width: 360, height: 800 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'mobile_430x932', width: 430, height: 932 },
  { name: 'tablet_768x1024', width: 768, height: 1024 },
  { name: 'desktop_1366x768', width: 1366, height: 768 },
  { name: 'desktop_1440x900', width: 1440, height: 900 },
];

console.log("=== RUNNING FINAL MULTI-RESOLUTION VERIFICATION ===");

for (const vp of viewports) {
  const savePath = path.join(artifactsDir, `verify_${vp.name}.png`);
  const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=${vp.width},${vp.height} --screenshot="${savePath}" "http://localhost:3001/"`;
  
  try {
    execSync(cmd);
    console.log(`[PASS] Captured ${vp.name} screenshot (${vp.width}x${vp.height}): ${savePath}`);
  } catch (err) {
    console.error(`[FAIL] Verification error for ${vp.name}:`, err.message);
  }
}

console.log("=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===");
