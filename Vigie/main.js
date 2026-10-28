// Processus principal de Vigie : surveillance, enrichissement (icônes, noms des serveurs), actions sur le pare-feu.
// La page n'envoie qu'une clé de programme et un nom d'action : le chemin réel vient toujours de la surveillance.
const { app, BrowserWindow, ipcMain, Menu, Notification, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;
const { Monitor } = require('./monitor');
const { Helper } = require('./helper');
const { runPS, psq } = require('./ps');

const SMOKE = !app.isPackaged && !!process.env.VIGIE_SMOKE;   // test automatique, jamais dans la version installée
const PROTECTED = new Set(['svchost.exe', 'lsass.exe', 'services.exe', 'wininit.exe', 'csrss.exe', 'smss.exe', 'winlogon.exe', 'dwm.exe', 'spoolsv.exe',
  'msmpeng.exe', 'nissrv.exe', 'mpdefendercoreservice.exe', 'securityhealthservice.exe', 'powershell.exe', 'pwsh.exe', 'vigie.exe', 'explorer.exe']);
const ACTIONS = { blockOut: { op: 'block', dir: 'out', scope: 'all' }, lanOnly: { op: 'block', dir: 'out', scope: 'internet' }, blockIn: { op: 'block', dir: 'in', scope: 'all' } };

let win = null, helper = null, last = null;
const monitor = new Monitor();
const file = n => path.join(app.getPath('userData'), n);
const readJson = (n, d) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return d; } };
const writeJson = (n, v) => { fs.mkdirSync(app.getPath('userData'), { recursive: true }); fs.writeFileSync(file(n), JSON.stringify(v, null, 1)); };
let settings = { notifyPorts: true, notifyInternet: false, dns: true, ...readJson('settings.json', {}) };
const journal = readJson('journal.json', []).slice(-300);
function log(entry) { journal.push({ t: Date.now(), ...entry }); if (journal.length > 300) journal.shift(); writeJson('journal.json', journal); send('journal', journal); }
const send = (ch, v) => { if (win && !win.isDestroyed()) win.webContents.send(ch, v); };

// ───────────── Enrichissement : icônes et noms des serveurs ─────────────
const icons = new Map(), names = new Map(), lookups = new Set();
async function icon(p) {
  if (icons.has(p)) return;
  icons.set(p, null);
  try { icons.set(p, (await app.getFileIcon(p, { size: 'normal' })).toDataURL()); send('icons', { [p.toLowerCase()]: icons.get(p) }); } catch {}
}
async function reverse(ip) {
  if (names.has(ip) || lookups.size > 6) return;
  lookups.add(ip); names.set(ip, null);
  try {
    const r = await Promise.race([dns.reverse(ip), new Promise((_, ko) => setTimeout(() => ko(new Error('délai')), 2500))]);
    if (r[0]) names.set(ip, r[0]);
  } catch {} finally { lookups.delete(ip); }
}

monitor.on('update', u => {
  last = u;
  for (const g of u.programs) {
    if (g.path) icon(g.path);
    g.protected = !g.path || PROTECTED.has(path.basename(g.path).toLowerCase());
    for (const c of g.conns) { if (settings.dns && c.kind === 'internet') { reverse(c.remote); c.host = names.get(c.remote) || null; } }
  }
  for (const e of u.events) {
    log({ type: e.type, name: e.name, key: e.key, detail: e.detail });
    if ((e.type === 'port' && settings.notifyPorts) || (e.type === 'internet' && settings.notifyInternet)) {
      if (Notification.isSupported()) new Notification({ title: e.type === 'port' ? 'Nouveau port ouvert sur le réseau' : 'Nouveau programme connecté à Internet', body: `${e.name} : ${e.detail}`, silent: true }).show();
    }
  }
  send('update', { programs: u.programs, fw: u.fw, helper: !!helper?.ready });
});

// ───────────── Détails d'un programme (signature, éditeur) ─────────────
const details = new Map();
ipcMain.handle('details', async (_e, key) => {
  const g = monitor.programs.get(String(key)); if (!g || !g.path) return null;
  if (details.has(g.path)) return details.get(g.path);
  const { items } = await runPS(String.raw`$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$p = ${psq(g.path)}
$s = Get-AuthenticodeSignature -LiteralPath $p
$v = (Get-Item -LiteralPath $p).VersionInfo
[Console]::Out.WriteLine('@@' + (@{ status = [string]$s.Status; signer = [string]($s.SignerCertificate.Subject -replace '^CN="?([^",]+).*', '$1'); company = [string]$v.CompanyName; product = [string]$v.ProductName; description = [string]$v.FileDescription; version = [string]$v.FileVersion } | ConvertTo-Json -Compress))`);
  const d = items[0] || null; details.set(g.path, d); return d;
});

// ───────────── Actions (assistant administrateur) ─────────────
ipcMain.handle('act', async (_e, key, action) => {
  const g = monitor.programs.get(String(key));
  if (!g) throw new Error('Ce programme ne figure plus dans la liste.');
  if (!g.path) throw new Error("Ce composant du système n'a pas de fichier programme : Vigie ne peut pas le viser.");
  if (PROTECTED.has(path.basename(g.path).toLowerCase())) throw new Error(`${path.basename(g.path)} est un composant vital de Windows : Vigie refuse d'agir dessus.`);
  if (!helper) throw new Error("L'assistant administrateur n'est pas disponible.");
  let message;
  if (ACTIONS[action]) {
    const a = ACTIONS[action];
    const r = await helper.call('block', { program: g.path, dir: a.dir, scope: a.scope });
    message = { blockOut: `${g.name} n'a plus accès au réseau.`, lanOnly: `${g.name} ne peut plus joindre Internet (réseau local autorisé).`, blockIn: `Plus aucune connexion entrante n'atteint ${g.name}.` }[action];
    log({ type: 'action', action, name: g.name, key: g.key, rule: r.name });
  } else if (action === 'unblock') {
    const rules = (g.rules || []).filter(r => r.vigie);
    for (const r of rules) await helper.call('unblock', { name: r.name });
    message = `Règles de Vigie retirées pour ${g.name}.`;
    log({ type: 'action', action, name: g.name, key: g.key });
  } else if (action === 'kill') {
    for (const pid of g.pids) await helper.call('kill', { pid, program: g.path });
    message = `${g.name} a été arrêté.`;
    log({ type: 'action', action, name: g.name, key: g.key });
  } else throw new Error('Action inconnue.');
  await monitor.refreshFirewall();
  return message;
});
ipcMain.handle('show-in-folder', (_e, key) => { const g = monitor.programs.get(String(key)); if (g?.path) shell.showItemInFolder(g.path); });
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('set-settings', (_e, s) => {
  for (const k of ['notifyPorts', 'notifyInternet', 'dns']) if (typeof s?.[k] === 'boolean') settings[k] = s[k];
  writeJson('settings.json', settings); return settings;
});
ipcMain.handle('journal', () => journal);
ipcMain.handle('snapshot', () => last && { programs: last.programs, fw: last.fw, helper: !!helper?.ready, icons: Object.fromEntries([...icons].filter(([, v]) => v).map(([k, v]) => [k.toLowerCase(), v])) });

// ───────────── Fenêtre ─────────────
function createWindow() {
  const ico = path.join(__dirname, 'build', 'icon.png');
  win = new BrowserWindow({
    width: 1320, height: 860, minWidth: 900, minHeight: 560, show: false, title: 'Vigie', backgroundColor: '#0f1318', autoHideMenuBar: true,
    icon: fs.existsSync(ico) ? ico : undefined,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.once('ready-to-show', () => { win.show(); if (!SMOKE) win.maximize(); });
  if (SMOKE) {
    win.webContents.on('console-message', e => { if (e.level === 'warning' || e.level === 'error') console.log('[page]', e.message); });
    win.webContents.on('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, +process.env.VIGIE_SMOKE_WAIT || 6000));
      const progs = last?.programs || [];
      console.log(`SMOKE programmes=${progs.length} en ligne=${progs.filter(g => g.internet).length} ports exposés=${progs.reduce((s, g) => s + g.exposed, 0)} règles=${progs.reduce((s, g) => s + (g.rules?.length || 0), 0)} pare-feu=${JSON.stringify(last?.fw)}`);
      console.log('SMOKE page', await win.webContents.executeJavaScript(`document.querySelectorAll('.prog').length + ' lignes | ' + document.querySelector('#stats').textContent`));
      if (process.env.VIGIE_SHOT) {
        await win.webContents.executeJavaScript(`[...document.querySelectorAll('.prog')].find(p => /${process.env.VIGIE_SMOKE_PICK || '.'}/i.test(p.textContent))?.click()`);
        await new Promise(r => setTimeout(r, 2500));
        fs.writeFileSync(process.env.VIGIE_SHOT, (await win.webContents.capturePage()).toPNG());
      }
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
  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    Menu.setApplicationMenu(null);
    app.setAppUserModelId('fr.vigie.app');
    try {
      const { items } = await runPS(`[Console]::Out.WriteLine('@@' + (@{ sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value } | ConvertTo-Json -Compress))`);
      helper = new Helper(items[0].sid);
      helper.onState = on => send('helper', on);
    } catch (e) { console.warn("Identité de l'utilisateur introuvable :", e.message); }
    monitor.start();
    createWindow();
  });
  app.on('window-all-closed', () => { monitor.stop(); helper?.stop(); app.quit(); });
}
