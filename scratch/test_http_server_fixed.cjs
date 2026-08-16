const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join('dist', reqUrl === '/' ? 'index.html' : reqUrl);
  
  if (!fs.existsSync(filePath) && fs.existsSync(path.join('public', reqUrl))) {
    filePath = path.join('public', reqUrl);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(5556, () => {
  console.log("Static HTTP server running on http://localhost:5556");
  
  setTimeout(() => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\real_dist_mobile.png';
    const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outputPath}" "http://localhost:5556/"`;

    try {
      execSync(cmd);
      console.log("REAL DIST SCREENSHOT SAVED TO:", outputPath);
    } catch (err) {
      console.error("Error capturing screenshot:", err);
    } finally {
      server.close();
      process.exit(0);
    }
  }, 2500);
});
