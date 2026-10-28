// Génère build/icon.png et build/icon.ico (256 px) à partir du bouclier de l'interface.
// npm run icon
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a74ea"/><stop offset="1" stop-color="#2447b0"/></linearGradient></defs>
  <path d="M24 3 6 9.5V22c0 11.6 7.7 20.4 18 23 10.3-2.6 18-11.4 18-23V9.5L24 3Z" fill="url(#g)"/>
  <path d="m15.5 24 6 6 11-12" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ICO à une seule image PNG 256 px (format accepté par Windows et electron-builder)
function ico(png) {
  const h = Buffer.alloc(22);
  h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
  h.writeUInt8(0, 6); h.writeUInt8(0, 7);            // 0 = 256 px
  h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12);
  h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  return Buffer.concat([h, png]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 256, height: 256, show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
  win.webContents.setZoomFactor(1);
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
