// Processus principal d'Atelier PDF : fenêtres, ouverture des fichiers passés par Windows, enregistrement.
const { app, BrowserWindow, ipcMain, dialog, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Test automatique : charge, affiche l'état, quitte. Jamais dans la version installée.
const SMOKE = !app.isPackaged && !!process.env.ATELIER_SMOKE;
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
// Impression : une page HTML par image de page, à la taille réelle, puis la boîte d'impression de Windows
ipcMain.handle('print', async (e, pages) => {
  if (!Array.isArray(pages) || !pages.length || pages.length > 5000) throw new Error('Pages invalides');
  for (const p of pages) if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(String(p.src)) || !(+p.w > 0) || !(+p.h > 0)) throw new Error('Page invalide');
  const html = `<!doctype html><meta charset="utf-8"><style>@page{margin:0}html,body{margin:0}img{display:block;page-break-after:always}</style>`
    + pages.map(p => `<img src="${p.src}" style="width:${+p.w}pt;height:${+p.h}pt">`).join('');
  const w = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
  try {
    await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const landscape = pages[0] && +pages[0].w > +pages[0].h;
    await new Promise((ok, ko) => w.webContents.print({ silent: false, printBackground: true, landscape, margins: { marginType: 'none' } },
      (done, why) => done || why === 'cancelled' || why === 'Print job canceled' ? ok() : ko(new Error(why))));
  } finally { w.destroy(); }
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
