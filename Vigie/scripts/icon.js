// Génère build/icon.png et build/icon.ico (256 px) : bouclier et viseur de Vigie.
// npm run icon
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="256" height="256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d8bff"/><stop offset="1" stop-color="#1b4fb8"/></linearGradient></defs>
  <path d="M24 3 6 9.5V22c0 11.6 7.7 20.4 18 23 10.3-2.6 18-11.4 18-23V9.5L24 3Z" fill="url(#g)"/>
  <circle cx="24" cy="23" r="8" fill="none" stroke="#fff" stroke-width="3"/>
  <circle cx="24" cy="23" r="2.6" fill="#fff"/>
  <path d="M24 9v6M24 31v7M11 23h6M31 23h6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
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
