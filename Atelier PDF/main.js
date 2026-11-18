// Processus principal d'Atelier PDF : fenêtres, ouverture des fichiers passés par Windows, enregistrement.
const { app, BrowserWindow, ipcMain, dialog, Menu, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Test automatique : charge, affiche l'état, quitte. Jamais dans la version installée.
const SMOKE = !app.isPackaged && !!process.env.ATELIER_SMOKE;
// Les tests ont leur propre profil : ils tournent même si l'application installée est ouverte
if (SMOKE) app.setPath('userData', path.join(app.getPath('temp'), 'atelier-pdf-smoke'));
const savePaths = new Map();                  // webContents.id -> chemin choisi dans la boîte "Enregistrer"

const isPdf = f => typeof f === 'string' && /\.pdf$/i.test(f) && fs.existsSync(f);
const pdfArgs = (argv, cwd) => argv.slice(1).filter(a => !a.startsWith('-')).map(a => path.resolve(cwd, a)).filter(isPdf);

function sendFile(win, file) {
  try {
    win.webContents.send('open-file', { name: path.basename(file), dir: path.dirname(file), bytes: fs.readFileSync(file) });
  } catch (e) {
    dialog.showErrorBox('Atelier PDF', `Impossible d'ouvrir ${file}\n\n${e.message}`);
  }
}

function createWindow(file) {
  const win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 720, minHeight: 500, show: false,
    title: 'Atelier PDF', backgroundColor: '#e3e7e3', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.once('ready-to-show', () => { if (!SMOKE) { win.maximize(); win.show(); } });
  win.webContents.on('did-finish-load', () => {
    if (file) sendFile(win, file);
    if (SMOKE) setTimeout(async () => {
      if (process.env.ATELIER_SMOKE_JS) {   // script de test exécuté dans la page (voir scripts/test-redact.js)
        const guard = setTimeout(() => { console.log('SMOKE test : délai dépassé'); app.exit(2); }, 150000);
        try {
          const r = await win.webContents.executeJavaScript(fs.readFileSync(process.env.ATELIER_SMOKE_JS, 'utf8'));
          if (r && r.pdf && process.env.ATELIER_SMOKE_OUT) { fs.writeFileSync(process.env.ATELIER_SMOKE_OUT, Buffer.from(r.pdf, 'base64')); delete r.pdf; }
          console.log('SMOKE test', JSON.stringify(r, null, 1));
        } catch (e) { console.log('SMOKE test ERREUR', e.message); }
        clearTimeout(guard);
      }
      if (process.env.ATELIER_SMOKE_SHOT) fs.writeFileSync(process.env.ATELIER_SMOKE_SHOT, (await win.webContents.capturePage()).toPNG());
      const state = await win.webContents.executeJavaScript(
        `[document.querySelector('#stPage').textContent, 'pages=' + document.querySelectorAll('.page').length,
          'champs=' + document.querySelectorAll('.forms > *').length, 'desktop=' + !!window.desktop].join(' | ')`);
      console.log('SMOKE', state);
      win.close();   // ferme comme l'utilisateur, pour vérifier la fermeture
    }, 5000);
  });
  if (SMOKE) win.webContents.on('console-message', e => { if (e.level === 'warning' || e.level === 'error') console.log('[page]', e.message); });
  // Fermeture avec des modifications non enregistrées
  win.webContents.on('will-prevent-unload', e => {
    const r = dialog.showMessageBoxSync(win, {
      type: 'warning', title: 'Atelier PDF', buttons: ['Fermer sans enregistrer', 'Annuler'], defaultId: 1, cancelId: 1,
      message: 'Vos modifications ne sont pas enregistrées.', detail: 'Si vous fermez maintenant, elles seront perdues.',
    });
    if (r === 0) e.preventDefault();
  });
  const wcId = win.webContents.id;   // la fenêtre est détruite quand 'closed' arrive : on garde l'id avant
  win.on('closed', () => savePaths.delete(wcId));
  win.loadFile(path.join(__dirname, 'app', 'index.html'), SMOKE ? { hash: 'test' } : undefined);
  return win;
}

const SAVE_KINDS = { pdf: 'Document PDF', txt: 'Texte' };
ipcMain.handle('pick-save', async (e, { name, dir, ext = 'pdf' }) => {
  if (!SAVE_KINDS[ext]) throw new Error('Type de fichier non pris en charge');
  const win = BrowserWindow.fromWebContents(e.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: ext === 'pdf' ? 'Enregistrer le PDF' : 'Enregistrer', defaultPath: path.join(dir || app.getPath('documents'), path.basename(name)),
    filters: [{ name: SAVE_KINDS[ext], extensions: [ext] }],
  });
  if (canceled || !filePath) return null;
  savePaths.set(e.sender.id, filePath);
  return filePath;
});
// Dossier de sortie (diviser, exporter en images) : la page ne peut écrire que dedans, sous un simple nom de fichier
const outDirs = new Map();
ipcMain.handle('pick-dir', async (e, dir) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, { title: 'Choisir le dossier de destination', defaultPath: dir || app.getPath('documents'), properties: ['openDirectory', 'createDirectory'] });
  if (canceled || !filePaths[0]) return null;
  outDirs.set(e.sender.id, filePaths[0]);
  return filePaths[0];
});
const written = new Map();   // webContents.id -> fichiers créés dans le dossier choisi
ipcMain.handle('write-in-dir', async (e, name, bytes) => {
  const dir = outDirs.get(e.sender.id);
  if (!dir) throw new Error('Aucun dossier choisi');
  let safe = path.basename(String(name)).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+/, '');
  if (!/^[^.].*\.(pdf|png|jpg|txt)$/i.test(safe)) throw new Error('Type de fichier non autorisé');
  // Un fichier déjà présent qui ne vient pas de cette exportation n'est jamais écrasé : on ajoute un suffixe
  const mine = written.get(e.sender.id) || new Set(); written.set(e.sender.id, mine);
  for (let k = 2; fs.existsSync(path.join(dir, safe)) && !mine.has(safe); k++) safe = safe.replace(/( \(\d+\))?(\.\w+)$/, ` (${k})$2`);
  await fs.promises.writeFile(path.join(dir, safe), Buffer.from(bytes));
  mine.add(safe);
  return safe;
});
// Impression : une page HTML par image de page, à la taille réelle, puis la boîte d'impression de Windows.
// Les images passent par un dossier temporaire : une adresse data: de plus de 2 Mo est refusée par Chromium.
ipcMain.handle('print', async (e, pages) => {
  if (!Array.isArray(pages) || !pages.length || pages.length > 5000) throw new Error('Pages invalides');
  for (const p of pages) if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(String(p.src)) || !(+p.w > 0) || !(+p.h > 0)) throw new Error('Page invalide');
  const dir = await fs.promises.mkdtemp(path.join(app.getPath('temp'), 'atelier-print-'));
  const w = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
  try {
    const imgs = await Promise.all(pages.map(async (p, i) => {
      const [, type, b64] = String(p.src).match(/^data:image\/(jpeg|png);base64,(.+)$/);
      const file = `page-${i + 1}.${type === 'jpeg' ? 'jpg' : 'png'}`;
      await fs.promises.writeFile(path.join(dir, file), Buffer.from(b64, 'base64'));
      return `<img src="${file}" style="width:${+p.w}pt;height:${+p.h}pt">`;
    }));
    const html = `<!doctype html><meta charset="utf-8"><style>@page{margin:0}html,body{margin:0}img{display:block;page-break-after:always}img:last-child{page-break-after:auto}</style>` + imgs.join('');
    await fs.promises.writeFile(path.join(dir, 'impression.html'), html);
    await w.loadFile(path.join(dir, 'impression.html'));
    const landscape = pages[0] && +pages[0].w > +pages[0].h;
    await new Promise((ok, ko) => w.webContents.print({ silent: false, printBackground: true, landscape, margins: { marginType: 'none' } },
      (done, why) => done || why === 'cancelled' || why === 'Print job canceled' ? ok() : ko(new Error(why))));
  } finally { w.destroy(); fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {}); }
});
// Polices installées dans Windows, repérées par les noms de leur table « name » (lecture partielle, rapide).
// Sert à « Modifier texte » : la police intégrée à un PDF n'a souvent que les lettres déjà utilisées.
let fontIndex = null;
function readFontNames(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(12); fs.readSync(fd, head, 0, 12, 0);
    const tag = head.toString('latin1', 0, 4);
    if (tag !== '\0\x01\0\0' && tag !== 'OTTO' && tag !== 'true') return null;   // ni collection ni format web
    const n = head.readUInt16BE(4), dir = Buffer.alloc(16 * n); fs.readSync(fd, dir, 0, dir.length, 12);
    const tables = {};
    for (let i = 0; i < n; i++) tables[dir.toString('latin1', i * 16, i * 16 + 4)] = { off: dir.readUInt32BE(i * 16 + 8), len: dir.readUInt32BE(i * 16 + 12) };
    const t = tables.name; if (!t || t.len > 2e6) return null;
    const nb = Buffer.alloc(t.len); fs.readSync(fd, nb, 0, t.len, t.off);
    const count = nb.readUInt16BE(2), strOff = nb.readUInt16BE(4), names = {};
    for (let i = 0; i < count && 6 + i * 12 + 12 <= nb.length; i++) {
      const r = 6 + i * 12, pid = nb.readUInt16BE(r), lang = nb.readUInt16BE(r + 4), id = nb.readUInt16BE(r + 6), len = nb.readUInt16BE(r + 8), off = nb.readUInt16BE(r + 10);
      if (![1, 2, 6, 16, 17].includes(id)) continue;
      const s = nb.subarray(strOff + off, strOff + off + len);
      let txt = '';
      if (pid === 3 || pid === 0) for (let k = 0; k + 1 < s.length; k += 2) txt += String.fromCharCode(s.readUInt16BE(k));
      else if (pid === 1) txt = s.toString('latin1'); else continue;
      if (!(id in names) || (pid === 3 && lang === 0x409)) names[id] = txt;
    }
    let fsType = 0;
    if (tables['OS/2']) { const b = Buffer.alloc(10); fs.readSync(fd, b, 0, 10, tables['OS/2'].off); fsType = b.readUInt16BE(8); }
    // Licence « intégration restreinte » : la police ne doit pas être copiée dans un document
    return { file, ps: names[6] || '', family: names[16] || names[1] || '', style: names[17] || names[2] || '', restricted: (fsType & 0x000F) === 2 };
  } finally { fs.closeSync(fd); }
}
function fonts() {
  if (fontIndex) return fontIndex;
  fontIndex = [];
  const dirs = [path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts'), path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'Fonts')];
  for (const d of dirs) {
    let list = []; try { list = fs.readdirSync(d); } catch { continue; }
    for (const f of list) if (/\.(ttf|otf)$/i.test(f)) { try { const r = readFontNames(path.join(d, f)); if (r?.ps && !r.restricted) fontIndex.push(r); } catch {} }
  }
  return fontIndex;
}
const squash = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const isBold = s => /bold|black|heavy|semibold|demi/i.test(s), isItalic = s => /italic|oblique/i.test(s);
ipcMain.handle('find-font', async (_e, name) => {
  name = String(name || '').slice(0, 100);
  if (!/^[\w.+ ,-]+$/.test(name)) return null;
  const list = fonts(), want = squash(name);
  let hit = list.find(f => squash(f.ps) === want);
  if (!hit) {   // même famille et même style (ex. « Montserrat,Bold » ou « TimesNewRomanPS-BoldMT »)
    const [fam, sty = ''] = name.split(/[-,]/), wf = squash(fam.replace(/(PS)?MT$/, '')), b = isBold(sty), it = isItalic(sty);
    hit = list.find(f => (squash(f.family) === wf || squash(f.ps.split('-')[0]) === wf) && isBold(f.style) === b && isItalic(f.style) === it);
  }
  if (!hit) return null;
  return { ps: hit.ps, family: hit.family, bytes: await fs.promises.readFile(hit.file) };
});
// Lien cliqué dans un PDF (après confirmation dans la page) : navigateur ou messagerie de Windows
ipcMain.handle('open-url', async (_e, url) => {
  let u; try { u = new URL(String(url)); } catch { throw new Error('Adresse invalide'); }
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol)) throw new Error('Ce type de lien est refusé');
  await shell.openExternal(u.href);
});
ipcMain.handle('write-file', async (e, bytes) => {
  const target = savePaths.get(e.sender.id);
  if (!target) throw new Error('Aucun emplacement choisi');
  await fs.promises.writeFile(target, Buffer.from(bytes));
  return target;
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Un PDF ouvert alors que l'application tourne déjà : nouvelle fenêtre
  app.on('second-instance', (_e, argv, cwd) => {
    const files = pdfArgs(argv, cwd);
    if (files.length) return files.forEach(f => createWindow(f));
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); } else createWindow();
  });
  // Aucune fenêtre (même cachée) ne peut naviguer ailleurs, ouvrir une fenêtre ni intégrer une vue web
  app.on('web-contents-created', (_e, wc) => {
    wc.on('will-navigate', e => e.preventDefault());
    wc.on('will-redirect', e => e.preventDefault());
    wc.on('will-attach-webview', e => e.preventDefault());
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
  app.whenReady().then(() => {
    // Caméra, micro, notifications, géolocalisation… : l'application n'en a besoin d'aucune
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    Menu.setApplicationMenu(null);
    const files = pdfArgs(process.argv, process.cwd());
    if (files.length) files.forEach(f => createWindow(f)); else createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
