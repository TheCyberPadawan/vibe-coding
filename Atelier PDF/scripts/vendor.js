// Copie pdf.js, pdf-lib et tesseract.js (OCR) dans app/vendor pour que l'application marche sans internet.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nm = p => path.join(root, 'node_modules', p);
const out = path.join(root, 'app', 'vendor');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'pdfjs'), { recursive: true });
for (const f of ['pdf.min.mjs', 'pdf.worker.min.mjs'])
  fs.copyFileSync(nm(`pdfjs-dist/build/${f}`), path.join(out, 'pdfjs', f));
for (const d of ['cmaps', 'standard_fonts', 'wasm', 'iccs'])
  fs.cpSync(nm(`pdfjs-dist/${d}`), path.join(out, 'pdfjs', d), { recursive: true });
// Polices de l'interface, servies localement (plus aucun appel à Google Fonts)
const FONTS = [['Instrument Sans', 'instrument-sans', [400, 500, 600, 700]], ['IBM Plex Mono', 'ibm-plex-mono', [400, 500]], ['Dancing Script', 'dancing-script', [600]]];
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
// On reprend les règles @font-face des paquets (plages de caractères exactes), sous-ensembles latins seulement
let css = '';
for (const [family, pkg, weights] of FONTS) for (const w of weights) {
  const src = fs.readFileSync(nm(`@fontsource/${pkg}/${w}.css`), 'utf8');
  for (const rule of src.match(/@font-face\s*{[^}]*}/g) || []) {
    const file = (rule.match(/url\(\.\/files\/([^)]+\.woff2)\)/) || [])[1];
    if (!file || !/-latin(-ext)?-\d+-normal\.woff2$/.test(file)) continue;
    fs.copyFileSync(nm(`@fontsource/${pkg}/files/${file}`), path.join(out, 'fonts', file));
    const range = (rule.match(/unicode-range:\s*([^;}]+)/) || [])[1];
    css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(${file}) format("woff2")${range ? `;unicode-range:${range.trim()}` : ''}}\n`;
  }
}
fs.writeFileSync(path.join(out, 'fonts', 'fonts.css'), css);
fs.copyFileSync(nm('pdf-lib/dist/pdf-lib.min.js'), path.join(out, 'pdf-lib.min.js'));
// OCR : moteur (versions LSTM, WebAssembly intégré) et modèles français et anglais
const tess = path.join(out, 'tesseract');
fs.mkdirSync(path.join(tess, 'lang'), { recursive: true });
for (const f of ['tesseract.min.js', 'worker.min.js']) fs.copyFileSync(nm(`tesseract.js/dist/${f}`), path.join(tess, f));
for (const f of ['tesseract-core-simd-lstm.wasm.js', 'tesseract-core-lstm.wasm.js']) fs.copyFileSync(nm(`tesseract.js-core/${f}`), path.join(tess, f));
for (const l of ['fra', 'eng']) fs.copyFileSync(nm(`@tesseract.js-data/${l}/4.0.0_best_int/${l}.traineddata.gz`), path.join(tess, 'lang', `${l}.traineddata.gz`));
console.log('Bibliothèques copiées dans app/vendor');
