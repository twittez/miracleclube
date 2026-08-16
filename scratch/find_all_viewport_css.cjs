const fs = require('fs');
const path = require('path');

function searchAllFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') return;
    if (fs.statSync(full).isDirectory()) {
      searchAllFiles(full);
    } else if (f.endsWith('.css') || f.endsWith('.tsx') || f.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes('product-gallery__main-viewport')) {
        console.log(`FOUND IN FILE: ${full}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('product-gallery__main-viewport')) {
            console.log(`  Line ${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  });
}

searchAllFiles('.');
