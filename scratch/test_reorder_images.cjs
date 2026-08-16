const fs = require('fs');

const productTsPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\src\\data\\product.ts';
let content = fs.readFileSync(productTsPath, 'utf-8');

// Swap ref_01 and ref_02 so clean product photo is first
content = content.replace(
  '"/images/product/ref_01.png",\n    "/images/product/ref_02.png",',
  '"/images/product/ref_02.png",\n    "/images/product/ref_01.png",'
);

fs.writeFileSync(productTsPath, content);
console.log("Updated product.ts: ref_02.png (clean front photo) is now main image 1!");
