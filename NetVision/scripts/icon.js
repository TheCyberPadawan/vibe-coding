// Génère build/icon.png et build/icon.ico (256 px) : radar/réseau de NetVision.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58a6ff"/><stop offset="1" stop-color="#1f5fd0"/></linearGradient></defs>
  <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#g)"/>
  <circle cx="24" cy="24" r="5" fill="#fff"/>
  <circle cx="24" cy="24" r="11" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.85"/>
  <circle cx="24" cy="24" r="17" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.5"/>
  <circle cx="39" cy="24" r="3.2" fill="#fff"/>
  <circle cx="14" cy="36" r="3.2" fill="#fff"/>
  <circle cx="12" cy="13" r="3.2" fill="#fff"/>
</svg>`;

function ico(png) {
  const h = Buffer.alloc(22);
  h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
  h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12);
  h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  return Buffer.concat([h, png]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 256, height: 256, show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true, javascript: false } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<body style="margin:0;background:transparent;overflow:hidden">${SVG}</body>`));
  await new Promise(r => setTimeout(r, 400));
  const png = (await win.webContents.capturePage()).resize({ width: 256, height: 256 }).toPNG();
  const dir = path.join(__dirname, '..', 'build');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'icon.png'), png);
  fs.writeFileSync(path.join(dir, 'icon.ico'), ico(png));
  console.log('icône écrite dans', dir);
  app.quit();
});
