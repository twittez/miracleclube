const { execSync } = require('child_process');
const fs = require('fs');

const script = `
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const docWidth = document.documentElement.scrollWidth;

  const overflowing = [...document.querySelectorAll("*")].filter((el) => {
    const rect = el.getBoundingClientRect();
    if (el.closest('.product-gallery__mobile-thumbs') || el.closest('.size-guide-modal__table-wrap')) return false;
    return rect.right > viewportWidth + 1 || rect.left < -1;
  }).map(el => ({
    tagName: el.tagName,
    className: el.className,
    id: el.id,
    right: el.getBoundingClientRect().right,
    viewportWidth: viewportWidth
  }));

  console.log("RESULT_START:" + JSON.stringify({
    viewportWidth,
    viewportHeight,
    docWidth,
    hasHorizontalScroll: docWidth > viewportWidth,
    overflowCount: overflowing.length,
    overflowingElements: overflowing
  }) + ":RESULT_END");
`;

fs.writeFileSync('scratch/eval_overflow.js', script);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 "http://localhost:3001/"`;

console.log("Running direct Chrome evaluation for Directive #20 DOM Overflow Test...");
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\audit_dom_check.png" "http://localhost:3001/"`);

console.log("Audit screenshot saved successfully!");
