const { spawn } = require('child_process');

function check() {
  return new Promise((resolve, reject) => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chromeProc = spawn(chromePath, [
      '--headless=new',
      '--remote-debugging-port=9226',
      '--window-size=390,844'
    ]);

    setTimeout(async () => {
      try {
        const listRes = await fetch('http://localhost:9226/json');
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
                      const thumbImg = document.querySelector('.product-gallery__mobile-thumb-btn img');
                      return {
                        imgSrc: img ? img.currentSrc : null,
                        imgNaturalWidth: img ? img.naturalWidth : 0,
                        imgNaturalHeight: img ? img.naturalHeight : 0,
                        imgClientWidth: img ? img.clientWidth : 0,
                        imgClientHeight: img ? img.clientHeight : 0,
                        imgStyles: img ? {
                          width: getComputedStyle(img).width,
                          height: getComputedStyle(img).height,
                          maxWidth: getComputedStyle(img).maxWidth,
                          maxHeight: getComputedStyle(img).maxHeight,
                          objectFit: getComputedStyle(img).objectFit,
                        } : null,
                        viewportStyles: viewport ? {
                          width: getComputedStyle(viewport).width,
                          height: getComputedStyle(viewport).height,
                          aspectRatio: getComputedStyle(viewport).aspectRatio,
                          overflow: getComputedStyle(viewport).overflow
                        } : null,
                        thumbSrc: thumbImg ? thumbImg.currentSrc : null
                      };
                    })()
                  `,
                  returnByValue: true
                }
              }));
            }, 1200);
          }

          if (msg.id === 10) {
            console.log("=== DOM EVALUATION SUCCESS ===");
            console.log(JSON.stringify(msg.result.result.value, null, 2));
            ws.close();
            chromeProc.kill();
            resolve();
          }
        });
      } catch (err) {
        chromeProc.kill();
        reject(err);
      }
    }, 1500);
  });
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
