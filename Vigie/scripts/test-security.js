// Tests de sécurité de Vigie, sans droits administrateur et sans modifier le pare-feu : node scripts/test-security.js
// L'assistant est lancé sans élévation : la validation des commandes, le canal et l'arrêt de processus sont testés ;
// la création réelle d'une règle échoue alors (accès refusé), ce qui prouve que la commande a été jugée valide.
const net = require('net');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { runPS, spawnPS, psq } = require('../ps');
const { Helper } = require('../helper');
const { classify, listenScope, INTERNET_RANGES } = require('../net');

let bad = 0;
const check = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'OK    ' : 'ÉCHEC '}${name}${extra ? ' — ' + extra : ''}`); };
const rejects = async (p, re) => { try { await p; return 'accepté'; } catch (e) { return re.test(e.message) ? true : e.message; } };

(async () => {
  // 1. Classement des adresses
  const cls = { '8.8.8.8': 'internet', '192.168.1.10': 'lan', '10.2.3.4': 'lan', '172.20.0.1': 'lan', '100.66.55.68': 'lan', '127.0.0.1': 'local',
    '::1': 'local', 'fe80::1': 'lan', 'fd00::5': 'lan', '2a00:1450:4007::200e': 'internet', '::ffff:1.1.1.1': 'internet', '169.254.3.4': 'lan' };
  check('classement des adresses', Object.entries(cls).every(([ip, k]) => classify(ip) === k), Object.entries(cls).filter(([ip, k]) => classify(ip) !== k).map(([ip]) => ip).join(' '));
  check('portée des ports en écoute', listenScope('0.0.0.0') === 'all' && listenScope('::') === 'all' && listenScope('127.0.0.1') === 'local' && listenScope('192.168.1.5') === 'lan');
  // Les plages « Internet » ne doivent contenir aucune adresse privée et couvrir les publiques
  const ip4 = s => s.split('.').reduce((n, x) => n * 256 + +x, 0);
  const inRanges = ip => INTERNET_RANGES.filter(r => r.includes('-')).some(r => { const [a, b] = r.split('-'); return ip4(ip) >= ip4(a) && ip4(ip) <= ip4(b); });
  check('plages Internet sans adresses privées', ['10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.0.1', '127.0.0.1', '100.64.0.1', '100.127.255.255', '169.254.1.1', '224.0.0.251', '0.0.0.0'].every(ip => !inRanges(ip)));
  check('plages Internet couvrant le public', ['1.1.1.1', '8.8.8.8', '100.63.255.255', '100.128.0.0', '172.15.255.255', '172.32.0.0', '192.167.255.255', '192.169.0.0', '223.255.255.255'].every(inRanges));

  // 2. Amorce : un script remplacé avant exécution est refusé
  const tmp = require('os').tmpdir(), seen = new Set(fs.readdirSync(tmp));
  const watch = setInterval(() => { for (const d of fs.readdirSync(tmp)) if (d.startsWith('vigie-') && !seen.has(d)) { seen.add(d); try { fs.writeFileSync(path.join(tmp, d, 'script.ps1'), "[Console]::Out.WriteLine('@@{\"pirate\":1}')"); } catch {} } }, 1);
  const r = await runPS("[Console]::Out.WriteLine('@@{\"original\":1}')").catch(e => ({ err: e.message }));
  clearInterval(watch);
  check('script remplacé refusé', !!r.err && /modifié/.test(r.err), r.err || JSON.stringify(r.items));

  // 3. Assistant (sans élévation)
  const { items } = await runPS(`[Console]::Out.WriteLine('@@' + (@{ sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value } | ConvertTo-Json -Compress))`);
  const sid = items[0].sid;
  // Mauvais jeton : le canal est fermé
  {
    const name = 'vigie-test-' + crypto.randomBytes(8).toString('hex');
    const pre = `$PipeName = ${psq(name)}; $Token = ${psq('bon-jeton')}; $ClientSid = ${psq(sid)}\n$InternetRanges = @(${INTERNET_RANGES.map(psq).join(', ')})\n`;
    const child = spawnPS(pre + fs.readFileSync(path.join(__dirname, '..', 'ps', 'helper.ps1'), 'utf8'), () => {});
    const sock = await new Promise((ok, ko) => { const end = Date.now() + 20000; const a = () => { const s = net.connect('\\\\.\\pipe\\' + name); s.once('connect', () => ok(s)); s.once('error', () => Date.now() > end ? ko(new Error('pas de canal')) : setTimeout(a, 200)); }; a(); });
    let got = '';
    sock.on('data', d => { got += d; });
    sock.write('mauvais-jeton\n');
    await new Promise(r => sock.on('close', r));
    check('mauvais jeton : canal fermé sans réponse', got === '');
    child.kill();
  }
  const helper = new Helper(sid, { launch: async src => { helper.child = spawnPS(src, () => {}); } });
  await helper.ensure();
  check('assistant joint avec le bon jeton', helper.ready);
  const node = process.execPath;
  check('svchost.exe refusé', await rejects(helper.call('block', { program: 'C:\\Windows\\System32\\svchost.exe', dir: 'out', scope: 'all' }), /vital/));
  check('chemin avec joker refusé', await rejects(helper.call('block', { program: 'C:\\Program Files\\*.exe', dir: 'out', scope: 'all' }), /invalide/));
  check('chemin relatif refusé', await rejects(helper.call('block', { program: '..\\..\\Windows\\notepad.exe', dir: 'out', scope: 'all' }), /invalide/));
  check('chemin détourné (..) refusé', await rejects(helper.call('block', { program: path.join(path.dirname(node), '..', path.basename(path.dirname(node)), path.basename(node)), dir: 'out', scope: 'all' }), /canonique/));
  check('fichier non .exe refusé', await rejects(helper.call('block', { program: 'C:\\Windows\\win.ini', dir: 'out', scope: 'all' }), /\.exe/));
  check('programme inexistant refusé', await rejects(helper.call('block', { program: 'C:\\Inexistant\\x.exe', dir: 'out', scope: 'all' }), /introuvable/));
  check('sens invalide refusé', await rejects(helper.call('block', { program: node, dir: 'both', scope: 'all' }), /Sens/));
  check('portée invalide refusée', await rejects(helper.call('block', { program: node, dir: 'in', scope: 'internet' }), /Portée/));
  check('règle étrangère refusée', await rejects(helper.call('unblock', { name: 'CoreNet-DHCP-In' }), /invalide/));
  check('commande inconnue refusée', await rejects(helper.call('exec', { cmd: 'calc' }), /inconnue/));
  const deny = await rejects(helper.call('block', { program: node, dir: 'out', scope: 'internet' }), /refus|denied|privil|autoris|administrat/i);
  check('commande valide transmise au pare-feu (refusée ici faute de droits)', deny === true, deny === true ? '' : String(deny));
  // Arrêt d'un processus : vérification du programme avant de l'arrêter
  const ping = spawn(path.join(process.env.SystemRoot, 'System32', 'PING.EXE'), ['-t', '127.0.0.1'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 500));
  check('arrêt refusé si le programme ne correspond pas', await rejects(helper.call('kill', { pid: ping.pid, program: node }), /changé/));
  const killed = await helper.call('kill', { pid: ping.pid, program: path.join(process.env.SystemRoot, 'System32', 'PING.EXE') }).then(() => true, e => e.message);
  await new Promise(r => setTimeout(r, 400));
  check('arrêt du bon programme', killed === true && ping.exitCode !== null || ping.signalCode !== null, String(killed));
  helper.stop(); helper.child?.kill();
  console.log(bad ? `\n${bad} TEST(S) EN ÉCHEC` : '\nTOUT EST BON');
  process.exit(bad ? 1 : 0);
})();
