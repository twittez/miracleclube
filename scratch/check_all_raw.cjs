const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.resolve('public/images/product');
const files = fs.readdirSync(dir).filter(f => f.startsWith('ref_'));

let html = `<!DOCTYPE html><html><head><style>
body { background: #222; color: white; font-family: sans-serif; padding: 20px; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.card { background: #333; padding: 10px; border-radius: 8px; }
.box { width: 100%; aspect-ratio: 1; border: 3px solid #ff0055; background: #fff; }
img { width: 100%; height: 100%; object-fit: contain; }
</style></head><body><h1>All Raw Downloaded Reference Images</h1><div class="grid">`;

files.forEach(f => {
  const p = path.join(dir, f).replace(/\\/g, '/');
  html += `
    <div class="card">
      <h3>${f}</h3>
      <div class="box"><img src="file:///${p}" /></div>
    </div>
  `;
});

html += `</div></body></html>`;

fs.writeFileSync('scratch/all_raw.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\all_raw_grid.png';

console.log("Taking screenshot of all raw images grid...");
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=800,2400 --screenshot="${outputPath}" "file:///${path.resolve('scratch/all_raw.html').replace(/\\/g, '/')}"`);
console.log("Saved all_raw_grid.png!");
