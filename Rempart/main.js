// Processus principal de Rempart : analyse, corrections réversibles, rapport PDF.
// La page n'envoie que des identifiants de vérification : aucun script ne vient d'elle.
const { app, BrowserWindow, ipcMain, dialog, Menu, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { runPS, runStep, regApply, REG_UNDO, psq } = require('./ps');
const { checks, SEV, validBackup } = require('./checks');

// Test automatique : analyse, affiche les résultats, quitte. Jamais dans la version installée.
const SMOKE = !app.isPackaged && !!process.env.REMPART_SMOKE;
const byId = new Map(checks.map(c => [c.id, c]));
let isAdmin = false;
let machine = {};
const results = new Map();                   // id -> { status, detail }

// ───────────── Sauvegardes (état d'avant chaque correction) ─────────────
const backupFile = () => path.join(app.getPath('userData'), 'sauvegardes.json');
function loadBackups() { try { return JSON.parse(fs.readFileSync(backupFile(), 'utf8')); } catch { return {}; } }
function saveBackups(b) { fs.mkdirSync(path.dirname(backupFile()), { recursive: true }); fs.writeFileSync(backupFile(), JSON.stringify(b, null, 2)); }

// ───────────── Analyse ─────────────
const INFO = String.raw`Emit @{ id = '__info'; ok = $true; v = @{
  pc = $env:COMPUTERNAME; user = $env:USERNAME
  os = [string](Get-CimInstance Win32_OperatingSystem).Caption
  version = [string](RegVal 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' 'DisplayVersion')
  build = [string](RegVal 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' 'CurrentBuild')
  admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
} }`;

const probeBlock = c => `try { $__v = & {\n${c.probe}\n}; Emit @{ id = '${c.id}'; ok = $true; v = $__v } } catch { Emit @{ id = '${c.id}'; ok = $false; e = $_.Exception.Message } }`;

function judge(c, item) {
  if (!item.ok) {
    const special = c.onError && c.onError(item.e || '');
    if (special) return special;
    const denied = /refus|denied|privil|administrat|élev/i.test(item.e || '');
    return {
      status: 'unknown',
      detail: (c.admin || denied) && !isAdmin ? 'Droits administrateur nécessaires pour vérifier ce point.' : `Vérification impossible : ${item.e}`,
    };
  }
  try { return c.evaluate(item.v || {}); } catch (e) { return { status: 'unknown', detail: `Résultat illisible : ${e.message}` }; }
}

async function audit(list, onResult) {
  await runPS([INFO, ...list.map(probeBlock)].join('\n'), {
    onItem: item => {
      if (item.id === '__info') { machine = item.v || {}; isAdmin = !!machine.admin; return; }
      const c = byId.get(item.id);
      if (!c) return;
      const r = judge(c, item);
      results.set(c.id, r);
      if (onResult) onResult(c.id, r);
    },
  });
}

// ───────────── Corrections ─────────────
// Exécute un bloc de correction ; élevé si la correction l'exige et que Rempart ne l'est pas déjà
const runFix = (fix, body, before) => runStep(body, before, { elevated: fix.admin !== false && !isAdmin });

async function recheck(id) {
  await audit([byId.get(id)]);
  return results.get(id);
}

const meta = c => ({
  id: c.id, cat: c.cat, sev: c.sev, sevLabel: SEV[c.sev], title: c.title, why: c.why, admin: !!c.admin,
  manual: c.manual || null, open: !!c.open,
  fix: c.fix ? {
    label: c.fix.label, desc: c.fix.desc, restart: !!c.fix.restart, harmless: !!c.fix.harmless,
    reversible: !!(c.fix.reg || c.fix.undo), elevate: c.fix.admin !== false,
  } : null,
});

ipcMain.handle('get-checks', () => ({ checks: checks.map(meta), backups: Object.keys(loadBackups()) }));

ipcMain.handle('audit', async e => {
  results.clear();
  await audit(checks, (id, r) => { if (!e.sender.isDestroyed()) e.sender.send('audit-result', { id, ...r }); });
  return { machine, isAdmin };
});

ipcMain.handle('fix', async (_e, id) => {
  const c = byId.get(id);
  if (!c || !c.fix) throw new Error('Aucune correction automatique pour ce point.');
  const before = await runFix(c.fix, c.fix.reg ? regApply(c.fix.reg) : c.fix.apply);
  let warning = null;
  if (c.fix.reg || c.fix.undo) {
    const b = loadBackups();
    if (!validBackup(c, before)) warning = "L'état d'origine n'a pas pu être sauvegardé de façon fiable : cette correction ne pourra pas être annulée automatiquement.";
    else if (!b[id]) { b[id] = { date: new Date().toISOString(), before }; saveBackups(b); }   // on garde l'état d'origine
  }
  return { result: await recheck(id), backups: Object.keys(loadBackups()), warning };
});

ipcMain.handle('undo', async (_e, id) => {
  const c = byId.get(id);
  const b = loadBackups();
  if (!c || !c.fix || !b[id]) throw new Error('Aucune sauvegarde pour ce point.');
  // Le fichier de sauvegarde n'est pas digne de confiance : seule la forme prévue par la correction est acceptée
  if (!validBackup(c, b[id].before)) throw new Error('La sauvegarde de ce point a été modifiée ou est illisible : annulation refusée par sécurité.');
  await runFix(c.fix, c.fix.reg ? REG_UNDO : c.fix.undo, b[id].before);
  delete b[id];
  saveBackups(b);
  return { result: await recheck(id), backups: Object.keys(b) };
});

ipcMain.handle('open-setting', (_e, id) => {
  const c = byId.get(id);
  if (c && c.open) return shell.openExternal(c.open);
});

ipcMain.handle('restore-point', async () => {
  const body = String.raw`$w = $null
Checkpoint-Computer -Description 'Rempart - avant corrections' -RestorePointType MODIFY_SETTINGS -WarningVariable w -WarningAction SilentlyContinue
@{ warn = [string]($w -join ' ') }`;
  const v = await runFix({}, body);
  return v && v.warn ? v.warn : null;
});

ipcMain.handle('relaunch-admin', async () => {
  const args = app.isPackaged ? '' : ` -ArgumentList ${psq(`"${app.getAppPath()}"`)}`;
  await new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Start-Process -FilePath ${psq(process.execPath)}${args} -Verb RunAs`], { windowsHide: true });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error('Autorisation administrateur refusée.')));
  });
  app.quit();
});

ipcMain.handle('export-pdf', async (e, html) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const stamp = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Enregistrer le rapport', defaultPath: path.join(app.getPath('documents'), `Rapport Rempart ${machine.pc || ''} ${stamp}.pdf`.replace(/\s+/g, ' ')),
    filters: [{ name: 'Document PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return null;
  await writePdf(html, filePath);
  shell.openPath(filePath);
  return filePath;
});

async function writePdf(html, filePath) {
  const pdfWin = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
  try {
    await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await pdfWin.webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'custom', top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } });
    await fs.promises.writeFile(filePath, pdf);
  } finally { pdfWin.destroy(); }
}

// ───────────── Fenêtre ─────────────
function createWindow() {
  const icon = path.join(__dirname, 'build', 'icon.png');
  const win = new BrowserWindow({
    width: 1180, height: 860, minWidth: 720, minHeight: 520, show: false,
    title: 'Rempart', backgroundColor: '#f4f5f7', autoHideMenuBar: true,
    icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.once('ready-to-show', () => { win.show(); if (!SMOKE) win.maximize(); });
  if (SMOKE) {
    win.webContents.on('console-message', e => { if (e.level === 'warning' || e.level === 'error') console.log('[page]', e.message); });
    win.webContents.on('did-finish-load', async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 180000 && !(await win.webContents.executeJavaScript('!!window.__auditDone'))) await new Promise(r => setTimeout(r, 500));
      console.log(`SMOKE admin=${isAdmin} pc=${machine.pc} os=${machine.os} ${machine.version} durée=${((Date.now() - t0) / 1000).toFixed(1)}s`);
      for (const c of checks) { const r = results.get(c.id) || {}; console.log(`  ${(r.status || '-').padEnd(8)} ${c.id.padEnd(14)} ${r.detail || ''}`); }
      console.log('SMOKE page', await win.webContents.executeJavaScript(`document.querySelector('#score').textContent + ' | ' + document.querySelector('#grade').textContent + ' | cartes=' + document.querySelectorAll('.check').length`));
      if (process.env.REMPART_SHOT) {
        await new Promise(r => setTimeout(r, 600));
        fs.writeFileSync(process.env.REMPART_SHOT, (await win.webContents.capturePage()).toPNG());
      }
      if (process.env.REMPART_PDF) await writePdf(await win.webContents.executeJavaScript('reportHtml()'), process.env.REMPART_PDF);
      app.quit();
    });
  }
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

// Aucune fenêtre (même cachée) ne peut naviguer ailleurs, ouvrir une fenêtre ni intégrer une vue web
app.on('web-contents-created', (_e, wc) => {
  wc.on('will-navigate', e => e.preventDefault());
  wc.on('will-redirect', e => e.preventDefault());
  wc.on('will-attach-webview', e => e.preventDefault());
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
});
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  Menu.setApplicationMenu(null); createWindow();
});
app.on('window-all-closed', () => app.quit());
