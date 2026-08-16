const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchDir(full);
    } else if (full.endsWith('.css') || full.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('height') || line.includes('aspect-ratio') || line.includes('overflow') || line.includes('viewport')) {
          console.log(`${path.relative('.', full)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  });
}

searchDir('src');
