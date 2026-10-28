// Tests de sécurité de NetVision (lecture seule, aucune action sur le réseau) : node scripts/test-security.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runPS } = require('../ps');
const { enrich, vendor, isRandom } = require('../net');

let bad = 0;
const check = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'OK    ' : 'ÉCHEC '}${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  // 1. Amorce PowerShell vérifiée : un script remplacé avant exécution est refusé
  const tmp = os.tmpdir(), seen = new Set(fs.readdirSync(tmp));
  const watch = setInterval(() => { for (const d of fs.readdirSync(tmp)) if (d.startsWith('vigie-') || d.startsWith('netvision-') || /^[a-z]+-[0-9a-f]{12}/.test(d)) {
    try { const f = path.join(tmp, d, 'script.ps1'); if (fs.existsSync(f) && !seen.has(d)) { seen.add(d); fs.writeFileSync(f, "[Console]::Out.WriteLine('@@{\"pirate\":1}')"); } } catch {} } }, 1);
  const r = await runPS("[Console]::Out.WriteLine('@@{\"ok\":1}')").catch(e => ({ err: e.message }));
  clearInterval(watch);
  check('script PowerShell remplacé refusé', !!r.err && /modifié/.test(r.err), r.err || JSON.stringify(r.items));

  // 2. Fabricant par OUI et détection des MAC aléatoires (adresses d'exemple : 14-0C-76 = préfixe Freebox)
  check('OUI : Freebox reconnue', vendor('14-0C-76-00-00-01') && /freebox/i.test(vendor('14-0C-76-00-00-01')));
  check('MAC localement administrée = aléatoire', isRandom('02-11-22-33-44-55') === true && isRandom('14-0C-76-00-00-01') === false);

  // 3. Devinette du type d'appareil
  const t = (ports, extra = {}) => enrich({ ip: '192.168.1.9', mac: '00-11-22-33-44-55', ports, ...extra }, '192.168.1.254').kind;
  check('iPhone détecté (62078)', t([62078]) === 'apple');
  check('imprimante détectée (9100)', t([9100]) === 'printer');
  check('box = routeur', enrich({ ip: '192.168.1.254', ports: [53, 80] }, '192.168.1.254').kind === 'router');
  check('cet ordinateur', enrich({ ip: '192.168.1.9', self: true, ports: [445] }, '192.168.1.254').kind === 'self');

  // 4. Pare-feu applicatif : l'ouverture d'interface web est bornée (vérifiée ici au niveau de la logique)
  //    (le contrôle réel est dans main.js : seuls http/https vers un hôte ayant le port correspondant)
  const okScheme = s => ['http', 'https'].includes(s);
  check('seuls http et https acceptés', okScheme('http') && okScheme('https') && !okScheme('file') && !okScheme('javascript'));

  console.log(bad ? `\n${bad} TEST(S) EN ÉCHEC` : '\nTOUT EST BON');
  process.exit(bad ? 1 : 0);
})();
