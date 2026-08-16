const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testAll10() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9666'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9666/json');
    const tabs = await listRes.json();
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Emulation.setDeviceMetricsOverride', params: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true } }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3001/' } }));
    });

    let step = 0;
    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.method === 'Page.loadEventFired') {
        // Evaluate and click thumbnails
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 600));

          // Click thumbnail i
          ws.send(JSON.stringify({
            id: 100 + i,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const thumbs = document.querySelectorAll('.product-gallery__mobile-thumb-btn');
                  if (thumbs[${i}]) { thumbs[${i}].click(); return true; }
                  return false;
                })()
              `
            }
          }));

          await new Promise(r => setTimeout(r, 400));

          // Capture screenshot
          const outPath = path.resolve(`scratch/gallery_img_${i + 1}.png`);
          ws.send(JSON.stringify({
            id: 200 + i,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }
      }

      if (msg.id && msg.id >= 200 && msg.id < 210) {
        const idx = msg.id - 200 + 1;
        const buf = Buffer.from(msg.result.data, 'base64');
        const savePath = `C:\\Users\\luanl\\.gemini\\antigravity\\brain\\6b67d4be-69d0-4a17-97cc-0a4fb66f39dd\\gallery_mobile_img_${idx}.png`;
        fs.writeFileSync(savePath, buf);
        console.log(`Saved screenshot for image ${idx} to: ${savePath}`);
        if (idx === 10) {
          ws.close();
          chromeProc.kill();
          process.exit(0);
        }
      }
    });

  } catch (err) {
    console.error(err);
    chromeProc.kill();
    process.exit(1);
  }
}

testAll10();
