const { spawn } = require('child_process');

async function testOverflow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9999'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://localhost:9999/json');
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
                    // Exclude intentional horizontal scroll containers (thumbnail ribbon and table wrapper)
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
                    overflowingElements: overflowing
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 1500);
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

testOverflow();
