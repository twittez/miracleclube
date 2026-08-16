const { spawn } = require('child_process');

function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9555'
  ]);

  setTimeout(async () => {
    try {
      const listRes = await fetch('http://localhost:9555/json');
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
                    const vp = document.querySelector('.product-gallery__main-viewport');
                    const img = document.querySelector('.product-gallery__main-img');
                    const grid = document.querySelector('.product-main-section__grid');
                    const col = document.querySelector('.product-main-section__gallery-col');
                    return {
                      vpRect: vp ? vp.getBoundingClientRect() : null,
                      imgRect: img ? img.getBoundingClientRect() : null,
                      gridRect: grid ? grid.getBoundingClientRect() : null,
                      colRect: col ? col.getBoundingClientRect() : null,
                      vpCssHeight: vp ? getComputedStyle(vp).height : null,
                      vpCssWidth: vp ? getComputedStyle(vp).width : null,
                      imgCssHeight: img ? getComputedStyle(img).height : null,
                      imgCssWidth: img ? getComputedStyle(img).width : null,
                      imgCssObjectFit: img ? getComputedStyle(img).objectFit : null,
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 1000);
        }

        if (msg.id === 10) {
          console.log("=== EXACT COMPUTED BOX SIZES ===");
          console.log(JSON.stringify(msg.result.result.value, null, 2));
          ws.close();
          chromeProc.kill();
          process.exit(0);
        }
      });
    } catch (e) {
      console.error(e);
      chromeProc.kill();
      process.exit(1);
    }
  }, 1000);
}

run();
