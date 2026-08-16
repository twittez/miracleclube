const { execSync } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const script = `
  const img = document.querySelector('.product-gallery__main-img');
  const viewport = document.querySelector('.product-gallery__main-viewport');
  const container = document.querySelector('.container');
  console.log(JSON.stringify({
    imgSrc: img ? img.src : null,
    imgNaturalWidth: img ? img.naturalWidth : 0,
    imgNaturalHeight: img ? img.naturalHeight : 0,
    imgClientWidth: img ? img.clientWidth : 0,
    imgClientHeight: img ? img.clientHeight : 0,
    imgComputedStyle: img ? {
      width: getComputedStyle(img).width,
      height: getComputedStyle(img).height,
      maxWidth: getComputedStyle(img).maxWidth,
      maxHeight: getComputedStyle(img).maxHeight,
      objectFit: getComputedStyle(img).objectFit,
      objectPosition: getComputedStyle(img).objectPosition,
      transform: getComputedStyle(img).transform
    } : null,
    viewportComputedStyle: viewport ? {
      width: getComputedStyle(viewport).width,
      height: getComputedStyle(viewport).height,
      aspectRatio: getComputedStyle(viewport).aspectRatio,
      overflow: getComputedStyle(viewport).overflow
    } : null
  }, null, 2));
`;

fs.writeFileSync('scratch/eval.js', script);

// Run node script with puppeteer-like evaluation via chrome headless or fetch
console.log("Evaluating DOM computed styles in Chrome...");
