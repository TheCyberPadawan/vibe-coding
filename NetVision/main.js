// Processus principal de NetVision : lance le scan (lecture seule), enrichit les appareils, mémorise les connus.
// La page ne déclenche que « scanner » et « renommer/oublier un appareil » : aucune commande système ne vient d'elle.
const { app, BrowserWindow, ipcMain, Menu, Notification, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnPS } = require('./ps');
const { enrich } = require('./net');

const SMOKE = !app.isPackaged && !!process.env.NETVISION_SMOKE;
let win = null, scanning = false, meta = null;
const hosts = new Map();                 // clé (mac ou ip) -> appareil enrichi du dernier scan

const file = n => path.join(app.getPath('userData'), n);
const readJson = (n, d) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return d; } };
const writeJson = (n, v) => { try { fs.mkdirSync(app.getPath('userData'), { recursive: true }); fs.writeFileSync(file(n), JSON.stringify(v, null, 1)); } catch (e) { console.warn(e); } };
// Appareils déjà vus : clé MAC -> { label, firstSeen, lastSeen }
let known = readJson('devices.json', {});
const send = (ch, v) => { if (win && !win.isDestroyed()) win.webContents.send(ch, v); };
const keyOf = h => (h.mac || 'ip:' + h.ip);

function scan() {
  if (scanning) return;
  scanning = true; hosts.clear(); meta = null;
  send('scan-start', {});
  const found = [];
  const child = spawnPS(fs.readFileSync(path.join(__dirname, 'ps', 'scan.ps1'), 'utf8'), m => {
    if (m.t === 'meta') { meta = m; send('meta', m); }
    else if (m.t === 'progress') send('progress', m);
    else if (m.t === 'error') { send('scan-error', m.e); }
    else if (m.t === 'host') {
      const h = enrich(m.d, meta?.gateway);
      const k = keyOf(h);
      const rec = known[k] || (h.mac ? known[h.mac] : null);
      h.label = rec?.label || null;
      h.isNew = !rec;
      h.firstSeen = rec?.firstSeen || Date.now();
      hosts.set(k, h); found.push(h);
      send('host', h);
    }
    else if (m.t === 'done') finishScan(found);
  });
  child.on('close', () => { if (scanning) finishScan(found); });   // sécurité si « done » n'arrive pas
}

function finishScan(found) {
  if (!scanning) return;
  scanning = false;
  const now = Date.now(), newOnes = [];
  for (const h of found) {
    const k = keyOf(h);
    if (!known[k]) { known[k] = { firstSeen: h.firstSeen, label: null }; if (h.mac) newOnes.push(h); }
    known[k].lastSeen = now;
  }
  writeJson('devices.json', known);
  send('scan-done', { count: found.length });
  // Alerte si de nouveaux appareils sont apparus (hors tout premier scan de l'application)
  if (newOnes.length && hadKnownBefore && Notification.isSupported()) {
    const n = newOnes[0];
    new Notification({ title: newOnes.length > 1 ? `${newOnes.length} nouveaux appareils sur le réseau` : 'Nouvel appareil sur le réseau',
      body: newOnes.map(x => x.label || x.name || x.vendor || x.ip).slice(0, 3).join(', '), silent: false }).show();
  }
  hadKnownBefore = true;
}
let hadKnownBefore = Object.keys(known).length > 0;

ipcMain.handle('scan', () => { scan(); });
ipcMain.handle('snapshot', () => ({ meta, hosts: [...hosts.values()], scanning }));
ipcMain.handle('rename', (_e, key, label) => {
  if (typeof key !== 'string' || key.length > 128) return;
  label = typeof label === 'string' ? label.trim().slice(0, 60) : '';
  if (!known[key]) known[key] = { firstSeen: Date.now() };
  known[key].label = label || null;
  writeJson('devices.json', known);
  const h = hosts.get(key); if (h) { h.label = label || null; send('host', h); }
  return { ok: true };
});
ipcMain.handle('forget', (_e, key) => {
  if (typeof key === 'string' && known[key]) { delete known[key]; writeJson('devices.json', known); }
  return { ok: true };
});
ipcMain.handle('open-host', (_e, key, scheme) => {
  const h = hosts.get(String(key));
  if (!h) return;
  const ok = { http: 80, https: 443 };
  if (!(scheme in ok)) return;
  if (!(h.ports || []).includes(ok[scheme]) && !(scheme === 'https' && (h.ports || []).includes(8443))) return;
  shell.openExternal(`${scheme}://${h.ip}/`);   // ouvre l'interface web de l'appareil dans le navigateur
});

function createWindow() {
  const ico = path.join(__dirname, 'build', 'icon.png');
  win = new BrowserWindow({
    width: 1340, height: 880, minWidth: 940, minHeight: 600, show: false, title: 'NetVision', backgroundColor: '#0d1117', autoHideMenuBar: true,
    icon: fs.existsSync(ico) ? ico : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.once('ready-to-show', () => { win.show(); if (!SMOKE) win.maximize(); });
  if (SMOKE) {
    win.webContents.on('console-message', e => { if (e.level === 'warning' || e.level === 'error') console.log('[page]', e.message); });
    win.webContents.on('did-finish-load', async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 60000 && scanning === false && !meta) await new Promise(r => setTimeout(r, 300));
      while (Date.now() - t0 < 60000 && scanning) await new Promise(r => setTimeout(r, 300));
      await new Promise(r => setTimeout(r, 1500));   // laisse la page afficher l'état final avant la capture
      console.log(`SMOKE meta=${JSON.stringify(meta)} appareils=${hosts.size}`);
      for (const h of hosts.values()) console.log(`  ${h.ip.padEnd(15)} ${(h.mac || '').padEnd(18)} ${(h.type || '').padEnd(24)} ${h.vendor || ''} [${(h.ports || []).join(',')}]`);
      console.log('SMOKE page', await win.webContents.executeJavaScript(`document.querySelectorAll('.node').length + ' noeuds carte | ' + (document.querySelector('#summary')?.textContent||'')`));
      if (process.env.NETVISION_SHOT) fs.writeFileSync(process.env.NETVISION_SHOT, (await win.webContents.capturePage()).toPNG());
      app.quit();
    });
  }
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.on('web-contents-created', (_e, wc) => {
    wc.on('will-navigate', e => e.preventDefault());
    wc.on('will-redirect', e => e.preventDefault());
    wc.on('will-attach-webview', e => e.preventDefault());
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    Menu.setApplicationMenu(null);
    app.setAppUserModelId('fr.netvision.app');
    createWindow();
    scan();
  });
  app.on('window-all-closed', () => app.quit());
}
