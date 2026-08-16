const { spawn } = require('child_process');

async function debugDOM() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=390,844'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9224/json');
    const tabs = await listRes.json();
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url: 'http://localhost:3001/' } }));
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
                  const img = document.querySelector('.product-gallery__main-img');
                  const viewport = document.querySelector('.product-gallery__main-viewport');
                  return {
                    imgSrc: img ? img.src : null,
                    imgNaturalWidth: img ? img.naturalWidth : 0,
                    imgNaturalHeight: img ? img.naturalHeight : 0,
                    imgClientWidth: img ? img.clientWidth : 0,
                    imgClientHeight: img ? img.clientHeight : 0,
                    imgComputedWidth: img ? getComputedStyle(img).width : null,
                    imgComputedHeight: img ? getComputedStyle(img).height : null,
                    imgObjectFit: img ? getComputedStyle(img).objectFit : null,
                    viewportWidth: viewport ? getComputedStyle(viewport).width : null,
                    viewportHeight: viewport ? getComputedStyle(viewport).height : null,
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 1000);
      }

      if (msg.id === 10) {
        console.log("=== DOM EVALUATION SUCCESS ===");
        console.log(JSON.stringify(msg.result.result.value, null, 2));
        ws.close();
        chromeProc.kill();
      }
    });

  } catch (err) {
    console.error("CDP Error:", err);
    chromeProc.kill();
  }
}

debugDOM();
