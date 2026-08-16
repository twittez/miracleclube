const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testDist() {
  console.log("Starting vite preview server on port 4173...");
  const previewProc = spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], {
    cwd: path.resolve('.'),
    shell: true
  });

  await new Promise(r => setTimeout(r, 2500));

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\preview_mobile_screenshot.png';

  const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:4173/"`;

  console.log("Taking screenshot of preview server...");
  try {
    execSync(cmd);
    console.log("Saved preview screenshot to:", outputPath);
  } catch (err) {
    console.error("Error taking preview screenshot:", err);
  } finally {
    previewProc.kill();
  }
}

testDist();
