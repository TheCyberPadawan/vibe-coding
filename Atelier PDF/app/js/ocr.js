// Reconnaissance de texte (OCR) avec tesseract.js, entièrement hors ligne : moteur et modèles dans vendor/tesseract.
// La bibliothèque n'est chargée qu'à la première utilisation.
window.AtelierOCR = (() => {
'use strict';
const base = new URL('vendor/tesseract/', location.href).href;
let lib = null, worker = null, langs = '', report = null;

const loadLib = () => lib ??= new Promise((ok, ko) => {
  const s = document.createElement('script'); s.src = base + 'tesseract.min.js';
  s.onload = () => ok(window.Tesseract); s.onerror = () => ko(new Error('Moteur OCR introuvable : réinstallez l\'application.'));
  document.head.append(s);
});
async function getWorker(lang) {
  if (worker && langs === lang) return worker;
  if (worker) await worker.terminate();
  const T = await loadLib();
  worker = await T.createWorker(lang, 1, {   // 1 = LSTM seul, le moteur neuronal
    workerPath: base + 'worker.min.js', corePath: base, langPath: base + 'lang', gzip: true,
    cacheMethod: 'none', workerBlobURL: false, logger: m => report?.(m),
  });
  langs = lang;
  return worker;
}
// Mots reconnus sur une image : { text, conf, x0, y0, x1, y1, base0, base1 } en pixels (base* : ligne de base)
async function recognize(canvas, lang, onProgress) {
  const w = await getWorker(lang);
  report = m => { if (m.status === 'recognizing text') onProgress?.(m.progress); };
  try {
    const { data } = await w.recognize(canvas, {}, { text: false, blocks: true });
    const out = [];
    for (const b of data.blocks || []) for (const p of b.paragraphs) for (const l of p.lines) for (const wd of l.words) {
      const bl = l.baseline, at = x => bl && bl.x1 !== bl.x0 ? bl.y0 + (bl.y1 - bl.y0) * (x - bl.x0) / (bl.x1 - bl.x0) : wd.bbox.y1;
      out.push({ text: wd.text, conf: wd.confidence, ...wd.bbox, base0: at(wd.bbox.x0), base1: at(wd.bbox.x1), lineH: l.bbox.y1 - l.bbox.y0 });
    }
    return out;
  } finally { report = null; }
}
async function terminate() { if (worker) { await worker.terminate(); worker = null; langs = ''; } }

return { recognize, terminate };
})();
