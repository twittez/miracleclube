const { spawn, execSync } = require('child_process');
const path = require('path');

console.log("Launching fresh Vite dev server on port 3005...");
const devProc = spawn('npx', ['vite', '--port', '3005'], {
  cwd: path.resolve('.'),
  shell: true
});

setTimeout(() => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\fresh_port_shot.png';
  const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:3005/"`;

  console.log("Taking screenshot of fresh server port 3005...");
  try {
    execSync(cmd);
    console.log("Saved screenshot to:", outputPath);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    devProc.kill();
  }
}, 3000);
