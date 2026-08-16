const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\public\\images\\product';
const files = fs.readdirSync(dir);

console.log("Image files in public/images/product:");
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});
