const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\dev_shot.png';
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:3001/"`;

console.log("Taking synchronous dev server screenshot...");
try {
  execSync(cmd);
  console.log("SUCCESS! Saved dev_shot.png");
} catch (err) {
  console.error("Error:", err);
}
