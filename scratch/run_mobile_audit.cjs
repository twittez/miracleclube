const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd';

const devices = [
  { name: 'android_360x800', width: 360, height: 800 },
  { name: 'iphone_375x812', width: 375, height: 812 },
  { name: 'iphone_390x844', width: 390, height: 844 },
  { name: 'iphone_393x852', width: 393, height: 852 },
  { name: 'android_412x915', width: 412, height: 915 },
  { name: 'iphone_414x896', width: 414, height: 896 },
  { name: 'iphone_430x932', width: 430, height: 932 },
];

async function audit() {
  console.log("=== STARTING FULL MOBILE RESPONSIVENESS & OVERFLOW AUDIT ===");

  // Ensure dev server is ready
  console.log("Checking dev server http://localhost:3001/ ...");
  
  for (const dev of devices) {
    const screenshotPath = path.join(artifactsDir, `audit_${dev.name}.png`);
    const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=${dev.width},${dev.height} --screenshot="${screenshotPath}" "http://localhost:3001/?res=${dev.name}"`;
    
    try {
      execSync(cmd);
      console.log(`[PASS] Captured screenshot for ${dev.name} (${dev.width}x${dev.height}): ${screenshotPath}`);
    } catch (err) {
      console.error(`[FAIL] Screenshot error for ${dev.name}:`, err);
    }
  }

  // Programmatic DOM Overflow Inspector via CDP
  console.log("\nExecuting Programmatic DOM Overflow Test (Directive #20)...");
  
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9888'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9888/json');
    const tabs = await listRes.json();
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Emulation.setDeviceMetricsOverride', params: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true } }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3001/' } }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.method === 'Page.loadEventFired') {
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const viewportWidth = document.documentElement.clientWidth;
                  const viewportHeight = document.documentElement.clientHeight;
                  const docWidth = document.documentElement.scrollWidth;

                  const overflowing = [...document.querySelectorAll("*")].filter((el) => {
                    const rect = el.getBoundingClientRect();
                    // Ignore elements meant to overflow inside horizontal scroll containers
                    if (el.closest('.product-gallery__mobile-thumbs') || el.closest('.size-guide-modal__table-wrap')) return false;
                    return rect.right > viewportWidth + 1 || rect.left < -1;
                  }).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id,
                    rectRight: el.getBoundingClientRect().right,
                    viewportWidth: viewportWidth
                  }));

                  return {
                    viewportWidth,
                    viewportHeight,
                    docWidth,
                    hasHorizontalScroll: docWidth > viewportWidth,
                    overflowCount: overflowing.length,
                    overflowingElements: overflowing.slice(0, 10)
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 1200);
      }

      if (msg.id === 10) {
        console.log("\n================ OVERFLOW AUDIT RESULT ================");
        console.log(JSON.stringify(msg.result.result.value, null, 2));
        console.log("=======================================================\n");
        ws.close();
        chromeProc.kill();
        process.exit(0);
      }
    });

  } catch (err) {
    console.error("CDP Audit Error:", err);
    chromeProc.kill();
    process.exit(1);
  }
}

audit();
