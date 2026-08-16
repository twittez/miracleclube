const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\mobile_final_verified.png';

// Force hard refresh in headless Chrome by passing clean URL
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:3001/?v=${Date.now()}"`;

console.log("Taking fresh mobile screenshot of http://localhost:3001/ at 390x844...");
try {
  execSync(cmd);
  console.log("Saved fresh mobile screenshot to:", outputPath);
} catch (err) {
  console.error("Error taking screenshot:", err);
}
