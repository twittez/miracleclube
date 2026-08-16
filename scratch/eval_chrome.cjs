const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    'http://localhost:3001/'
  ]);

  // Wait 2 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const tabs = await listRes.json();
    const wsUrl = tabs[0].webSocketDebuggerUrl;
    console.log("Connected to Chrome WS:", wsUrl);

    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              const img = document.querySelector('.product-gallery__main-img');
              const viewport = document.querySelector('.product-gallery__main-viewport');
              return {
                imgSrc: img ? img.src : null,
                imgNaturalWidth: img ? img.naturalWidth : 0,
                imgNaturalHeight: img ? img.naturalHeight : 0,
                imgClientWidth: img ? img.clientWidth : 0,
                imgClientHeight: img ? img.clientHeight : 0,
                imgStyleWidth: img ? getComputedStyle(img).width : null,
                imgStyleHeight: img ? getComputedStyle(img).height : null,
                imgObjectFit: img ? getComputedStyle(img).objectFit : null,
                viewportWidth: viewport ? getComputedStyle(viewport).width : null,
                viewportHeight: viewport ? getComputedStyle(viewport).height : null,
              };
            })()
          `,
          returnByValue: true
        }
      }));
    });

    ws.on('message', (data) => {
      const res = JSON.parse(data.toString());
      if (res.id === 1) {
        console.log("DOM EVALUATION RESULT:");
        console.log(JSON.stringify(res.result.result.value, null, 2));
        ws.close();
        chromeProc.kill();
      }
    });

  } catch (err) {
    console.error(err);
    chromeProc.kill();
  }
}

run();
