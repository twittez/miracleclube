const { spawn } = require('child_process');

function debug() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--window-size=390,844'
  ]);

  setTimeout(async () => {
    try {
      const listRes = await fetch('http://localhost:9333/json');
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
                    const vp = document.querySelector('.product-gallery__main-viewport');
                    if (!img || !vp) return "NOT FOUND";
                    const iRect = img.getBoundingClientRect();
                    const vRect = vp.getBoundingClientRect();
                    const cs = getComputedStyle(img);
                    const vcs = getComputedStyle(vp);
                    return {
                      vpWidth: vRect.width,
                      vpHeight: vRect.height,
                      vpLeft: vRect.left,
                      imgWidth: iRect.width,
                      imgHeight: iRect.height,
                      imgLeft: iRect.left,
                      imgNaturalWidth: img.naturalWidth,
                      imgNaturalHeight: img.naturalHeight,
                      imgObjectFit: cs.objectFit,
                      imgWidthStyle: cs.width,
                      imgHeightStyle: cs.height,
                      vpAspectRatio: vcs.aspectRatio
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 1500);
        }

        if (msg.id === 10) {
          console.log("=== EXACT COMPUTED GEOMETRY ===");
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

debug();
