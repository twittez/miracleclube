const fs = require('fs');
const path = require('path');

// Read PNG header dimensions
function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height, ratio: (width / height).toFixed(2) };
  }
  return null;
}

const dir = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\public\\images\\product';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

files.forEach(f => {
  const dims = getPngDimensions(path.join(dir, f));
  console.log(`${f}: ${dims ? `${dims.width}x${dims.height} (ratio ${dims.ratio})` : 'unknown'}`);
});
