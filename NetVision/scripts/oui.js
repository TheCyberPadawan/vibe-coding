// Génère app/data/oui.json : préfixe MAC -> fabricant, à partir du fichier « manuf » de Wireshark.
// Hors ligne, si app/data/oui.json existe déjà, on le garde. Lancé par « npm run oui » et avant la construction.
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'app', 'data', 'oui.json');
const URL = 'https://www.wireshark.org/download/automated/data/manuf';

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NetVision-build' }, timeout: 30000 }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject).on('timeout', function () { this.destroy(new Error('délai dépassé')); });
  });
}

// Chaque ligne : « PREFIX<TAB>court<TAB>long ». PREFIX = 24 bits (AA:BB:CC) ou AA:BB:CC:DD:E0:00/28 ou /36.
function parse(text) {
  const out = { 24: {}, 28: {}, 36: {} };
  for (const line of text.split('\n')) {
    if (!line || line[0] === '#') continue;
    const f = line.split('\t');
    if (f.length < 2) continue;
    const [pfxRaw] = f;
    let name = (f[1] || '').trim() || (f[2] || '').trim();
    if (!name) continue;
    name = name.replace(/\\/g, '').slice(0, 40);
    const m = pfxRaw.trim().match(/^([0-9A-Fa-f:]+)(?:\/(\d+))?$/);
    if (!m) continue;
    const hex = m[1].replace(/:/g, '').toUpperCase();
    const bits = m[2] ? +m[2] : 24;
    const nibbles = bits === 36 ? 9 : bits === 28 ? 7 : 6;
    if (!out[bits === 36 ? 36 : bits === 28 ? 28 : 24]) continue;
    if (hex.length >= nibbles) out[bits === 36 ? 36 : bits === 28 ? 28 : 24][hex.slice(0, nibbles)] = name;
  }
  return out;
}

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  try {
    const text = await download(URL);
    const data = parse(text);
    fs.writeFileSync(OUT, JSON.stringify(data));
    const n = Object.values(data).reduce((s, o) => s + Object.keys(o).length, 0);
    console.log(`base des fabricants écrite : ${n} préfixes (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} Mo)`);
  } catch (e) {
    if (fs.existsSync(OUT)) { console.warn('Téléchargement impossible (' + e.message + '), on garde la base existante.'); return; }
    console.error('Téléchargement de la base des fabricants impossible et aucune copie locale :', e.message);
    process.exit(1);
  }
})();
