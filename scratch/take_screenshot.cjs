const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\mobile_test.png';

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:3001/"`;

console.log("Taking screenshot of http://localhost:3001/ at 390x844...");
try {
  execSync(cmd);
  console.log("Screenshot saved to:", outputPath);
  console.log("File exists:", fs.existsSync(outputPath));
} catch (err) {
  console.error("Error running headless Chrome:", err);
}
