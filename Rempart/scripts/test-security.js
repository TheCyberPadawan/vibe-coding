// Tests de sécurité de Rempart (sans modifier le système) : node scripts/test-security.js
// 1. un script exécuté par l'amorce renvoie bien son résultat ;
// 2. un script remplacé après son écriture est refusé (empreinte SHA-256) ;
// 3. les sauvegardes forgées sont refusées par les validateurs, les vraies acceptées.
const fs = require('fs');
const path = require('path');
const { runPS } = require('../ps');
const { checks, validBackup } = require('../checks');

(async () => {
  const ok = await runPS(`Emit @{ msg = 'bonjour é' }`);
  console.log('1. exécution normale :', JSON.stringify(ok.items[0]));

  // Course : on remplace le fichier dès qu'il apparaît, avant que PowerShell ne démarre
  const tmp = require('os').tmpdir(), seen = new Set(fs.readdirSync(tmp));
  const watcher = setInterval(() => {
    for (const d of fs.readdirSync(tmp)) if (d.startsWith('rempart-') && !seen.has(d)) {
      seen.add(d);
      try { fs.writeFileSync(path.join(tmp, d, 'script.ps1'), "Emit @{ msg = 'CODE PIRATE' }"); } catch {}
    }
  }, 1);
  try { const r = await runPS(`Emit @{ msg = 'original' }`); console.log('2. script remplacé :', r.code === 97 ? 'refusé (empreinte différente)' : `EXÉCUTÉ ${JSON.stringify(r.items)}`); }
  catch (e) { console.log('2. script remplacé : refusé —', e.message); }
  finally { clearInterval(watcher); }

  const c = id => checks.find(x => x.id === id);
  const cases = [
    ['llmnr, vraie sauvegarde', c('llmnr'), { reg: [{ p: c('llmnr').fix.reg[0].path, n: 'EnableMulticast', existe: false }] }, true],
    ['llmnr, clé détournée', c('llmnr'), { reg: [{ p: 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', n: 'EnableMulticast', existe: true, v: 'C:\\pirate.exe', k: 'String' }] }, false],
    ['uac, valeur de type inattendu', c('uac'), { reg: c('uac').fix.reg.map(r => ({ p: r.path, n: r.name, existe: true, v: 'texte', k: 'DWord' })) }, false],
    ['uac, entrée en trop', c('uac'), { reg: [...c('uac').fix.reg.map(r => ({ p: r.path, n: r.name, existe: false })), { p: 'HKLM:\\X', n: 'Y', existe: false }] }, false],
    ['pare-feu, vraie sauvegarde', c('firewall'), { Domain: 'True', Private: 'True', Public: 'False' }, true],
    ['pare-feu, nom de profil injecté', c('firewall'), { 'Public; Remove-Item C:\\': 'False' }, false],
    ['verrouillage, valeur hors bornes', c('lockout'), { v: 5000 }, false],
    ['invité, vraie sauvegarde', c('guest'), { v: false }, true],
    ['invité, type inattendu', c('guest'), { v: 'oui' }, false],
  ];
  console.log('3. validation des sauvegardes :');
  let bad = 0;
  for (const [name, check, before, expected] of cases) {
    const got = validBackup(check, before);
    if (got !== expected) bad++;
    console.log(`   ${got === expected ? 'OK ' : 'ÉCHEC'} ${name} -> ${got ? 'acceptée' : 'refusée'}`);
  }
  const withUndo = checks.filter(x => x.fix && (x.fix.reg || x.fix.undo));
  console.log(`   ${withUndo.filter(x => x.fix.reg || x.fix.validate).length}/${withUndo.length} corrections réversibles ont un validateur`);
  process.exit(bad ? 1 : 0);
})();
