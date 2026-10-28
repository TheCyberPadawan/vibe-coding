// Lancement de PowerShell pour Vigie.
// Un script n'est jamais exécuté directement depuis un fichier : une amorce passée en ligne de commande
// (-EncodedCommand) le lit, vérifie son empreinte SHA-256, puis exécute exactement les octets vérifiés.
// Remplacer le fichier entre son écriture et son exécution ne permet donc pas de faire exécuter autre chose.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const psq = s => "'" + String(s).replace(/'/g, "''") + "'";   // chaîne PowerShell littérale
const POWERSHELL = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

function bootstrap(file, hash) {
  const cmd = `$ErrorActionPreference = 'Stop'
$b = [IO.File]::ReadAllBytes(${psq(file)})
$h = -join ([Security.Cryptography.SHA256]::Create().ComputeHash($b) | ForEach-Object { $_.ToString('x2') })
if ($h -ne '${hash}') { exit 97 }
& ([scriptblock]::Create([Text.Encoding]::UTF8.GetString($b)))`;
  return Buffer.from(cmd, 'utf16le').toString('base64');
}
// Écrit le script dans un dossier privé à nom imprévisible ; renvoie l'amorce et de quoi nettoyer
function stage(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vigie-'));
  const file = path.join(dir, 'script.ps1'), bytes = Buffer.from(source, 'utf8');
  fs.writeFileSync(file, bytes);
  return { dir, enc: bootstrap(file, crypto.createHash('sha256').update(bytes).digest('hex')), clean: () => fs.rm(dir, { recursive: true, force: true }, () => {}) };
}
const BASE = ['-NoProfile', '-NonInteractive', '-NoLogo'];

// Script ponctuel (droits normaux) : résout avec les objets émis sous la forme « @@{json} »
function runPS(source, { timeout = 60000 } = {}) {
  const s = stage(source);
  return new Promise((resolve, reject) => {
    const child = spawn(POWERSHELL, [...BASE, '-EncodedCommand', s.enc], { windowsHide: true });
    const items = []; let buf = '', err = '';
    const timer = setTimeout(() => child.kill(), timeout);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { take(buf.slice(0, i)); buf = buf.slice(i + 1); } });
    child.stderr.on('data', d => { err += d; });
    const take = l => { l = l.trim(); if (l.startsWith('@@')) try { items.push(JSON.parse(l.slice(2))); } catch {} };
    child.on('error', e => { clearTimeout(timer); s.clean(); reject(e); });
    child.on('close', code => {
      clearTimeout(timer); take(buf); s.clean();
      if (code === 97) return reject(new Error('Script modifié avant son exécution : opération annulée.'));
      resolve({ items, code, err });
    });
  });
}

// Script permanent (droits normaux) : onLine reçoit chaque objet émis ; renvoie le processus enfant
function spawnPS(source, onLine, env = {}) {
  const s = stage(source);
  const child = spawn(POWERSHELL, [...BASE, '-EncodedCommand', s.enc], { windowsHide: true, env: { ...process.env, ...env } });
  let buf = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (l.startsWith('@@')) { try { onLine(JSON.parse(l.slice(2))); } catch {} }
    }
  });
  child.on('close', s.clean);
  setTimeout(s.clean, 20000);   // le script est lu au démarrage : le fichier n'est plus utile
  return child;
}

// Script en administrateur (fenêtre UAC), sans attendre sa fin. Rejette si l'autorisation est refusée.
function launchElevated(source) {
  const s = stage(source);
  return new Promise((resolve, reject) => {
    const cmd = `try { Start-Process ${psq(POWERSHELL)} -Verb RunAs -WindowStyle Hidden -ArgumentList ${[...BASE, '-EncodedCommand', s.enc].map(psq).join(',')} } catch { exit 1223 }`;
    const child = spawn(POWERSHELL, [...BASE, '-Command', cmd], { windowsHide: true });
    child.on('error', e => { s.clean(); reject(e); });
    child.on('close', code => {
      setTimeout(s.clean, 20000);
      code === 0 ? resolve() : reject(new Error('Autorisation administrateur refusée.'));
    });
  });
}

module.exports = { runPS, spawnPS, launchElevated, psq, POWERSHELL };
