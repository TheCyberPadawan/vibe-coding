// Exécution des scripts PowerShell de Rempart, en mode normal ou élevé (fenêtre UAC).
// Chaque script renvoie ses résultats sous forme de lignes "@@{json}".
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const psq = s => "'" + String(s).replace(/'/g, "''") + "'";   // chaîne PowerShell littérale

const PRELUDE = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
function Emit($o) {
  $line = '@@' + ($o | ConvertTo-Json -Depth 6 -Compress)
  if ($__out) { Add-Content -LiteralPath $__out -Value $line -Encoding UTF8 } else { [Console]::Out.WriteLine($line) }
}
function RegVal($p, $n) {
  try { (Get-Item -LiteralPath $p -ErrorAction Stop).GetValue($n, $null, 'DoNotExpandEnvironmentNames') } catch { $null }
}
function DefStat { if (-not $script:__mp) { $script:__mp = Get-MpComputerStatus }; $script:__mp }
function DefPref { if (-not $script:__mpp) { $script:__mpp = Get-MpPreference }; $script:__mpp }
`;

// Amorce passée en ligne de commande (-EncodedCommand) : lit le script, vérifie son empreinte SHA-256, puis exécute
// exactement les octets vérifiés. Remplacer le fichier entre son écriture et son exécution (même avec les droits de
// l'utilisateur) ne permet donc pas de faire exécuter autre chose avec les droits administrateur.
function bootstrap(file, hash) {
  const cmd = `$ErrorActionPreference = 'Stop'
$b = [IO.File]::ReadAllBytes(${psq(file)})
$h = -join ([Security.Cryptography.SHA256]::Create().ComputeHash($b) | ForEach-Object { $_.ToString('x2') })
if ($h -ne '${hash}') { exit 97 }
& ([scriptblock]::Create([Text.Encoding]::UTF8.GetString($b)))`;
  return Buffer.from(cmd, 'utf16le').toString('base64');
}

// Lance un script. elevated : passe par Start-Process -Verb RunAs, la sortie revient par un fichier.
function runPS(body, { elevated = false, onItem } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rempart-'));   // dossier privé, nom imprévisible
  const ps1 = path.join(dir, 'script.ps1');
  const out = elevated ? path.join(dir, 'resultat.txt') : null;
  const source = Buffer.from(`$__out = ${out ? psq(out) : '$null'}\n${PRELUDE}\n${body}\n`, 'utf8');
  fs.writeFileSync(ps1, source);
  const hash = crypto.createHash('sha256').update(source).digest('hex');

  const items = [];
  const take = line => {
    if (!line.startsWith('@@')) return;
    try { const o = JSON.parse(line.slice(2)); items.push(o); if (onItem) onItem(o); } catch { /* ligne tronquée */ }
  };
  const base = ['-NoProfile', '-NonInteractive'], enc = bootstrap(ps1, hash);
  const args = elevated
    ? [...base, '-Command',
       `try { $p = Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList ` +
       [...base, '-EncodedCommand', enc].map(psq).join(',') + `; exit $p.ExitCode } catch { exit 1223 }`]
    : [...base, '-EncodedCommand', enc];

  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', args, { windowsHide: true });
    let buf = '', err = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', d => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) { take(buf.slice(0, i).trim()); buf = buf.slice(i + 1); }
    });
    child.stderr.on('data', d => { err += d; });
    child.on('error', reject);
    child.on('close', code => {
      take(buf.trim());
      if (out) {
        try { fs.readFileSync(out, 'utf8').replace(/^﻿/, '').split(/\r?\n/).forEach(l => take(l.trim())); } catch { /* aucun résultat */ }
      }
      fs.rm(dir, { recursive: true, force: true }, () => {});
      if (elevated && code === 1223) return reject(new Error('Autorisation administrateur refusée.'));
      if (code === 97) return reject(new Error("Le script a été modifié avant son exécution : opération annulée par sécurité."));
      resolve({ items, code, err });
    });
  });
}

// Pose des valeurs de registre et renvoie l'état d'avant de chacune (valeur et type, ou absence)
const psValue = v => typeof v === 'number' ? String(v) : psq(v);
function regApply(list) {
  const rows = list.map(r => `@{ p = ${psq(r.path)}; n = ${psq(r.name)}; v = ${psValue(r.value)}; k = '${r.kind}' }`).join(', ');
  return String.raw`$__b = New-Object System.Collections.ArrayList
foreach ($r in @(${rows})) {
  $k = $null; if (Test-Path -LiteralPath $r.p) { $k = Get-Item -LiteralPath $r.p }
  if ($k -and ($k.GetValueNames() -contains $r.n)) {
    [void]$__b.Add(@{ p = $r.p; n = $r.n; existe = $true; v = $k.GetValue($r.n, $null, 'DoNotExpandEnvironmentNames'); k = $k.GetValueKind($r.n).ToString() })
  } else { [void]$__b.Add(@{ p = $r.p; n = $r.n; existe = $false }) }
  if (-not $k) { New-Item -Path $r.p -Force | Out-Null }
  New-ItemProperty -LiteralPath $r.p -Name $r.n -Value $r.v -PropertyType $r.k -Force | Out-Null
}
@{ reg = @($__b) }`;
}

// Remet chaque valeur telle qu'elle était ($before = résultat de regApply)
const REG_UNDO = String.raw`foreach ($r in @($before.reg)) {
  if ($r.existe) {
    $val = $r.v
    if ($r.k -eq 'Binary') { $val = [byte[]]$r.v } elseif ($r.k -eq 'MultiString') { $val = [string[]]$r.v }
    if (-not (Test-Path -LiteralPath $r.p)) { New-Item -Path $r.p -Force | Out-Null }
    New-ItemProperty -LiteralPath $r.p -Name $r.n -Value $val -PropertyType $r.k -Force | Out-Null
  } else { Remove-ItemProperty -LiteralPath $r.p -Name $r.n -ErrorAction SilentlyContinue }
}`;

// Exécute une étape (correction ou annulation) et renvoie sa valeur ; $before est injecté s'il est fourni
async function runStep(body, before, opts) {
  const pre = before === undefined ? '' : `$before = ConvertFrom-Json ${psq(JSON.stringify(before))}\n`;
  const script = `${pre}try { $__v = & {\n${body}\n}; Emit @{ ok = $true; v = $__v } } catch { Emit @{ ok = $false; e = $_.Exception.Message } }`;
  const { items } = await runPS(script, opts);
  const r = items[0];
  if (!r) throw new Error("La correction n'a renvoyé aucun résultat.");
  if (!r.ok) throw new Error(r.e);
  return r.v;
}

module.exports = { runPS, runStep, regApply, REG_UNDO, psq };
