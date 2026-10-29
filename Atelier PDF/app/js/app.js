(() => {
'use strict';
/* ---------- Icônes ---------- */
const ICONS = {
  open:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  merge:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  blank:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  minus:'<path d="M5 12h14"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  save:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  cursor:'<path d="M5 3l14 8-6 2-2 6z"/>',
  text:'<path d="M5 7V4h14v3M12 4v16M9 20h6"/>',
  pencil:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  marker:'<path d="M9 11l-5 5v4h4l5-5"/><path d="M15 5l4 4-6 6-4-4z"/><path d="M14 21h7"/>',
  eraser:'<path d="M8 20h12"/><path d="M5 15l9-9 5 5-9 9H9z"/><path d="M10 10l5 5"/>',
  redact:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9.5h10M7 14.5h6" stroke-width="3.2"/>',
  pen:'<path d="M3 17c3-4 5-1 7-4s3-7 6-6 1 6-2 9-2 5 1 5 4-2 6-3"/>',
  check:'<path d="M4 12l5 5L20 6"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  sign:'<path d="M3 16c2-6 4-10 6-10s-1 9 1 9 3-5 5-5-1 5 1 5 2-2 4-3"/><path d="M3 21h18"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  rotr:'<path d="M20 12a8 8 0 1 1-2.3-5.6L20 9"/><path d="M20 4v5h-5"/>',
  rotl:'<path d="M4 12a8 8 0 1 0 2.3-5.6L4 9"/><path d="M4 4v5h5"/>',
  form:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6M7 17h4"/>',
  pages:'<rect x="7" y="3" width="12" height="15" rx="1.5"/><path d="M5 7v12a2 2 0 0 0 2 2h9"/>',
  tools:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  caret:'<path d="m6 9 6 6 6-6"/>', up:'<path d="m6 15 6-6 6 6"/>', down:'<path d="m6 9 6 6 6-6"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  print:'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  underline:'<path d="M7 4v6a5 5 0 0 0 10 0V4M5 20h14"/>',
  strike:'<path d="M16 6.5C15 5 13.6 4 11.8 4 9.5 4 8 5.4 8 7.2c0 4 8.5 2.6 8.5 7.4 0 2-1.8 3.4-4.4 3.4-2 0-3.6-.9-4.6-2.5M4 12h16"/>',
  note:'<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h5"/>',
  rect:'<rect x="4" y="5" width="16" height="14" rx="1"/>', ellipse:'<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  line:'<path d="M5 19 19 5"/>', arrow:'<path d="M5 19 19 5M10 5h9v9"/>',
  stamp:'<path d="M9 3h6l-1 7h3a3 3 0 0 1 3 3v2H4v-2a3 3 0 0 1 3-3h3z"/><path d="M5 19h14"/>',
  ftext:'<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10v4M6 10h2M6 14h2"/>',
  fcheck:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  alignL:'<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4" rx="1"/><rect x="7" y="14" width="8" height="4" rx="1"/>',
  alignHC:'<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  alignR:'<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="8" height="4" rx="1"/>',
  alignT:'<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1"/><rect x="14" y="7" width="4" height="8" rx="1"/>',
  alignVC:'<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
  alignB:'<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="8" rx="1"/>',
  baseline:'<path d="M2 18h20" stroke-dasharray="2 2"/><path d="M4 18l3.5-11L11 18M5.2 14.5h4.6M14 18v-5.5a2.5 2.5 0 0 1 5 0V18"/>',
  distH:'<path d="M4 3v18M20 3v18"/><rect x="9" y="7" width="6" height="10" rx="1"/>',
  distV:'<path d="M3 4h18M3 20h18"/><rect x="7" y="9" width="10" height="6" rx="1"/>',
};
const icon = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------- Outils de la barre ---------- */
const TOOLS = {
  select: ['Sélection', 'cursor', 'v', 'Sélectionner, déplacer, redimensionner'],
  text: ['Texte', 'text', 't', 'Ajouter du texte'],
  edittext: ['Modifier texte', 'pencil', 'e', 'Remplacer un texte existant du PDF'],
  highlight: ['Surligner', 'marker', 'h', 'Surligner du texte ou une zone'],
  underline: ['Souligner', 'underline', 'u', 'Souligner du texte'],
  strike: ['Barrer', 'strike', 'k', 'Barrer du texte'],
  note: ['Note', 'note', 'n', 'Ajouter une note (commentaire)'],
  link: ['Lien', 'link', 'q', 'Créer un lien vers une page du document ou une adresse web'],
  rect: ['Rectangle', 'rect', 'g', 'Dessiner un rectangle'],
  ellipse: ['Ellipse', 'ellipse', null, 'Dessiner une ellipse'],
  line: ['Ligne', 'line', 'l', 'Tracer une ligne (Maj : angles de 45°)'],
  arrow: ['Flèche', 'arrow', 'a', 'Tracer une flèche (Maj : angles de 45°)'],
  draw: ['Dessin', 'pen', 'd', 'Dessin à main levée'],
  check: ['Coche', 'check', null, 'Cocher une case'],
  cross: ['Croix', 'x', null, 'Placer une croix'],
  signature: ['Signature', 'sign', 's', 'Signer'],
  image: ['Image', 'image', 'i', 'Insérer une image'],
  stamp: ['Tampon', 'stamp', 'p', 'Apposer un tampon (Approuvé, Confidentiel…)'],
  mask: ['Masquer', 'eraser', 'm', "Cacher une zone à l'écran : le contenu reste dans le fichier"],
  redact: ['Caviarder', 'redact', 'r', 'Caviarder : supprime définitivement le contenu de la zone'],
  ftext: ['Champ texte', 'ftext', 'f', 'Créer un champ de formulaire à remplir'],
  fcheck: ['Case à cocher', 'fcheck', null, 'Créer une case à cocher de formulaire'],
  crop: ['Recadrer', 'crop', null, 'Recadrer la page'],
};
const TOOLBAR = ['select', 'text', 'edittext', ['highlight', 'underline', 'strike'], 'note', 'link', ['rect', 'ellipse', 'line', 'arrow'], 'draw',
  ['check', 'cross'], 'signature', 'image', 'stamp', 'mask', 'redact', ['ftext', 'fcheck']];
const toolBtn = (t, extra = '') => { const [lbl, ic, key, tip] = TOOLS[t]; return `<button class="btn tool" data-tool="${t}" title="${tip}${key ? ` (${key.toUpperCase()})` : ''}" ${extra}>${icon(ic)}<span class="lbl">${lbl}</span></button>`; };
document.querySelector('#tools').innerHTML = TOOLBAR.map((t, gi) => Array.isArray(t)
  ? `<span class="tgroup" data-group="${gi}">${toolBtn(t[0])}<button class="caret" data-group="${gi}" aria-haspopup="menu" aria-label="Autres outils">${icon('caret')}</button></span>`
  : toolBtn(t)).join('');
document.querySelectorAll('i[data-icon]').forEach(i => { i.outerHTML = icon(i.dataset.icon); });

/* ---------- Outils de base ---------- */
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const PX = 96 / 72;                       // 100 % = taille réelle à l'écran
const uid = () => Math.random().toString(36).slice(2, 10);
const rad = d => d * Math.PI / 180;
const rot = ([x, y], d) => { const a = rad(d), c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const r2 = n => Math.round(n * 100) / 100;
const clone = o => JSON.parse(JSON.stringify(o));
function svgEl(tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
// Polices standard du PDF (r, b, i, bi : normal, gras, italique, gras italique) et polices intégrées (fichiers de fonts/)
const FONTS = {
  Helvetica: { label: 'Sans (Helvetica)', css: 'Helvetica, Arial, sans-serif', std: { r: 'Helvetica', b: 'HelveticaBold', i: 'HelveticaOblique', bi: 'HelveticaBoldOblique' } },
  Times: { label: 'Serif (Times)', css: '"Times New Roman", Times, serif', std: { r: 'TimesRoman', b: 'TimesRomanBold', i: 'TimesRomanItalic', bi: 'TimesRomanBoldItalic' } },
  Courier: { label: 'Machine (Courier)', css: '"Courier New", Courier, monospace', std: { r: 'Courier', b: 'CourierBold', i: 'CourierOblique', bi: 'CourierBoldOblique' } },
  InstrumentSerif: { label: 'Instrument Serif', css: '"Instrument Serif", Georgia, serif', files: { r: ['InstrumentSerif-Regular.ttf', 400], i: ['InstrumentSerif-Italic.ttf', 400] } },
  Manrope: { label: 'Manrope', css: 'Manrope, sans-serif', files: { r: ['Manrope-Regular.ttf', 400], b: ['Manrope-Bold.ttf', 700] } },
  ManropeLight: { label: 'Manrope léger', css: 'Manrope, sans-serif', files: { r: ['Manrope-Light.ttf', 300], b: ['Manrope-Medium.ttf', 500] } },
  FiraCode: { label: 'Fira Code', css: '"Fira Code", monospace', files: { r: ['FiraCode-Regular.ttf', 400], b: ['FiraCode-Medium.ttf', 500] } },
};
const fontOf = a => FONTS[a.font] || FONTS.Helvetica;
// Variante disponible la plus proche du style demandé
function faceOf(a) {
  const f = fontOf(a), set = f.std || f.files;
  const k = [(a.bold ? 'b' : '') + (a.italic ? 'i' : ''), a.bold ? 'b' : '', a.italic ? 'i' : '', 'r'].find(x => x && set[x]) || 'r';
  return f.std ? { std: set[k], weight: k.includes('b') ? 700 : 400, italic: k.includes('i') } : { file: set[k][0], weight: set[k][1], italic: k.includes('i') };
}
const hasFace = (font, k) => !!(FONTS[font]?.std || FONTS[font]?.files)?.[k];
const lhOf = a => (a.lh || 1.2) * a.size;   // distance entre deux lignes
const lsOf = a => (a.ls || 0) * a.size;     // espacement des lettres, en points
const cssFont = (a, px) => { const fc = faceOf(a); return `${fc.italic ? 'italic ' : ''}${fc.weight} ${px}px ${fontOf(a).css}`; };
const mctx = document.createElement('canvas').getContext('2d');
function measure(str, a) {
  mctx.font = cssFont(a, 100); mctx.letterSpacing = `${(a.ls || 0) * 100}px`;
  return mctx.measureText(str).width / 100 * a.size;
}
// Les polices intégrées doivent être chargées avant de mesurer ou d'afficher un texte
const fontsReady = document.fonts ? Promise.all(Object.values(FONTS).filter(f => f.files).flatMap(f => Object.entries(f.files)
  .map(([k, [, w]]) => document.fonts.load(`${k.includes('i') ? 'italic ' : ''}${w} 20px ${f.css}`).catch(() => {})))) : Promise.resolve();
// Lecture d'un fichier de l'application (XMLHttpRequest : fetch ne lit pas file:// dans Electron)
function appBytes(path) {
  return new Promise((ok, ko) => {
    const x = new XMLHttpRequest(); x.open('GET', path); x.responseType = 'arraybuffer';
    x.onload = () => x.response && (x.status === 200 || x.status === 0) ? ok(new Uint8Array(x.response)) : ko(new Error(`${path} introuvable`));
    x.onerror = () => ko(new Error(`${path} introuvable`)); x.send();
  });
}
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

/* ---------- État ---------- */
const S = {
  sources: [], pages: [], zoom: 1, tool: 'select', sel: null, fileName: '', undo: [], redo: [], dirty: false, form: {}, cur: 0,
  style: {
    text: { font: 'Helvetica', bold: false, italic: false, size: 12, lh: 1.2, ls: 0, color: '#111111' },
    ink: { color: '#1a3fb8', width: 2, mark: 12 },
    highlight: { color: '#ffd84d' },
    mask: { color: '#ffffff' },
    redact: { color: '#000000' },
    erase: { color: '#ffffff' },
    underline: { color: '#1f8a4c' },
    strike: { color: '#d0312d' },
    shape: { stroke: '#d0312d', fill: '', width: 2, rx: 0 },
    note: { color: '#ffd84d' },
    stamp: { text: 'APPROUVÉ', color: '#1f8a4c', date: true },
  },
  pendingSig: null, pendingImg: null,
  groupSel: {},                 // outil affiché par chaque groupe de la barre
  find: { q: '', hits: [], cur: -1 },
  decor: {},                    // en-tête, pied de page, numéros, filigrane (appliqués à toutes les pages)
  meta: {},                     // titre, auteur, sujet, mots-clés
  protect: null,                // { user, owner, perms } : chiffrement à l'enregistrement
};
const V = new Map();   // id de page -> vue affichée
let io = null, tio = null, ED = null, propsKey = '';

/* ---------- Bibliothèques ---------- */
const LIBS_OK = !!(window.pdfjsLib && window.PDFLib);
const PDFJS_BASE = new URL('vendor/pdfjs/', location.href).href;
const workerReady = (async () => { if (LIBS_OK) pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs'; })();
if (!LIBS_OK) $('#libNote').textContent = "Les composants PDF sont introuvables. Réinstallez l'application.";

/* ---------- Interface : messages ---------- */
let toastT;
function toast(msg, ms = 3500) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }
function busy(on, txt) { $('#busy').hidden = !on; if (txt) $('#busyText').textContent = txt; }

/* ---------- Boîte de dialogue générique ---------- */
// html : contenu du formulaire ; validate(data, body) renvoie un message d'erreur ou rien ; résout null si annulé
function ask({ title, html, ok = 'OK', cancel = 'Annuler', validate, init, wide }) {
  return new Promise(resolve => {
    const dlg = $('#dlg'), form = $('#dlgForm'), body = $('#dlgBody');
    $('#dlgTitle').textContent = title; body.innerHTML = html; $('#dlgErr').textContent = '';
    $('#dlgOk').textContent = ok || ''; $('#dlgOk').hidden = !ok; $('#dlgCancel').textContent = cancel;
    dlg.style.width = wide ? 'min(820px, calc(100% - 32px))' : '';
    body.querySelectorAll('i[data-icon]').forEach(i => { i.outerHTML = icon(i.dataset.icon); });
    init?.(body);
    const finish = v => { form.onsubmit = null; dlg.onclose = null; if (dlg.open) dlg.close(); resolve(v); };
    form.onsubmit = async e => {
      if (e.submitter?.value !== 'ok') return;
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      form.querySelectorAll('input[type=checkbox][name]').forEach(c => { data[c.name] = c.checked; });
      const btn = $('#dlgOk'); btn.disabled = true;
      try {
        const err = validate ? await validate(data, body) : null;
        if (err) { $('#dlgErr').textContent = err; return; }
        finish(data);
      } catch (x) { console.error(x); $('#dlgErr').textContent = x.message || String(x); }
      finally { btn.disabled = false; }
    };
    dlg.onclose = () => { form.onsubmit = null; dlg.onclose = null; resolve(null); };
    dlg.showModal();
    setTimeout(() => body.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea')?.focus(), 0);
  });
}
const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Chargement des documents ---------- */
async function loadSource(bytes, name) {
  await workerReady;
  let security = null, password = '';
  if (AtelierCrypt.isEncrypted(bytes)) {   // déchiffré une fois pour toutes : pdf-lib ne sait pas lire un PDF chiffré
    for (let wrong = false; ;) {
      try { const r = await AtelierCrypt.decrypt(bytes, password); bytes = r.bytes; security = r.info && { ...r.info, password }; break; }
      catch (e) {
        if (e.code !== 'password') throw e;
        const d = await ask({
          title: 'Document protégé', ok: 'Ouvrir',
          html: `<p class="small" style="margin:0">« ${escHtml(name)} » est protégé par un mot de passe.</p>
            <label class="f">Mot de passe<input type="password" name="pw" autocomplete="current-password"></label>
            ${wrong ? '<p class="small" style="margin:0;color:var(--danger)">Mot de passe incorrect.</p>' : ''}`,
        });
        if (!d) throw Object.assign(new Error('Ouverture annulée'), { name: 'Cancelled' });
        password = d.pw; wrong = true;
      }
    }
  }
  // Ajouts d'un précédent enregistrement par Atelier PDF : retirés de la page, ils redeviennent modifiables
  let layers = null;
  try { const l = await AtelierLayer.read(bytes); if (l) { bytes = l.bytes; layers = l.layers; } }
  catch (e) { console.warn('Calque modifiable ignoré', e); }
  const pdf = await openPdfjs(bytes);
  const src = { id: S.sources.length, name, bytes, pdf, pageCache: new Map(), security, outline: [], layers };
  try { src.outline = await loadOutline(pdf); } catch (e) { console.warn('Signets illisibles', e); }
  S.sources.push(src);
  return src;
}
async function loadOutline(pdf) {
  const conv = list => Promise.all((list || []).map(async it => {
    let idx = null;
    try {
      let d = it.dest; if (typeof d === 'string') d = await pdf.getDestination(d);
      if (Array.isArray(d)) idx = typeof d[0] === 'number' ? d[0] : await pdf.getPageIndex(d[0]);
    } catch {}
    return { title: it.title, idx, items: await conv(it.items) };
  }));
  return conv(await pdf.getOutline());
}
function getPdfPage(p) {
  const src = S.sources[p.src];
  if (!src.pageCache.has(p.idx)) src.pageCache.set(p.idx, src.pdf.getPage(p.idx + 1));
  return src.pageCache.get(p.idx);
}
const newPage = (src, idx) => ({ id: uid(), src, idx, rot: 0, annots: [] });

function readAsDataURL(file) { return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(file); }); }
function loadImg(src) { return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; }); }
async function normalizeImage(file) {
  let url = await readAsDataURL(file); const img = await loadImg(url);
  if (!/^data:image\/(png|jpeg)/.test(url)) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0); url = c.toDataURL('image/png');
  }
  return { src: url, w: img.naturalWidth, h: img.naturalHeight };
}
/* ---------- Image dans un cadre : image complète (a.orig) + cadrage (a.fit) -> image affichée (a.src) ---------- */
// a.fit = { cx, cy, zoom } : centre du cadrage en proportion de l'image complète, zoom ≥ 1 (1 = la plus grande partie
// de l'image qui remplit le cadre). a.src est l'image recadrée, celle qui est dessinée dans le PDF.
const ORIG_MAX = 2400;   // côté maximal de l'image complète conservée (pixels)
const imgCache = new Map();
const imgOf = src => { if (!imgCache.has(src)) imgCache.set(src, loadImg(src)); return imgCache.get(src); };
function cropOf(a, iw, ih) {
  const fr = a.w / a.h, f = a.fit || { cx: 0.5, cy: 0.5, zoom: 1 };
  const z = Math.min(8, Math.max(1, f.zoom || 1)), cw = Math.min(iw, ih * fr) / z, ch = cw / fr;
  const cx = Math.min(iw - cw / 2, Math.max(cw / 2, f.cx * iw)), cy = Math.min(ih - ch / 2, Math.max(ch / 2, f.cy * ih));
  return { x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch, cx: cx / iw, cy: cy / ih, zoom: z };
}
// Recalcule l'image affichée ; maxPx : largeur maximale (aperçu rapide pendant le cadrage, 300 ppp sinon)
async function bakeImage(a, maxPx) {
  const img = await imgOf(a.orig), iw = img.naturalWidth, ih = img.naturalHeight, c0 = cropOf(a, iw, ih);
  a.fit = { cx: c0.cx, cy: c0.cy, zoom: c0.zoom };   // cadrage ramené dans les limites de l'image
  const k = Math.min(1, (maxPx || a.w * 300 / 72) / c0.w), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(c0.w * k)); c.height = Math.max(1, Math.round(c0.h * k));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(img, c0.x, c0.y, c0.w, c0.h, 0, 0, c.width, c.height);
  a.src = a.orig.startsWith('data:image/png') ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', maxPx ? 0.8 : 0.9);
}
// Nouvelle image dans le cadre d'une image existante : centrée, aux proportions du cadre (comme « remplir ») ;
// le cadrage s'ajuste ensuite par double-clic. PNG conservé (transparence), sinon JPEG.
async function replaceImage(a, file) {
  const im = await normalizeImage(file), img = await loadImg(im.src);
  const k = Math.min(1, ORIG_MAX / Math.max(im.w, im.h)), c = document.createElement('canvas');
  c.width = Math.round(im.w * k); c.height = Math.round(im.h * k);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
  snapshot();
  a.orig = im.src.startsWith('data:image/png') ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9);
  a.fit = { cx: 0.5, cy: 0.5, zoom: 1 };
  await bakeImage(a);
}
async function embedImage(doc, src) { return src.startsWith('data:image/jpeg') ? doc.embedJpg(src) : doc.embedPng(src); }

async function imagesToPdfBytes(files) {
  const doc = await PDFLib.PDFDocument.create();
  for (const f of files) {
    const im = await normalizeImage(f); const emb = await embedImage(doc, im.src);
    const k = 842 / Math.max(im.w, im.h), W = im.w * k, H = im.h * k;
    doc.addPage([W, H]).drawImage(emb, { x: 0, y: 0, width: W, height: H });
  }
  return doc.save();
}

function resetDoc() {
  S.sources = []; S.pages = []; S.undo = []; S.redo = []; S.form = {}; S.sel = null; S.dirty = false; S.cur = 0; propsKey = '';
  S.find = { q: '', hits: [], cur: -1 }; S.decor = {}; S.meta = {}; S.protect = null; S.clean = null; S.diff = null; S.metaEdited = false;
}

// replace : nouveau document ; sinon ajout à la position at (fin du document par défaut)
async function addFiles(fileList, replace, dir, at) {
  if (!LIBS_OK) return toast('Les composants PDF ne sont pas chargés. Vérifiez votre connexion et rechargez la page.');
  const files = [...fileList]; if (!files.length) return;
  const pdfs = files.filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
  const imgs = files.filter(f => /^image\//.test(f.type));
  if (!pdfs.length && !imgs.length) return toast('Format non pris en charge. Choisissez un PDF, un JPG ou un PNG.');
  if (replace && S.dirty && !confirm('Vos modifications non enregistrées seront perdues. Continuer ?')) return;
  busy(true, 'Ouverture…');
  const saved = { sources: S.sources.length };
  try {
    const before = serialize();
    if (replace) resetDoc();
    at = replace ? 0 : at ?? S.pages.length;
    const added = [];
    for (const f of pdfs) {
      const src = await loadSource(new Uint8Array(await f.arrayBuffer()), f.name);
      const own = [];
      for (let i = 0; i < src.pdf.numPages; i++) {
        const pg = newPage(src.id, i);
        pg.annots = (src.layers?.get(i) || []).map(a => a.type === 'text' && !FONTS[a.font] ? { ...a, font: 'Helvetica' } : a);
        own.push(pg); added.push(pg);
      }
      // Liens internes des textes : de la position de page enregistrée à la page ouverte
      for (const pg of own) for (const a of pg.annots) if (a.link?.kind === 'page') {
        const t = own[a.link.index];
        if (t) a.link = { kind: 'page', page: t.id }; else delete a.link;
      }
      if (src.layers) setTimeout(() => toast('Les éléments ajoutés avec Atelier PDF sont de nouveau modifiables : déplacez-les, copiez-les ou double-cliquez sur un texte.', 6000), 300);
    }
    if (imgs.length) {
      const src = await loadSource(await imagesToPdfBytes(imgs), imgs[0].name);
      for (let i = 0; i < src.pdf.numPages; i++) added.push(newPage(src.id, i));
    }
    if (!replace) { S.undo.push(before); S.redo = []; S.dirty = true; }
    S.pages.splice(at, 0, ...added);
    if (replace) {
      S.fileName = files[0].name.replace(/\.[^.]+$/, ''); S.dir = dir ?? window.desktop?.dirOf(files[0]) ?? '';
      const src = S.sources[0];
      try {
        const i = (await src.pdf.getMetadata()).info || {};
        S.meta = { title: i.Title || '', author: i.Author || '', subject: i.Subject || '', keywords: i.Keywords || '', creator: i.Creator || '', producer: i.Producer || '', created: i.CreationDate || '', modified: i.ModDate || '', version: i.PDFFormatVersion || '' };
      } catch {}
      // Un document ouvert avec son mot de passe reste protégé à l'enregistrement (modifiable dans Outils)
      if (src.security?.password) S.protect = { user: src.security.password, owner: '', perms: src.security.perms };
      else if (src.security && Object.values(src.security.perms).some(v => !v))
        setTimeout(() => toast("Ce PDF comporte des restrictions définies par son auteur (impression, copie ou modification). Atelier PDF les retire à l'enregistrement : respectez les droits de l'auteur.", 9000), 400);
      await fitZoom();
    }
    await rebuild();
    if (!replace) { toast(`${added.length} page${added.length > 1 ? 's ajoutées' : ' ajoutée'}${at >= S.pages.length - added.length ? ' à la fin du document' : ` après la page ${at}`}.`); scrollToPage(at); }
  } catch (e) {
    S.sources.length = Math.max(saved.sources, replace ? 0 : saved.sources);
    if (e?.name === 'Cancelled') return;
    console.error(e);
    if (e?.code === 'handler') toast('Ce PDF est protégé par un certificat ou un système de gestion des droits : il ne peut pas être ouvert ici.', 7000);
    else toast("Impossible d'ouvrir ce fichier. Il est peut-être endommagé.", 5000);
  } finally { busy(false); }
}

/* ---------- Affichage des pages ---------- */
let buildSeq = 0;
async function rebuild() {
  commitEditor();
  const seq = ++buildSeq;
  const ws = $('#workspace');
  const ratio = ws.scrollHeight > ws.clientHeight ? ws.scrollTop / ws.scrollHeight : 0;
  const frag = document.createDocumentFragment(); const nv = new Map();
  for (const [i, p] of S.pages.entries()) {
    const pg = await getPdfPage(p); if (seq !== buildSeq) return;
    const rotation = ((pg.rotate || 0) + p.rot) % 360;
    const vp = pg.getViewport({ scale: S.zoom * PX, rotation });
    const wrap = document.createElement('div'); wrap.className = 'pagewrap'; wrap.dataset.id = p.id;
    const el = document.createElement('div'); el.className = 'page'; el.style.width = vp.width + 'px'; el.style.height = vp.height + 'px';
    const canvas = document.createElement('canvas');
    const svg = svgEl('svg', { class: 'overlay', width: vp.width, height: vp.height });
    const g = svgEl('g', { transform: `matrix(${vp.transform.join(' ')})` }); svg.append(g);
    const forms = document.createElement('div'); forms.className = 'forms';
    el.append(canvas, forms, svg);
    const label = document.createElement('div'); label.className = 'plabel'; label.textContent = `${i + 1} / ${S.pages.length}`;
    wrap.append(el, label);
    const view = { p, pg, vp, el, canvas, svg, g, forms, wrap, rotation, rendered: false, task: null, text: null };
    el.addEventListener('pointerdown', e => {   // clic dans le vide : désélectionne, ou tire un cadre de sélection
      if (S.tool !== 'select' || e.button !== 0 || e.target.closest('.annot, [data-handle], .forms > *, textarea')) return;
      commitEditor();
      const extend = e.shiftKey || e.ctrlKey || e.metaKey, keep = extend && S.sel?.pid === p.id ? selIds() : [];
      if (!extend) setSel(null);
      marquee(e, view, keep);
    });
    svg.addEventListener('pointerdown', e => onDown(e, view));
    svg.addEventListener('mousedown', e => e.preventDefault());   // garde le focus dans l'éditeur de texte
    svg.addEventListener('pointermove', e => onHover(e, view));
    svg.addEventListener('pointerleave', () => clearHover(view));
    svg.addEventListener('dblclick', e => onDbl(e, view));
    svg.addEventListener('wheel', e => {   // molette pendant le cadrage d'une image : zoom
      if (!CROP || CROP.v !== view || e.ctrlKey) return;
      e.preventDefault(); e.stopPropagation(); setCropFit({ zoom: CROP.a.fit.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1) }); updateProps(true);
    }, { passive: false });
    nv.set(p.id, view); frag.append(wrap);
  }
  io?.disconnect(); V.clear(); nv.forEach((v, k) => V.set(k, v));
  $('#pages').replaceChildren(frag);
  io = new IntersectionObserver(es => es.forEach(en => {
    const v = V.get(en.target.dataset.id); if (!v) return;
    if (en.isIntersecting) renderView(v); else releaseView(v);
  }), { root: ws, rootMargin: '900px 0px' });
  V.forEach(v => { drawAnnots(v); io.observe(v.wrap); });
  $('#empty').hidden = S.sources.length > 0;
  ws.scrollTop = ratio * ws.scrollHeight;
  renderThumbs(); updateUI(); updateProps(true); trackPage(); renderComments();
  if (!$('#outline').hidden) renderOutline();
}
async function renderView(v) {
  if (v.rendered) return; v.rendered = true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), c = v.canvas;
  c.width = Math.floor(v.vp.width * dpr); c.height = Math.floor(v.vp.height * dpr);
  c.style.width = v.vp.width + 'px'; c.style.height = v.vp.height + 'px';
  try {
    v.task = v.pg.render({ canvasContext: c.getContext('2d'), viewport: v.vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
      annotationMode: pdfjsLib.AnnotationMode.ENABLE_FORMS });
    await v.task.promise;
  } catch (e) { if (e?.name !== 'RenderingCancelledException') console.error(e); }
  v.task = null;
  if (v.rendered) renderForms(v);
}
function releaseView(v) {
  if (!v.rendered) return;
  v.rendered = false; try { v.task?.cancel(); } catch {}
  v.canvas.width = 0; v.canvas.height = 0; v.forms.replaceChildren();
}

/* ---------- Formulaires ---------- */
async function renderForms(v) {
  let anns; try { anns = await v.pg.getAnnotations({ intent: 'display' }); } catch { return; }
  v.forms.replaceChildren();
  const s = v.vp.scale;
  for (const an of anns) {
    if (an.subtype !== 'Widget' || !an.fieldName || an.hidden) continue;
    const key = `${v.p.src}:${an.fieldName}`;
    const [x1, y1, x2, y2] = an.rect;
    const a = v.vp.convertToViewportPoint(x1, y1), b = v.vp.convertToViewportPoint(x2, y2);
    const L = Math.min(a[0], b[0]), T = Math.min(a[1], b[1]), W = Math.abs(a[0] - b[0]), H = Math.abs(a[1] - b[1]);
    let el, get;
    if (an.fieldType === 'Tx') {
      el = document.createElement(an.multiLine ? 'textarea' : 'input');
      el.value = key in S.form ? S.form[key] : (an.fieldValue ?? '');
      if (an.maxLen) el.maxLength = an.maxLen;
      const fs = (an.defaultAppearanceData?.fontSize || 0) * s || Math.min(H * 0.68, 13 * s);
      el.style.fontSize = Math.max(7, fs) + 'px'; el.style.fontFamily = 'Helvetica, Arial, sans-serif';
      if (an.textAlignment === 1) el.style.textAlign = 'center'; else if (an.textAlignment === 2) el.style.textAlign = 'right';
      get = () => el.value;
    } else if (an.fieldType === 'Btn' && an.checkBox) {
      el = document.createElement('input'); el.type = 'checkbox';
      el.checked = key in S.form ? !!S.form[key] : !!(an.fieldValue && an.fieldValue !== 'Off');
      get = () => el.checked;
    } else if (an.fieldType === 'Btn' && an.radioButton) {
      el = document.createElement('input'); el.type = 'radio'; el.name = 'r_' + key;
      el.checked = (key in S.form ? S.form[key] : an.fieldValue) === an.buttonValue;
      get = () => an.buttonValue;
    } else if (an.fieldType === 'Ch') {
      el = document.createElement('select');
      if (!an.combo && an.multiSelect) el.multiple = true;
      const cur = key in S.form ? S.form[key] : an.fieldValue;
      const curs = Array.isArray(cur) ? cur : [cur];
      if (an.combo) el.append(new Option('', ''));
      for (const o of an.options || []) { const op = new Option(o.displayValue, o.exportValue); op.selected = curs.includes(o.exportValue); el.append(op); }
      el.style.fontSize = Math.max(8, Math.min(H * 0.6, 13 * s)) + 'px';
      get = () => el.multiple ? [...el.selectedOptions].map(o => o.value) : el.value;
    } else continue;
    Object.assign(el.style, { left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px' });
    if (an.readOnly) el.disabled = true;
    el.title = an.alternativeText || an.fieldName;
    el.addEventListener(el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
      S.form[key] = get(); S.dirty = true; updateUI();
      if (el.type === 'checkbox') v.forms.querySelectorAll('input[type=checkbox]').forEach(o => { if (o !== el && o.title === el.title && o.dataset.k === key) o.checked = el.checked; });
    });
    el.dataset.k = key;
    v.forms.append(el);
  }
}
function applyForm(doc, srcId) {
  const entries = Object.entries(S.form).filter(([k]) => +k.split(':')[0] === srcId);
  if (!entries.length) return false;
  let form; try { form = doc.getForm(); } catch { return false; }
  for (const [k, val] of entries) {
    const name = k.slice(k.indexOf(':') + 1);
    try {
      const f = form.getField(name);
      if (f instanceof PDFLib.PDFTextField) f.setText(String(val ?? ''));
      else if (f instanceof PDFLib.PDFCheckBox) val ? f.check() : f.uncheck();
      else if (f instanceof PDFLib.PDFRadioGroup) f.select(val);
      else if (f instanceof PDFLib.PDFDropdown) val ? f.select(val) : f.clear();
      else if (f instanceof PDFLib.PDFOptionList) f.select(val);
    } catch (e) { console.warn('Champ', name, e); }
  }
  return true;
}

/* ---------- Annotations : dessin ---------- */
const NOTE = 18;                                   // côté de l'icône d'une note, en points
const BOXED = new Set(['rect', 'image', 'shape', 'field', 'link']);
const linePad = a => a.width / 2 + (a.arrow ? Math.max(8, a.width * 4) : 3);
function frameOf(a) { return a.type === 'ink' || a.type === 'line' ? { x: 0, y: 0, r: 0 } : { x: a.x, y: a.y, r: a.r || 0 }; }
function localBox(a) {
  if (BOXED.has(a.type)) return { x0: 0, y0: 0, x1: a.w, y1: a.h };
  if (a.type === 'note') return { x0: 0, y0: 0, x1: NOTE, y1: NOTE };
  if (a.type === 'ocr') return { x0: 0, y0: -a.fs * 0.25, x1: a.w, y1: a.fs };
  if (a.type === 'text') {
    const lines = a.text.split('\n'), lh = lhOf(a);
    const w = Math.max(a.size * 0.4, ...lines.map(l => measure(l, a)));
    return { x0: -2, y0: -(lines.length - 1) * lh - a.size * 0.3, x1: w + 2, y1: a.size * 0.95 };
  }
  if (a.type === 'line') { const p = linePad(a); return { x0: Math.min(a.x1, a.x2) - p, y0: Math.min(a.y1, a.y2) - p, x1: Math.max(a.x1, a.x2) + p, y1: Math.max(a.y1, a.y2) + p }; }
  const pts = a.strokes.flat(), pad = a.width / 2 + 2;
  return { x0: Math.min(...pts.map(p => p[0])) - pad, y0: Math.min(...pts.map(p => p[1])) - pad,
           x1: Math.max(...pts.map(p => p[0])) + pad, y1: Math.max(...pts.map(p => p[1])) + pad };
}
// Pointe de flèche : sommet, base gauche, base droite ; la ligne s'arrête à la base
function arrowHead(a) {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), L = Math.max(8, a.width * 4), W = L * 0.5;
  const c = Math.cos(ang), s = Math.sin(ang), bx = a.x2 - L * c, by = a.y2 - L * s;
  return { tip: [a.x2, a.y2], l: [bx - W * s, by + W * c], r: [bx + W * s, by - W * c], base: [bx, by] };
}
// Rectangle aux coins arrondis : rayon limité à la moitié du plus petit côté
const radiusOf = a => a.kind === 'rect' && a.rx > 0 ? Math.min(a.rx, a.w / 2, a.h / 2) : 0;
// Tracé SVG du rectangle (origine en bas à gauche, axe y de pdf-lib inversé), arcs approchés par des courbes de Bézier
function roundRectPath(w, h, r) {
  const k = r * 0.4477;   // 1 - 0,5523 : point de contrôle d'un quart de cercle
  return `M${r} 0H${w - r}C${w - k} 0 ${w} ${-k} ${w} ${-r}V${-(h - r)}C${w} ${-(h - k)} ${w - k} ${-h} ${w - r} ${-h}`
    + `H${r}C${k} ${-h} 0 ${-(h - k)} 0 ${-(h - r)}V${-r}C0 ${-k} ${k} 0 ${r} 0Z`;
}
const markLine = a => a.kind === 'underline' ? a.h * 0.14 : a.h * 0.5;   // hauteur du trait dans la boîte
const markWidth = a => Math.max(0.8, a.h * 0.075);
function annotNode(a, cls = 'annot') {
  const g = svgEl('g', a.id ? { 'data-aid': a.id, class: cls } : { class: cls });
  const fr = frameOf(a);
  const t = svgEl('g', { transform: `translate(${fr.x} ${fr.y}) rotate(${fr.r})` }); g.append(t);
  if (a.type === 'rect') {
    if (a.kind === 'underline' || a.kind === 'strike') {
      t.append(svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: 'transparent' }));
      t.append(svgEl('line', { x1: 0, x2: a.w, y1: markLine(a), y2: markLine(a), stroke: a.color, 'stroke-width': markWidth(a) }));
    } else {
      const pending = a.kind === 'redact' && !a.erase;   // zone à caviarder : on laisse deviner ce qu'elle couvre
      t.append(svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: a.color, 'fill-opacity': a.kind === 'highlight' ? 0.4 : pending ? 0.82 : 1 }));
      if (pending) t.append(svgEl('rect', { class: 'redactmark', x: 0, y: 0, width: a.w, height: a.h, fill: 'none', 'stroke-width': 1.5, 'stroke-dasharray': '6 3', 'vector-effect': 'non-scaling-stroke' }));
    }
  } else if (a.type === 'shape') {
    const at = { stroke: a.stroke && a.width ? a.stroke : 'none', 'stroke-width': a.width, fill: a.fill || 'transparent' };   // sans contour : stroke vide ou épaisseur 0
    t.append(a.kind === 'ellipse' ? svgEl('ellipse', { cx: a.w / 2, cy: a.h / 2, rx: a.w / 2, ry: a.h / 2, ...at })
      : svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, rx: radiusOf(a), ...at }));
  } else if (a.type === 'line') {
    const end = a.arrow ? arrowHead(a).base : [a.x2, a.y2];
    t.append(svgEl('line', { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2, stroke: 'transparent', 'stroke-width': Math.max(a.width, 10) }));
    t.append(svgEl('line', { x1: a.x1, y1: a.y1, x2: end[0], y2: end[1], stroke: a.stroke, 'stroke-width': a.width, 'stroke-linecap': a.arrow ? 'butt' : 'round' }));
    if (a.arrow) { const h = arrowHead(a); t.append(svgEl('polygon', { points: [h.tip, h.l, h.r].map(p => p.join(',')).join(' '), fill: a.stroke })); }
  } else if (a.type === 'note') {
    t.append(svgEl('path', { d: `M2 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 5V0l5 5z`, fill: a.color, stroke: '#7a6a1c', 'stroke-width': 0.8 }));
    t.append(svgEl('path', { d: 'M4 14.5h10M4 11.5h10M4 8.5h6', stroke: '#5a4e14', 'stroke-width': 1, 'stroke-linecap': 'round' }));
  } else if (a.type === 'link') {
    t.append(svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: 'rgba(31,115,216,.10)', stroke: '#1f73d8', 'stroke-width': 1.2, 'stroke-dasharray': '2 2', 'vector-effect': 'non-scaling-stroke' }));
    const tx = svgEl('text', { class: 'fieldlabel', transform: `translate(2 ${Math.max(2, a.h - 8)}) scale(1 -1)` });
    tx.textContent = linkLabel(a); t.append(tx);
  } else if (a.type === 'field') {
    t.append(svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: 'rgba(31,115,216,.08)', stroke: '#1f73d8', 'stroke-width': 1, 'stroke-dasharray': '4 2', 'vector-effect': 'non-scaling-stroke' }));
    if (a.kind === 'check') t.append(svgEl('path', { d: `M${a.w * 0.22} ${a.h * 0.52}l${a.w * 0.2} ${-a.h * 0.22} ${a.w * 0.36} ${a.h * 0.42}`, fill: 'none', stroke: 'rgba(31,115,216,.5)', 'stroke-width': 1.2 }));
    else { const tx = svgEl('text', { class: 'fieldlabel', transform: `translate(3 ${a.h - 9}) scale(1 -1)` }); tx.textContent = a.name; t.append(tx); }
  } else if (a.type === 'image') {
    if (CROP && CROP.a === a) cropNodes(t, a);
    else t.append(svgEl('image', { href: a.src, x: 0, y: -a.h, width: a.w, height: a.h, transform: 'scale(1 -1)', preserveAspectRatio: 'none' }));
  } else if (a.type === 'text') {
    const b = localBox(a);
    t.append(svgEl('rect', { x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0, fill: 'transparent' }));
    a.text.split('\n').forEach((ln, i) => {
      const fc = faceOf(a), tx = svgEl('text', { transform: `translate(0 ${-i * lhOf(a)}) scale(1 -1)`, 'font-size': a.size,
        'font-family': fontOf(a).css, 'font-weight': fc.weight, 'font-style': fc.italic ? 'italic' : 'normal', 'letter-spacing': lsOf(a), fill: a.color, style: 'white-space:pre' });
      if (a.opacity != null) tx.setAttribute('fill-opacity', a.opacity);
      tx.textContent = ln; t.append(tx);
      // Texte avec un lien : souligné en pointillé dans l'éditeur (pas dans le PDF)
      if (a.link && ln) t.append(svgEl('line', { class: 'textlink', x1: 0, x2: measure(ln, a), y1: -i * lhOf(a) - a.size * 0.14, y2: -i * lhOf(a) - a.size * 0.14, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
    });
  } else if (a.type === 'ink') {
    for (const st of a.strokes) {
      const pts = st.map(p => p.join(',')).join(' ');
      if (st.length === 1) { t.append(svgEl('circle', { cx: st[0][0], cy: st[0][1], r: a.width / 2, fill: a.color })); continue; }
      t.append(svgEl('polyline', { points: pts, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(a.width, 8), 'stroke-linecap': 'round' }));
      t.append(svgEl('polyline', { points: pts, fill: 'none', stroke: a.color, 'stroke-width': a.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
  }
  return g;
}
function drawAnnots(v) {
  v.g.replaceChildren();
  const i = S.pages.indexOf(v.p);
  for (const d of decorFor(v.p, i, S.pages.length, v.pg.view, v.rotation)) v.g.append(annotNode(d, 'decor'));
  for (const a of v.p.annots) {
    const n = annotNode(a);
    if (ED && ED.a === a) n.setAttribute('visibility', 'hidden');
    v.g.append(n);
  }
  if (v.p.crop) {   // zone hors recadrage assombrie
    const [x0, y0, x1, y1] = v.pg.view, c = v.p.crop;
    v.g.append(svgEl('path', { class: 'cropshade', 'fill-rule': 'evenodd', d: `M${x0} ${y0}H${x1}V${y1}H${x0}Z M${c.x0} ${c.y0}H${c.x1}V${c.y1}H${c.x0}Z` }));
    v.g.append(svgEl('rect', { class: 'cropline', x: c.x0, y: c.y0, width: c.x1 - c.x0, height: c.y1 - c.y0, 'stroke-width': 1.5, 'stroke-dasharray': '6 4', 'vector-effect': 'non-scaling-stroke' }));
  }
  S.find.hits.forEach((h, k) => {
    if (h.pid !== v.p.id) return;
    const n = svgEl('rect', { class: 'hit' + (k === S.find.cur ? ' cur' : ''), x: 0, y: 0, width: h.w, height: h.h, transform: `translate(${h.x} ${h.y}) rotate(${h.r})`, 'vector-effect': 'non-scaling-stroke' });
    v.g.append(n);
  });
  for (const h of S.diff || []) if (h.pid === v.p.id) v.g.append(svgEl('rect', { class: 'diff-add', x: 0, y: 0, width: h.w, height: h.h, transform: `translate(${h.x} ${h.y}) rotate(${h.r})` }));
  const sel = S.sel && S.sel.pid === v.p.id ? selAnnots() : [];
  for (const a of sel) {   // poignées seulement quand un seul élément est sélectionné
    if ((ED && ED.a === a) || (CROP && CROP.a === a)) continue;
    const b = localBox(a), fr = frameOf(a), hr = 6 / v.vp.scale, one = sel.length === 1;
    const sg = svgEl('g', { class: 'selbox', transform: `translate(${fr.x} ${fr.y}) rotate(${fr.r})` });
    const handle = (cx, cy, k) => sg.append(svgEl('circle', { class: 'handle', 'data-handle': k, cx, cy, r: hr, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
    if (a.type === 'line' && one) { handle(a.x1, a.y1, '0'); handle(a.x2, a.y2, '1'); }
    else {
      sg.append(svgEl('rect', { x: b.x0 - 2, y: b.y0 - 2, width: b.x1 - b.x0 + 4, height: b.y1 - b.y0 + 4, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', 'vector-effect': 'non-scaling-stroke' }));
      if (one && BOXED.has(a.type)) handle(b.x1, b.y0, '1');
    }
    v.g.append(sg);
  }
  // Repères d'alignement pendant un déplacement, cadre de sélection tiré à la souris
  for (const l of v.guides || []) {
    if (l.gap) { const [x0, y0, x1, y1] = l.gap; v.g.append(svgEl('rect', { class: 'gapmark', x: x0, y: y0, width: x1 - x0, height: y1 - y0, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })); }
    else v.g.append(svgEl('line', { class: 'guide', x1: l[0], y1: l[1], x2: l[2], y2: l[3], 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
  }
  if (v.marquee) { const m = v.marquee; v.g.append(svgEl('rect', { class: 'marquee', x: m.x0, y: m.y0, width: m.x1 - m.x0, height: m.y1 - m.y0, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' })); }
}
const redraw = pid => { const v = V.get(pid); if (v) drawAnnots(v); };
const redrawAll = () => V.forEach(drawAnnots);

/* ---------- Sélection & outils ---------- */
function selAnnot() { if (!S.sel) return null; const p = S.pages.find(x => x.id === S.sel.pid); return p?.annots.find(a => a.id === S.sel.aid) || null; }
function setSel(pid, aid) {
  const prev = S.sel?.pid; S.sel = pid ? { pid, aid } : null;
  if (prev) redraw(prev); if (pid && pid !== prev) redraw(pid);
  updateProps();
}
// Sélection multiple, toujours sur une seule page : S.sel.aid est l'élément principal (le dernier choisi), S.sel.more les autres
const selIds = () => S.sel ? [...(S.sel.more || []), S.sel.aid] : [];
function selAnnots() {
  if (!S.sel) return [];
  const p = S.pages.find(x => x.id === S.sel.pid);
  return p ? selIds().map(id => p.annots.find(a => a.id === id)).filter(Boolean) : [];
}
function selectMany(pid, ids, main = ids[ids.length - 1]) {
  const prev = S.sel?.pid;
  S.sel = ids.length ? { pid, aid: main, more: ids.filter(x => x !== main) } : null;
  if (prev && prev !== pid) redraw(prev);
  redraw(pid); updateProps();
}
function toggleSel(pid, aid) {
  if (!S.sel || S.sel.pid !== pid) return setSel(pid, aid);
  const ids = selIds(), i = ids.indexOf(aid);
  if (i >= 0) { ids.splice(i, 1); selectMany(pid, ids); } else selectMany(pid, [...ids, aid], aid);
}
function setTool(t) {
  commitEditor();
  S.tool = t; document.body.dataset.tool = t;
  TOOLBAR.forEach((g, gi) => {   // un groupe affiche l'outil choisi en dernier
    if (!Array.isArray(g) || !g.includes(t)) return;
    S.groupSel[gi] = t;
    const b = document.querySelector(`.tgroup[data-group="${gi}"] .tool`);
    if (b && b.dataset.tool !== t) b.outerHTML = toolBtn(t);
  });
  document.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t));
  if (t !== 'select') setSel(null); else updateProps();
  V.forEach(clearHover);
  if (t === 'signature' && !S.pendingSig && S.pages.length) openSig();
  if (t === 'image' && !S.pendingImg && S.pages.length) $('#fileImage').click();
}
const groupOf = a => a.type === 'text' ? 'text' : a.type === 'ink' ? 'ink' : a.type === 'rect' ? (a.erase ? 'erase' : a.kind)
  : a.type === 'shape' || a.type === 'line' ? 'shape' : a.type === 'note' ? 'note' : a.type === 'link' ? 'link' : null;

/* ---------- Historique ---------- */
const serialize = () => JSON.stringify({ p: S.pages, d: S.decor });
const structSig = pages => pages.map(p => `${p.id}:${p.src}:${p.idx}:${p.rot}`).join('|');
function snapshot() { S.undo.push(serialize()); if (S.undo.length > 100) S.undo.shift(); S.redo = []; S.dirty = true; updateUI(); }
function pushSnap(s) { S.undo.push(s); S.redo = []; S.dirty = true; updateUI(); }
function restore(json) {
  const old = structSig(S.pages), o = JSON.parse(json); S.pages = o.p; S.decor = o.d || {}; S.sel = null;
  if (structSig(S.pages) === old) { S.pages.forEach(p => { const v = V.get(p.id); if (v) { v.p = p; drawAnnots(v); } }); updateProps(); updateUI(); renderComments(); }
  else rebuild();
}
function undo() { commitEditor(); if (!S.undo.length) return; S.redo.push(serialize()); restore(S.undo.pop()); S.dirty = true; }
function redo() { commitEditor(); if (!S.redo.length) return; S.undo.push(serialize()); restore(S.redo.pop()); S.dirty = true; }

/* ---------- Interactions sur la page ---------- */
function toPdf(e, v) { const r = v.svg.getBoundingClientRect(); return v.vp.convertToPdfPoint(e.clientX - r.left, e.clientY - r.top); }
function hitAnnot(e, v) { const n = e.target.closest?.('[data-aid]'); return n ? v.p.annots.find(a => a.id === n.dataset.aid) : null; }
// Maj : angle multiple de 45° depuis le point de départ
function snap45(P, Q) {
  const dx = Q[0] - P[0], dy = Q[1] - P[1], len = Math.hypot(dx, dy), ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
  return [P[0] + len * Math.cos(ang), P[1] + len * Math.sin(ang)];
}

function onDown(e, v) {
  if (e.button !== 0) return;
  if (CROP && CROP.v === v && hitAnnot(e, v) === CROP.a) { e.preventDefault(); return panCrop(e, v); }
  commitEditor();
  const P = toPdf(e, v), p = v.p, R = v.rotation, t = S.tool, hit = hitAnnot(e, v);
  if (t === 'select') {
    const hd = e.target.closest('[data-handle]');
    if (hd) { const a = selAnnot(); if (a) return drag(e, v, a, 'resize', null, hd.dataset.handle); }
    if (hit) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) return toggleSel(p.id, hit.id);
      const inGroup = S.sel?.pid === p.id && selIds().length > 1 && selIds().includes(hit.id);
      if (inGroup) selectMany(p.id, selIds(), hit.id); else setSel(p.id, hit.id);
      // Dans un groupe, un simple clic sans déplacer ne garde que l'élément cliqué
      return drag(e, v, hit, 'move', hit.type === 'note' ? () => openNote(v, hit) : inGroup ? () => setSel(p.id, hit.id) : null);
    }
    return setSel(null);
  }
  e.preventDefault();
  if (t === 'text' || t === 'edittext') {
    if (hit && hit.type === 'text') { setSel(p.id, hit.id); return openEditor(v, hit); }
    if (t === 'edittext') return replaceTextAt(v, P);
    const snap = serialize(), st = S.style.text;
    const o = add(P, rot([0, -st.size * 0.945], R));
    const a = { id: uid(), type: 'text', x: r2(o[0]), y: r2(o[1]), r: R, text: '', size: st.size, font: st.font, bold: st.bold, italic: st.italic, lh: st.lh, ls: st.ls, color: st.color };
    p.annots.push(a); S.sel = { pid: p.id, aid: a.id }; updateProps();
    return openEditor(v, a, { snap, isNew: true });
  }
  if (['highlight', 'underline', 'strike', 'mask', 'redact'].includes(t)) return dragRect(e, v, P, t);
  if (t === 'rect' || t === 'ellipse') return dragShape(e, v, P, t);
  if (t === 'line' || t === 'arrow') return dragLine(e, v, P, t === 'arrow');
  if (t === 'ftext' || t === 'fcheck') return dragField(e, v, P, t === 'ftext' ? 'text' : 'check');
  if (t === 'link') return hit && hit.type === 'link' ? editLink(v, hit) : dragLink(e, v, P);
  if (t === 'crop') return dragCrop(e, v, P);
  if (t === 'draw') return dragInk(e, v, P);
  if (t === 'note') {
    if (hit && hit.type === 'note') return openNote(v, hit);
    const snap = serialize();
    const a = { id: uid(), type: 'note', x: r2(P[0] - NOTE / 2), y: r2(P[1] - NOTE / 2), text: '', author: noteAuthor(), date: new Date().toISOString(), color: S.style.note.color };
    p.annots.push(a); drawAnnots(v);
    return openNote(v, a, snap);
  }
  if (t === 'check' || t === 'cross') {
    snapshot();
    const s = S.style.ink.mark;
    const tpl = t === 'check' ? [[[-0.5, 0.02], [-0.14, -0.42], [0.5, 0.45]]] : [[[-0.42, 0.42], [0.42, -0.42]], [[-0.42, -0.42], [0.42, 0.42]]];
    const strokes = tpl.map(st => st.map(q => add(P, rot([q[0] * s, q[1] * s], R)).map(r2)));
    const a = { id: uid(), type: 'ink', strokes, color: S.style.ink.color, width: Math.max(1.2, S.style.ink.width) };
    p.annots.push(a); drawAnnots(v); return;
  }
  if (t === 'signature' || t === 'image' || t === 'stamp') {
    const im = t === 'signature' ? S.pendingSig : t === 'stamp' ? makeStamp(S.style.stamp) : S.pendingImg;
    if (!im) return t === 'signature' ? openSig() : $('#fileImage').click();
    snapshot();
    const w = t === 'signature' ? 150 : t === 'stamp' ? im.w : Math.min(im.w * 0.75, 260), h = w * im.h / im.w;
    const o = sub(P, rot([w / 2, h / 2], R));
    const a = { id: uid(), type: 'image', x: r2(o[0]), y: r2(o[1]), w: r2(w), h: r2(h), r: R, src: im.src };
    p.annots.push(a);
    if (t === 'stamp') { drawAnnots(v); return; }
    setTool('select'); setSel(p.id, a.id);
    toast('Déplacez-la ou redimensionnez-la avec la poignée bleue.');
  }
}
function onDbl(e, v) {
  const hit = hitAnnot(e, v);
  if (hit && hit.type === 'text' && S.tool === 'select') { setSel(v.p.id, hit.id); openEditor(v, hit); }
  if (hit && hit.type === 'image' && S.tool === 'select' && !CROP) enterCrop(v, hit);
}
function capture(v, e, move, up) {
  try { v.svg.setPointerCapture(e.pointerId); } catch {}
  const mv = ev => move(ev);
  const end = ev => { v.svg.removeEventListener('pointermove', mv); v.svg.removeEventListener('pointerup', end); v.svg.removeEventListener('pointercancel', end); up(ev); };
  v.svg.addEventListener('pointermove', mv); v.svg.addEventListener('pointerup', end); v.svg.addEventListener('pointercancel', end);
}
// onClick : appelé si l'élément a été cliqué sans être déplacé ; handle : extrémité saisie d'une ligne
function drag(e, v, a, mode, onClick, handle) {
  const start = toPdf(e, v), orig = clone(a), snap = serialize(); let moved = false;
  // Déplacement : tout le groupe sélectionné suit, aimanté aux autres éléments, aux espacements et au centre de la page.
  // Alt : déplace une copie (les originaux restent en place). Ctrl pendant le déplacement : sans aimant.
  let group = mode === 'move' && selIds().includes(a.id) ? selAnnots() : [a], targets = null;
  const origs = group.map(clone), dup = mode === 'move' && e.altKey;
  const box0 = mode === 'move' ? unionBox(origs.map(annotBox)) : null, base0 = group.length === 1 ? baselineOf(a) : null;
  capture(v, e, ev => {
    const P = toPdf(ev, v); let dx = P[0] - start[0], dy = P[1] - start[1];
    if (!moved) {
      if (Math.hypot(dx, dy) * v.vp.scale < 2) return;
      pushSnap(snap); moved = true;
      if (dup) {
        group = origs.map(o => { const c = clone(o); c.id = uid(); if (c.type === 'field') c.name = fieldName(c.name); v.p.annots.push(c); return c; });
        selectMany(v.p.id, group.map(x => x.id), group[origs.findIndex(o => o.id === a.id)]?.id);
      }
      if (mode === 'move') targets = snapTargets(v, new Set(group.map(x => x.id)));   // les originaux servent de repères pour la copie
    }
    if (mode === 'move') {
      const s = ev.ctrlKey || ev.metaKey ? { dx, dy, guides: [] } : snapMove(box0, base0, dx, dy, targets, 5 / v.vp.scale);
      group.forEach((g, k) => { placeLike(g, origs[k]); shiftAnnot(g, s.dx, s.dy); });
      v.guides = s.guides;
    } else if (a.type === 'line') {
      const fixed = handle === '0' ? [orig.x2, orig.y2] : [orig.x1, orig.y1], Q = ev.shiftKey ? snap45(fixed, P) : P;
      if (handle === '0') Object.assign(a, { x1: r2(Q[0]), y1: r2(Q[1]) }); else Object.assign(a, { x2: r2(Q[0]), y2: r2(Q[1]) });
    } else {
      const r = orig.r || 0, TL = add([orig.x, orig.y], rot([0, orig.h], r)), q = rot(sub(P, TL), -r);
      const w = Math.max(4, q[0]); const h = a.type === 'image' ? w * orig.h / orig.w : Math.max(4, -q[1]);
      const o = sub(TL, rot([0, h], r)); Object.assign(a, { w: r2(w), h: r2(h), x: r2(o[0]), y: r2(o[1]) });
    }
    drawAnnots(v);
  }, () => { if (v.guides) { v.guides = null; drawAnnots(v); } if (!moved && onClick) onClick(); });
}
// Remet un élément à la position d'un autre (sans toucher à son identifiant ni à son contenu)
function placeLike(g, o) {
  if (g.type === 'ink') g.strokes = clone(o.strokes);
  else if (g.type === 'line') Object.assign(g, { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2 });
  else Object.assign(g, { x: o.x, y: o.y });
}

// Éléments qu'on peut sélectionner à plusieurs, aligner ou aimanter (pas les zones qui effacent un texte remplacé)
const groupable = a => !(a.type === 'rect' && a.erase);
function marquee(e, v, keep) {
  const P = toPdf(e, v); let m = null;
  try { v.el.setPointerCapture(e.pointerId); } catch {}
  const move = ev => {
    const Q = toPdf(ev, v);
    if (!m && Math.hypot(Q[0] - P[0], Q[1] - P[1]) * v.vp.scale < 3) return;
    m = v.marquee = { x0: Math.min(P[0], Q[0]), y0: Math.min(P[1], Q[1]), x1: Math.max(P[0], Q[0]), y1: Math.max(P[1], Q[1]) };
    drawAnnots(v);
  };
  const end = () => {
    v.el.removeEventListener('pointermove', move); v.el.removeEventListener('pointerup', end); v.el.removeEventListener('pointercancel', end);
    if (!m) return;
    v.marquee = null;
    const ids = v.p.annots.filter(a => groupable(a) && hits(annotBox(a), m)).map(a => a.id), all = [...new Set([...keep, ...ids])];
    if (all.length) selectMany(v.p.id, all); else drawAnnots(v);
  };
  v.el.addEventListener('pointermove', move); v.el.addEventListener('pointerup', end); v.el.addEventListener('pointercancel', end);
}

/* ---------- Aimantation et repères ---------- */
const unionBox = bs => ({ x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) });
const baselineOf = a => a.type === 'text' && !(a.r || 0) ? a.y : null;   // ligne de base d'un texte horizontal
// Lignes sur lesquelles s'aimanter : bords et centres des autres éléments, lignes de base des textes, centre de la page
function snapTargets(v, skip) {
  const [px0, py0, px1, py1] = v.pg.view, xs = [], ys = [], boxes = [];
  xs.push({ at: (px0 + px1) / 2, span: [py0, py1] }); ys.push({ at: (py0 + py1) / 2, span: [px0, px1] });
  for (const o of v.p.annots) {
    if (skip.has(o.id) || isRedact(o) || !groupable(o)) continue;
    const b = annotBox(o); boxes.push(b);
    for (const x of [b.x0, (b.x0 + b.x1) / 2, b.x1]) xs.push({ at: x, span: [b.y0, b.y1] });
    for (const y of [b.y0, (b.y0 + b.y1) / 2, b.y1]) ys.push({ at: y, span: [b.x0, b.x1] });
    const bl = baselineOf(o); if (bl != null) ys.push({ at: bl, span: [b.x0, b.x1], base: true });
  }
  return { xs, ys, boxes };
}
const closer = (p, q) => !p ? q : !q ? p : Math.abs(q.d) < Math.abs(p.d) ? q : p;
// Espacement égal : la boîte b vient contre un voisin A à la même distance que celle qui sépare A de son propre voisin B
// (dans une colonne pour axis 'y', sur une ligne pour axis 'x'). Renvoie la correction et les deux écarts à montrer.
function gapSnap(b, boxes, axis, tol) {
  const [lo, hi, clo, chi] = axis === 'y' ? ['y0', 'y1', 'x0', 'x1'] : ['x0', 'x1', 'y0', 'y1'];
  const facing = (p, q) => Math.min(p[chi], q[chi]) - Math.max(p[clo], q[clo]) > 0;   // en vis-à-vis sur l'autre axe
  const gap = (p, q) => {   // p avant q sur l'axe : zone vide entre les deux, sur leur partie commune
    const c0 = Math.max(p[clo], q[clo]), c1 = Math.min(p[chi], q[chi]);
    return { gap: axis === 'y' ? [c0, p[hi], c1, q[lo]] : [p[hi], c0, q[lo], c1] };
  };
  const nearest = (A, after) => {
    let best = null, bg = Infinity;
    for (const B of boxes) {
      if (B === A || !facing(A, B)) continue;
      const g = after ? B[lo] - A[hi] : A[lo] - B[hi];
      if (g > 0 && g < bg) { bg = g; best = B; }
    }
    return best && { B: best, g: bg };
  };
  let r = null;
  for (const A of boxes) {
    if (!facing(A, b)) continue;
    if (A[lo] >= b[hi] - tol) {   // A après b, B encore après A
      const n = nearest(A, true), d = n && A[lo] - n.g - b[hi];
      if (n && Math.abs(d) <= tol) r = closer(r, { d, marks: nb => [gap(A, n.B), gap(nb, A)] });
    }
    if (A[hi] <= b[lo] + tol) {   // A avant b, B encore avant A
      const n = nearest(A, false), d = n && A[hi] + n.g - b[lo];
      if (n && Math.abs(d) <= tol) r = closer(r, { d, marks: nb => [gap(n.B, A), gap(A, nb)] });
    }
  }
  return r;
}
// Décalage corrigé pour tomber pile sur la ligne ou l'espacement le plus proche (à moins de tol), et les repères à afficher
function snapMove(box0, base0, dx, dy, t, tol) {
  const at = () => ({ x0: box0.x0 + dx, x1: box0.x1 + dx, y0: box0.y0 + dy, y1: box0.y1 + dy });
  const best = (anchors, lines, onlyBase) => {
    let r = null;
    for (const [val, isBase] of anchors) for (const l of lines) {
      if (onlyBase && isBase !== !!l.base) continue;
      const d = l.at - val;
      if (Math.abs(d) <= tol && (!r || Math.abs(d) < Math.abs(r.d))) r = { d, l };
    }
    return r;
  };
  let b = at();
  const sx = closer(best([[b.x0], [(b.x0 + b.x1) / 2], [b.x1]], t.xs), gapSnap(b, t.boxes, 'x', tol));
  if (sx) dx += sx.d;
  b = at();
  // Un texte s'aligne en priorité sur la ligne de base des autres textes
  const sy = (base0 != null && best([[base0 + dy, true]], t.ys, true))
    || closer(best([[b.y0, false], [(b.y0 + b.y1) / 2, false], [b.y1, false]], t.ys.filter(l => !l.base)), gapSnap(b, t.boxes, 'y', tol));
  if (sy) dy += sy.d;
  const nb = at(), guides = [];
  if (sx?.l) guides.push([sx.l.at, Math.min(nb.y0, sx.l.span[0]) - 6, sx.l.at, Math.max(nb.y1, sx.l.span[1]) + 6]);
  if (sy?.l) guides.push([Math.min(nb.x0, sy.l.span[0]) - 6, sy.l.at, Math.max(nb.x1, sy.l.span[1]) + 6, sy.l.at]);
  if (sx?.marks) guides.push(...sx.marks(nb));
  if (sy?.marks) guides.push(...sy.marks(nb));
  return { dx, dy, guides };
}

/* ---------- Aligner et répartir ---------- */
function alignSel(how) {
  const list = selAnnots(); if (!list.length) return;
  const v = V.get(S.sel.pid), boxes = list.map(annotBox);
  // Plusieurs éléments : alignés entre eux ; un seul : centré sur la page
  const [px0, py0, px1, py1] = v.pg.view, ref = list.length > 1 ? unionBox(boxes) : { x0: px0, y0: py0, x1: px1, y1: py1 };
  const main = selAnnot(), mainBase = baselineOf(main);
  snapshot();
  list.forEach((a, i) => {
    const b = boxes[i]; let dx = 0, dy = 0;
    if (how === 'left') dx = ref.x0 - b.x0;
    else if (how === 'hcenter') dx = (ref.x0 + ref.x1 - b.x0 - b.x1) / 2;
    else if (how === 'right') dx = ref.x1 - b.x1;
    else if (how === 'top') dy = ref.y1 - b.y1;
    else if (how === 'vcenter') dy = (ref.y0 + ref.y1 - b.y0 - b.y1) / 2;
    else if (how === 'bottom') dy = ref.y0 - b.y0;
    else if (how === 'baseline' && mainBase != null && baselineOf(a) != null) dy = mainBase - a.y;
    shiftAnnot(a, dx, dy);
  });
  redraw(S.sel.pid);
}
// Espaces égaux entre les éléments, les deux extrêmes restant en place
function distributeSel(axis) {
  const list = selAnnots(); if (list.length < 3) return;
  const lo = axis === 'h' ? 'x0' : 'y0', hi = axis === 'h' ? 'x1' : 'y1';
  const items = list.map(a => ({ a, b: annotBox(a) })).sort((p, q) => p.b[lo] + p.b[hi] - q.b[lo] - q.b[hi]);
  const span = items[items.length - 1].b[hi] - items[0].b[lo], used = items.reduce((s, it) => s + it.b[hi] - it.b[lo], 0);
  const gap = (span - used) / (items.length - 1);
  snapshot();
  let pos = items[0].b[hi] + gap;
  for (const it of items.slice(1, -1)) {
    const d = pos - it.b[lo]; shiftAnnot(it.a, axis === 'h' ? d : 0, axis === 'h' ? 0 : d);
    pos += it.b[hi] - it.b[lo] + gap;
  }
  redraw(S.sel.pid);
}
// Rectangle tiré à la souris ; pour surligner / souligner / barrer, il s'aligne sur les lignes de texte couvertes
function dragRect(e, v, P, t) {
  const snap = serialize(), markup = ['highlight', 'underline', 'strike'].includes(t);
  const words = markup ? ensureText(v) : null;
  const a = { id: uid(), type: 'rect', kind: t, x: P[0], y: P[1], w: 0, h: 0, r: 0, color: S.style[t].color };
  v.p.annots.push(a);
  capture(v, e, ev => {
    const Q = toPdf(ev, v);
    Object.assign(a, { x: r2(Math.min(P[0], Q[0])), y: r2(Math.min(P[1], Q[1])), w: r2(Math.abs(Q[0] - P[0])), h: r2(Math.abs(Q[1] - P[1])) });
    drawAnnots(v);
  }, async () => {
    const tiny = a.w * v.vp.scale < 3 || a.h * v.vp.scale < 3;
    if (markup && a.w * v.vp.scale >= 3) {
      const boxes = snapToText(await words, a);
      if (boxes.length) {
        v.p.annots.splice(v.p.annots.indexOf(a), 1, ...boxes.map(b => ({ id: uid(), type: 'rect', kind: t, ...b, color: a.color })));
        pushSnap(snap); drawAnnots(v); return;
      }
    }
    if (tiny || (markup && t !== 'highlight')) {
      v.p.annots.splice(v.p.annots.indexOf(a), 1);
      toast(markup ? 'Faites glisser sur le texte à marquer.' : t === 'redact' ? 'Faites glisser pour couvrir la zone à caviarder.' : 'Faites glisser pour couvrir la zone à masquer.');
    } else pushSnap(snap);
    drawAnnots(v);
  });
}
// Portions des lignes de texte couvertes par un rectangle, une boîte par ligne
function snapToText(items, d) {
  const out = [], box = [[d.x, d.y], [d.x + d.w, d.y], [d.x + d.w, d.y + d.h], [d.x, d.y + d.h]];
  for (const it of items) {
    const q = box.map(c => rot(sub(c, [it.x, it.y]), -it.r)), y0 = Math.min(...q.map(c => c[1])), y1 = Math.max(...q.map(c => c[1]));
    const x0 = Math.min(...q.map(c => c[0])), x1 = Math.max(...q.map(c => c[0])), fs = it.fs;
    const ov = Math.min(y1, fs * 0.9) - Math.max(y0, -fs * 0.2);
    if (ov < Math.min(fs * 0.35, (y1 - y0) * 0.5) || x1 < 0 || x0 > it.w) continue;
    const total = measure(it.str, HELV) || 1, k = it.w / total;
    let c0 = -1, c1 = -1;
    for (let c = 0; c < it.str.length; c++) {
      const a = measure(it.str.slice(0, c), HELV) * k, b = measure(it.str.slice(0, c + 1), HELV) * k, mid = (a + b) / 2;
      if (mid >= x0 && mid <= x1 && it.str[c] !== ' ') { if (c0 < 0) c0 = c; c1 = c; }
    }
    if (c0 < 0) continue;
    const s0 = measure(it.str.slice(0, c0), HELV) * k, s1 = measure(it.str.slice(0, c1 + 1), HELV) * k;
    const o = add([it.x, it.y], rot([s0, -fs * 0.22], it.r));
    const b = { x: r2(o[0]), y: r2(o[1]), w: r2(s1 - s0), h: r2(fs * 1.14), r: r2(it.r) };
    const last = out[out.length - 1];   // même ligne, juste à côté : une seule boîte
    if (last && Math.abs(last.r - b.r) < 0.5 && Math.abs(last.h - b.h) < fs * 0.2) {
      const gap = rot(sub([b.x, b.y], [last.x, last.y]), -b.r);
      if (Math.abs(gap[1]) < fs * 0.25 && gap[0] >= last.w - fs * 0.1 && gap[0] - last.w < fs * 0.8) { last.w = r2(gap[0] + b.w); continue; }
    }
    out.push(b);
  }
  return out;
}
function dragShape(e, v, P, kind) {
  const snap = serialize(), st = S.style.shape;
  const a = { id: uid(), type: 'shape', kind, x: P[0], y: P[1], w: 0, h: 0, r: 0, stroke: st.stroke, fill: st.fill, width: st.width, ...(kind === 'rect' && st.rx ? { rx: st.rx } : {}) };
  v.p.annots.push(a);
  capture(v, e, ev => {
    let Q = toPdf(ev, v);
    if (ev.shiftKey) { const s = Math.max(Math.abs(Q[0] - P[0]), Math.abs(Q[1] - P[1])); Q = [P[0] + Math.sign(Q[0] - P[0] || 1) * s, P[1] + Math.sign(Q[1] - P[1] || 1) * s]; }
    Object.assign(a, { x: r2(Math.min(P[0], Q[0])), y: r2(Math.min(P[1], Q[1])), w: r2(Math.abs(Q[0] - P[0])), h: r2(Math.abs(Q[1] - P[1])) });
    drawAnnots(v);
  }, () => {
    if (a.w * v.vp.scale < 4 && a.h * v.vp.scale < 4) { v.p.annots.splice(v.p.annots.indexOf(a), 1); toast('Faites glisser pour dessiner la forme (Maj : carré ou cercle).'); }
    else { pushSnap(snap); S.sel = { pid: v.p.id, aid: a.id }; updateProps(); }
    drawAnnots(v);
  });
}
function dragLine(e, v, P, arrow) {
  const snap = serialize(), st = S.style.shape;
  const a = { id: uid(), type: 'line', x1: r2(P[0]), y1: r2(P[1]), x2: r2(P[0]), y2: r2(P[1]), arrow, stroke: st.stroke, width: st.width };
  v.p.annots.push(a);
  capture(v, e, ev => {
    const Q = ev.shiftKey ? snap45(P, toPdf(ev, v)) : toPdf(ev, v);
    a.x2 = r2(Q[0]); a.y2 = r2(Q[1]); drawAnnots(v);
  }, () => {
    if (Math.hypot(a.x2 - a.x1, a.y2 - a.y1) * v.vp.scale < 5) { v.p.annots.splice(v.p.annots.indexOf(a), 1); toast('Faites glisser pour tracer (Maj : angles de 45°).'); }
    else { pushSnap(snap); S.sel = { pid: v.p.id, aid: a.id }; updateProps(); }
    drawAnnots(v);
  });
}
function fieldName(base) {
  const used = new Set(S.pages.flatMap(p => p.annots.filter(a => a.type === 'field').map(a => a.name)));
  let n = 1; while (used.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
function dragField(e, v, P, kind) {
  const snap = serialize();
  const a = { id: uid(), type: 'field', kind, name: fieldName(kind === 'check' ? 'Case' : 'Champ'), x: P[0], y: P[1], w: 0, h: 0, r: 0, multiline: false };
  v.p.annots.push(a);
  capture(v, e, ev => {
    const Q = toPdf(ev, v);
    Object.assign(a, { x: r2(Math.min(P[0], Q[0])), y: r2(Math.min(P[1], Q[1])), w: r2(Math.abs(Q[0] - P[0])), h: r2(Math.abs(Q[1] - P[1])) });
    drawAnnots(v);
  }, () => {
    if (a.w * v.vp.scale < 6 || a.h * v.vp.scale < 6) {   // simple clic : taille par défaut
      const [w, h] = kind === 'check' ? [14, 14] : [180, 22];
      Object.assign(a, { x: r2(P[0] - (kind === 'check' ? w / 2 : 0)), y: r2(P[1] - h / 2), w, h });
    }
    pushSnap(snap); S.sel = { pid: v.p.id, aid: a.id }; updateProps(); drawAnnots(v);
  });
}
function dragCrop(e, v, P) {
  const snap = serialize(), old = v.p.crop;
  capture(v, e, ev => {
    const Q = toPdf(ev, v);
    v.p.crop = { x0: r2(Math.min(P[0], Q[0])), y0: r2(Math.min(P[1], Q[1])), x1: r2(Math.max(P[0], Q[0])), y1: r2(Math.max(P[1], Q[1])) };
    drawAnnots(v);
  }, () => {
    const c = v.p.crop;
    if (!c || (c.x1 - c.x0) * v.vp.scale < 20 || (c.y1 - c.y0) * v.vp.scale < 20) { v.p.crop = old; toast('Faites glisser pour délimiter la partie de la page à garder.'); }
    else { pushSnap(snap); propsKey = ''; updateProps(); }
    drawAnnots(v);
  });
}
function dragInk(e, v, P) {
  const snap = serialize(), st = [P.map(r2)];
  const a = { id: uid(), type: 'ink', strokes: [st], color: S.style.ink.color, width: S.style.ink.width };
  v.p.annots.push(a); drawAnnots(v);
  capture(v, e, ev => {
    for (const ce of (ev.getCoalescedEvents?.() || [ev])) {
      const Q = toPdf(ce, v), L = st[st.length - 1];
      if (Math.hypot(Q[0] - L[0], Q[1] - L[1]) * v.vp.scale >= 1.5) st.push(Q.map(r2));
    }
    drawAnnots(v);
  }, () => { pushSnap(snap); drawAnnots(v); });
}

/* ---------- Liens ---------- */
// Seuls les liens web, e-mail et téléphone sont acceptés (jamais javascript:, file:…) ; « exemple.fr » devient https://exemple.fr
function safeUrl(s) {
  s = String(s || '').trim();
  if (!s) return null;
  if (/^(mailto|tel):/i.test(s)) return /^[^\s<>"]+$/.test(s) ? encodeURI(decodeURI(s)) : null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) { if (!/^[^\s/]+\.[^\s/]{2,}/.test(s)) return null; s = 'https://' + s; }
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; }
}
function linkLabel(a) {
  if (a.target?.kind === 'page') { const i = S.pages.findIndex(p => p.id === a.target.page); return i < 0 ? 'Lien vers une page supprimée' : `Lien vers la page ${i + 1}`; }
  const u = a.target?.url || '';
  try { const x = new URL(u); return x.protocol.startsWith('http') ? `Lien vers ${x.host}${x.pathname.length > 1 ? x.pathname : ''}` : u; } catch { return u || 'Lien sans destination'; }
}
function dragLink(e, v, P) {
  const snap = serialize();
  const a = { id: uid(), type: 'link', x: P[0], y: P[1], w: 0, h: 0, r: 0, target: { kind: 'url', url: '' } };
  v.p.annots.push(a);
  capture(v, e, ev => {
    const Q = toPdf(ev, v);
    Object.assign(a, { x: r2(Math.min(P[0], Q[0])), y: r2(Math.min(P[1], Q[1])), w: r2(Math.abs(Q[0] - P[0])), h: r2(Math.abs(Q[1] - P[1])) });
    drawAnnots(v);
  }, () => {
    if (a.w * v.vp.scale < 6 || a.h * v.vp.scale < 6) Object.assign(a, { x: r2(P[0]), y: r2(P[1] - 8), w: 120, h: 16 });
    drawAnnots(v); editLink(v, a, snap);
  });
}
// snap : présent pour un lien qui vient d'être tracé (il disparaît si l'on annule)
async function editLink(v, a, snap) {
  const t = await askLink(a.target);
  if (!t) {
    if (snap) { v.p.annots.splice(v.p.annots.indexOf(a), 1); drawAnnots(v); }
    return;
  }
  pushSnap(snap || serialize());
  a.target = t;
  S.sel = { pid: v.p.id, aid: a.id }; propsKey = ''; drawAnnots(v); updateProps();
}
// Lien posé sur un texte : il suit le texte quand on le déplace
async function editTextLink(v, a) {
  const t = await askLink(a.link || { kind: 'url', url: '' }); if (!t) return;
  snapshot(); a.link = t; propsKey = ''; drawAnnots(v); updateProps();
}
// Destination choisie dans la boîte de dialogue, ou null si annulé
async function askLink(target) {
  const n = S.pages.length, cur = target.kind === 'page' ? S.pages.findIndex(p => p.id === target.page) + 1 : 0;
  const d = await ask({
    title: 'Destination du lien', ok: 'Valider',
    html: `<label class="check"><input type="radio" name="kind" value="page" ${target.kind === 'page' ? 'checked' : ''}><span>Une page de ce document
        <input type="number" name="page" min="1" max="${n}" value="${cur || Math.min(n, S.cur + 2)}" style="width:80px;height:30px;margin-left:8px"></span></label>
      <label class="check"><input type="radio" name="kind" value="url" ${target.kind === 'url' ? 'checked' : ''}><span>Une adresse web, e-mail ou téléphone
        <input name="url" value="${escHtml(target.url || '')}" placeholder="https://exemple.fr, mailto:nom@exemple.fr, tel:+33…" style="height:30px;margin-top:6px"></span></label>
      <p class="small" style="margin:0">Le lien est cliquable dans tous les lecteurs PDF. Les adresses autres que web, e-mail et téléphone sont refusées.</p>`,
    init: b => {
      b.querySelector('[name=page]').addEventListener('focus', () => { b.querySelector('[value=page]').checked = true; });
      b.querySelector('[name=url]').addEventListener('focus', () => { b.querySelector('[value=url]').checked = true; });
    },
    validate: d => {
      if (d.kind === 'page') return +d.page >= 1 && +d.page <= n ? null : `Choisissez une page entre 1 et ${n}.`;
      return safeUrl(d.url) ? null : 'Adresse invalide : indiquez une adresse web (https://…), un e-mail (mailto:…) ou un numéro (tel:…).';
    },
  });
  if (!d) return null;
  return d.kind === 'page' ? { kind: 'page', page: S.pages[+d.page - 1].id } : { kind: 'url', url: safeUrl(d.url) };
}
// Lien PDF natif ; un lien interne vers une page absente du fichier produit (extraction) est ignoré.
// own : lien posé par un texte (marqué pour être retiré à la réouverture, le texte le recrée)
function addLinkAnnot(out, page, a, cache, own) {
  const { PDFHexString, PDFName } = PDFLib, ctx = out.context;
  const d = ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [a.x, a.y, a.x + a.w, a.y + a.h], Border: [0, 0, 0], F: 4, P: page.ref });
  if (own) d.set(PDFName.of('NM'), PDFHexString.fromText(AtelierLayer.linkMark()));
  if (a.target.kind === 'url') {
    const u = safeUrl(a.target.url); if (!u) return;
    d.set(PDFName.of('A'), ctx.obj({ Type: 'Action', S: 'URI', URI: PDFHexString.of([...u].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')) }));
  } else {
    const ref = cache.pageRefs?.get(a.target.page); if (!ref) return;
    d.set(PDFName.of('Dest'), ctx.obj([ref, 'XYZ', null, null, null]));
  }
  page.node.addAnnot(ctx.register(d));
}

/* ---------- Notes (commentaires) ---------- */
let NP = null;   // note ouverte : { v, a, snap, orig }
const noteAuthor = () => { try { return localStorage.getItem('atelierpdf.author') || 'Utilisateur'; } catch { return 'Utilisateur'; } };
function openNote(v, a, snap) {
  commitNote();
  const pop = $('#notePop'), ta = pop.querySelector('textarea');
  NP = { v, a, snap: snap || serialize(), orig: a.text, isNew: !!snap };
  const [x, y] = v.vp.convertToViewportPoint(a.x + NOTE, a.y + NOTE);
  v.el.append(pop); pop.hidden = false;
  pop.style.left = Math.min(x + 6, v.vp.width - 256) + 'px'; pop.style.top = Math.max(0, y) + 'px';
  ta.value = a.text;
  $('#noteMeta').textContent = `${a.author || ''} · ${new Date(a.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
  setTimeout(() => ta.focus(), 0);
}
function commitNote(remove) {
  if (!NP) return;
  const { v, a, snap, orig, isNew } = NP; NP = null;
  const pop = $('#notePop'); a.text = pop.querySelector('textarea').value.trim(); pop.hidden = true; document.body.append(pop);
  if (remove || !a.text) {
    const i = v.p.annots.indexOf(a); if (i >= 0) v.p.annots.splice(i, 1);
    if (!isNew || remove) pushSnap(snap);
  } else if (a.text !== orig || isNew) { a.date = new Date().toISOString(); pushSnap(snap); }
  if (S.sel?.aid === a.id && !v.p.annots.includes(a)) S.sel = null;
  drawAnnots(v); renderComments(); updateProps();
}
$('#notePop textarea').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); commitNote(); } });
$('#notePop textarea').addEventListener('blur', () => setTimeout(() => { if (NP && !$('#notePop').contains(document.activeElement)) commitNote(); }, 120));
$('#noteDel').addEventListener('mousedown', e => e.preventDefault());
$('#noteDel').addEventListener('click', () => commitNote(true));

/* ---------- Tampons ---------- */
const STAMPS = ['APPROUVÉ', 'REFUSÉ', 'CONFIDENTIEL', 'BROUILLON', 'PAYÉ', 'REÇU', 'URGENT', 'COPIE', 'ANNULÉ', 'VU', 'POUR INFORMATION'];
const STAMP_COLORS = { '#1f8a4c': 'Vert', '#c62828': 'Rouge', '#1a3fb8': 'Bleu', '#444444': 'Gris' };
const stampCache = new Map();
function makeStamp({ text, color, date }) {
  const key = `${text}|${color}|${date ? new Date().toDateString() : ''}`;
  if (stampCache.has(key)) return stampCache.get(key);
  const k = 4, c = document.createElement('canvas'), g = c.getContext('2d');
  const main = `700 ${22 * k}px "Instrument Sans", Arial, sans-serif`, small = `500 ${9 * k}px "Instrument Sans", Arial, sans-serif`;
  const sub = date ? new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  g.font = main; const w1 = g.measureText(text).width; g.font = small; const w2 = sub ? g.measureText(sub).width : 0;
  const W = Math.ceil(Math.max(w1, w2) + 26 * k), H = Math.ceil((sub ? 46 : 36) * k);
  c.width = W; c.height = H;
  g.strokeStyle = g.fillStyle = color; g.lineWidth = 2.6 * k;
  const r = 6 * k, p = 2 * k;
  g.beginPath(); g.roundRect(p, p, W - 2 * p, H - 2 * p, r); g.stroke();
  g.lineWidth = 0.9 * k; g.beginPath(); g.roundRect(p + 3.5 * k, p + 3.5 * k, W - 2 * p - 7 * k, H - 2 * p - 7 * k, r * 0.6); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = main;
  g.fillText(text, W / 2, sub ? H * 0.42 : H / 2);
  if (sub) { g.font = small; g.fillText(sub, W / 2, H * 0.76); }
  const im = { src: c.toDataURL('image/png'), w: W / k, h: H / k };
  stampCache.set(key, im);
  return im;
}

/* ---------- Remplacer un texte existant ---------- */
async function ensureText(v) {
  if (v.text) return v.text;
  const tc = await v.pg.getTextContent();
  v.text = tc.items.filter(it => it.str && it.str.trim()).map(it => {
    const [a, b, c, d, e, f] = it.transform;
    const fam = tc.styles[it.fontName]?.fontFamily || 'sans-serif';
    let bold = false; try { if (v.pg.commonObjs.has(it.fontName)) bold = /bold|black|heavy|semibold/i.test(v.pg.commonObjs.get(it.fontName)?.name || ''); } catch {}
    return { str: it.str, x: e, y: f, r: Math.atan2(b, a) * 180 / Math.PI, fs: Math.hypot(c, d) || it.height || 10, w: it.width, fam, bold };
  });
  for (const o of v.p.ocr || []) v.text.push({ str: o.str, x: o.x, y: o.y, r: o.r, fs: o.fs, w: o.w, fam: 'sans-serif', bold: false, ocr: true });
  return v.text;
}
function itemAt(items, P) {
  return items.find(it => { const q = rot(sub(P, [it.x, it.y]), -it.r); return q[0] >= -1 && q[0] <= it.w + 1 && q[1] >= -it.fs * 0.28 && q[1] <= it.fs * 0.98; });
}
function canvasPx(v, pt) { const [x, y] = v.vp.convertToViewportPoint(pt[0], pt[1]); const k = v.canvas.width / v.vp.width; return [Math.round(x * k), Math.round(y * k)]; }
function sampleColors(v, it) {
  let bg = '#ffffff', ink = '#111111';
  try {
    if (!v.canvas.width) return { bg, ink };
    const ctx = v.canvas.getContext('2d', { willReadFrequently: true });
    const lum = d => 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2];
    let best = null, bl = -1;
    for (const q of [[-3, -it.fs * 0.4], [it.w + 3, -it.fs * 0.4], [-3, it.fs * 1.1], [it.w + 3, it.fs * 1.1], [it.w / 2, it.fs * 1.15], [it.w / 2, -it.fs * 0.45]]) {
      const [x, y] = canvasPx(v, add([it.x, it.y], rot(q, it.r)));
      if (x < 0 || y < 0 || x >= v.canvas.width || y >= v.canvas.height) continue;
      const d = ctx.getImageData(x, y, 1, 1).data; const l = lum(d); if (l > bl) { bl = l; best = d; }
    }
    if (best) bg = rgb2hex(best[0], best[1], best[2]);
    const c1 = canvasPx(v, add([it.x, it.y], rot([0, it.fs * 0.8], it.r))), c2 = canvasPx(v, add([it.x, it.y], rot([it.w, -it.fs * 0.1], it.r)));
    const x0 = Math.max(0, Math.min(c1[0], c2[0])), y0 = Math.max(0, Math.min(c1[1], c2[1]));
    const w = Math.min(600, Math.abs(c1[0] - c2[0])), h = Math.min(200, Math.abs(c1[1] - c2[1]));
    if (w > 0 && h > 0) {
      const d = ctx.getImageData(x0, y0, w, h).data; let dl = 999, di = 0;
      for (let i = 0; i < d.length; i += 4) { const l = lum([d[i], d[i + 1], d[i + 2]]); if (l < dl) { dl = l; di = i; } }
      if (bl - dl > 40) ink = rgb2hex(d[di], d[di + 1], d[di + 2]);
    }
  } catch (e) { console.warn(e); }
  return { bg, ink };
}
async function replaceTextAt(v, P) {
  const it = itemAt(await ensureText(v), P);
  if (!it) return toast('Aucun texte ici. Cliquez directement sur un mot du PDF.');
  const snap = serialize(); pushSnap(snap);
  const { bg, ink } = sampleColors(v, it);
  const pad = it.fs * 0.08, o = add([it.x, it.y], rot([-pad, -it.fs * 0.27], it.r));
  // Zone de caviardage couleur du fond : l'ancien texte est réellement retiré du fichier à l'enregistrement
  const mask = { id: uid(), type: 'rect', kind: 'redact', erase: true, x: r2(o[0]), y: r2(o[1]), w: r2(it.w + pad * 2), h: r2(it.fs * 1.24), r: r2(it.r), color: bg };
  const font = /mono/i.test(it.fam) ? 'Courier' : /sans/i.test(it.fam) ? 'Helvetica' : /serif/i.test(it.fam) ? 'Times' : 'Helvetica';
  const txt = { id: uid(), type: 'text', x: r2(it.x), y: r2(it.y), r: r2(it.r), text: it.str, size: Math.round(it.fs * 10) / 10, font, bold: it.bold, color: ink };
  v.p.annots.push(mask, txt); S.sel = { pid: v.p.id, aid: txt.id }; updateProps();
  openEditor(v, txt, { pushed: true });
}
function onHover(e, v) {
  if (S.tool !== 'edittext') return;
  if (!v.text) { if (!v.textLoading) { v.textLoading = true; ensureText(v); } return; }
  if (hitAnnot(e, v)) return clearHover(v);
  const it = itemAt(v.text, toPdf(e, v));
  if (it === v.hoverIt) return; v.hoverIt = it; clearHover(v, true);
  if (!it) return;
  const g = svgEl('g', { class: 'hover', transform: `translate(${it.x} ${it.y}) rotate(${it.r})` });
  g.append(svgEl('rect', { class: 'hoverbox', x: -1, y: -it.fs * 0.27, width: it.w + 2, height: it.fs * 1.24, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none' }));
  v.g.append(g);
}
function clearHover(v, keep) { v.g.querySelectorAll('.hover').forEach(n => n.remove()); if (!keep) v.hoverIt = null; }

/* ---------- Éditeur de texte ---------- */
function openEditor(v, a, opts = {}) {
  const ta = document.createElement('textarea'); ta.className = 'editor'; ta.value = a.text; ta.spellcheck = true;
  ta.setAttribute('aria-label', 'Texte');
  v.el.append(ta);
  ED = { v, a, ta, snap: opts.snap || serialize(), orig: a.text, isNew: !!opts.isNew, pushed: !!opts.pushed };
  layoutEditor(); drawAnnots(v);
  ta.addEventListener('input', () => { a.text = ta.value; layoutEditor(); });
  ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); commitEditor(); } });
  setTimeout(() => { if (ED?.ta !== ta) return; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); ta.addEventListener('blur', () => commitEditor()); }, 0);
}
function layoutEditor() {
  if (!ED) return;
  const { v, a, ta } = ED, s = v.vp.scale;
  const pt = add([a.x, a.y], rot([0, a.size * 0.945], a.r || 0));
  const [x, y] = v.vp.convertToViewportPoint(pt[0], pt[1]);
  const lines = a.text.split('\n');
  Object.assign(ta.style, {
    left: x + 'px', top: y + 'px', fontSize: a.size * s + 'px', fontFamily: fontOf(a).css, fontWeight: faceOf(a).weight, fontStyle: faceOf(a).italic ? 'italic' : 'normal', color: a.color,
    letterSpacing: lsOf(a) * s + 'px', lineHeight: lhOf(a) * s + 'px',
    width: (Math.max(...lines.map(l => measure(l, a)), a.size) + a.size) * s + 'px', height: lines.length * lhOf(a) * s + 'px',
  });
}
/* ---------- Cadrage d'une image (double-clic) ---------- */
// L'image complète apparaît en transparence autour du cadre ; on la fait glisser, la molette zoome.
// Entrée, Échap ou un clic ailleurs valident ; l'image dessinée dans le PDF n'est recalculée qu'à la fin.
let CROP = null;   // { v, a, snap, fit0, iw, ih }
async function enterCrop(v, a) {
  commitEditor();
  if (!a.orig) { a.orig = a.src; a.fit = { cx: 0.5, cy: 0.5, zoom: 1 }; }   // image placée telle quelle : cadrage par zoom
  const img = await imgOf(a.orig);
  CROP = { v, a, snap: serialize(), fit0: JSON.stringify(a.fit || null), iw: img.naturalWidth, ih: img.naturalHeight };
  const c = cropOf(a, CROP.iw, CROP.ih); a.fit = { cx: c.cx, cy: c.cy, zoom: c.zoom };
  setSel(v.p.id, a.id); propsKey = ''; updateProps(); drawAnnots(v);
}
function exitCrop() {
  if (!CROP) return;
  const { v, a, snap, fit0 } = CROP; CROP = null; propsKey = '';
  if (JSON.stringify(a.fit) !== fit0) { pushSnap(snap); bakeImage(a).then(() => drawAnnots(v)); }
  drawAnnots(v); updateProps();
}
function setCropFit(f) {
  const { a, iw, ih, v } = CROP, c = cropOf({ ...a, fit: { ...a.fit, ...f } }, iw, ih);
  a.fit = { cx: c.cx, cy: c.cy, zoom: c.zoom }; drawAnnots(v);
}
function panCrop(e, v) {
  const { a, iw } = CROP, start = toPdf(e, v), f0 = { ...a.fit }, ih = CROP.ih;
  const k = a.w / cropOf(a, iw, ih).w;   // points de page par pixel de l'image
  capture(v, e, ev => { const P = toPdf(ev, v); setCropFit({ cx: f0.cx - (P[0] - start[0]) / k / iw, cy: f0.cy + (P[1] - start[1]) / k / ih }); }, () => {});
}
// Nœuds SVG de l'image en cours de cadrage : image complète atténuée, partie visible nette dans le cadre
function cropNodes(t, a) {
  const { iw, ih } = CROP, c = cropOf(a, iw, ih), k = a.w / c.w;
  const at = { href: a.orig, x: -c.x * k, y: -a.h - c.y * k, width: iw * k, height: ih * k, preserveAspectRatio: 'none' };
  const ghost = svgEl('g', { transform: 'scale(1 -1)', opacity: 0.35, 'pointer-events': 'none' }); ghost.append(svgEl('image', at));
  const id = 'cropclip-' + a.id, clip = svgEl('clipPath', { id }); clip.append(svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h }));
  const inner = svgEl('g', { 'clip-path': `url(#${id})` }), flip = svgEl('g', { transform: 'scale(1 -1)' });
  flip.append(svgEl('image', at)); inner.append(flip);
  t.append(clip, ghost, svgEl('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: 'transparent' }), inner,
    svgEl('rect', { class: 'cropframe', x: 0, y: 0, width: a.w, height: a.h, fill: 'none', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }));
}
function commitEditor() {
  exitCrop();
  commitNote();
  if (!ED) return;
  const { v, a, ta, snap, orig, isNew, pushed } = ED; ED = null; ta.remove();
  if (!a.text.trim()) {
    const i = v.p.annots.indexOf(a); if (i >= 0) v.p.annots.splice(i, 1);
    if (!isNew && !pushed) pushSnap(snap);
    if (S.sel?.aid === a.id) S.sel = null;
  } else if ((a.text !== orig || isNew) && !pushed) pushSnap(snap);
  drawAnnots(v); updateProps(); updateUI();
}

/* ---------- Barre de propriétés ---------- */
const TOOL_CTX = { draw: 'ink', check: 'ink', cross: 'ink', rect: 'shape', ellipse: 'shape', line: 'shape', arrow: 'shape', ftext: 'field', fcheck: 'field' };
function updateProps(force) {
  if (CROP) {   // cadrage d'une image en cours
    const el = $('#props'), z = CROP.a.fit.zoom;
    propsKey = 'crop';
    el.innerHTML = `<span class="hint">Faites glisser l'image dans son cadre ; molette pour zoomer. Entrée pour valider.</span>
      <label>Zoom <input type="range" min="1" max="8" step="0.05" data-cropzoom value="${z}"></label>
      <button class="btn" data-act="cropcenter">Recentrer</button><button class="btn" data-act="cropok">${icon('check')}Valider</button>`;
    el.querySelector('[data-cropzoom]').addEventListener('input', e => setCropFit({ zoom: parseFloat(e.target.value) }));
    el.querySelector('[data-act=cropcenter]').addEventListener('click', () => setCropFit({ cx: 0.5, cy: 0.5 }));
    el.querySelector('[data-act=cropok]').addEventListener('click', exitCrop);
    return;
  }
  const a = selAnnot(), t = S.tool;
  let ctx = a ? (a.type === 'rect' ? (a.erase ? 'erase' : a.kind) : a.type === 'line' ? 'shape' : a.type) : t;
  ctx = TOOL_CTX[ctx] || ctx;
  const crop = S.pages[S.cur]?.crop;
  const key = ctx + '|' + selIds().join(',') + '|' + t + '|' + !!S.pendingSig + '|' + !!crop;
  if (key === propsKey && !force) return; propsKey = key;
  const el = $('#props'); let h = '';
  const color = (g, val, label = 'Couleur', k = 'color') => `<label>${label} <input type="color" data-g="${g}" data-k="${k}" value="${val}"></label>`;
  const swatches = (g, cur, list) => `<span class="swatches">${list.map(c => `<button class="swatch" data-g="${g}" data-k="color" data-v="${c}" style="background:${c}" aria-pressed="${c === cur}" aria-label="Couleur ${c}"></button>`).join('')}</span>`;
  if (!S.pages.length) h = '';
  else if (ctx === 'text' || ctx === 'edittext' && a) {
    const s = a || S.style.text;
    h = `<label><span class="sr">Police</span><select data-g="text" data-k="font">${Object.entries(FONTS).map(([k, f]) => `<option value="${k}"${k === s.font ? ' selected' : ''}>${f.label}</option>`).join('')}</select></label>
      ${hasFace(s.font, 'b') ? `<button class="btn icon toggle" data-g="text" data-k="bold" aria-pressed="${!!s.bold}" title="Gras" style="font-weight:700">G</button>` : ''}
      ${hasFace(s.font, 'i') ? `<button class="btn icon toggle" data-g="text" data-k="italic" aria-pressed="${!!s.italic}" title="Italique" style="font-style:italic;font-family:Georgia,serif">I</button>` : ''}
      <label>Taille <input type="number" min="4" max="200" step="0.5" data-g="text" data-k="size" value="${s.size}"></label>
      <label title="Distance entre les lignes, en multiple de la taille">Interligne <input type="number" min="0.6" max="4" step="0.05" data-g="text" data-k="lh" value="${s.lh || 1.2}"></label>
      <label title="Espace ajouté entre les lettres, en multiple de la taille">Espacement <input type="number" min="-0.2" max="1" step="0.01" data-g="text" data-k="ls" value="${s.ls || 0}"></label>${color('text', s.color)}`;
    if (!a) h += `<span class="hint">Cliquez sur la page pour écrire. Ctrl+Entrée pour valider.</span>`;
    else if (a.type === 'text' && selIds().length === 1) h += `<button class="btn" data-act="textlink" title="${a.link ? escHtml(linkLabel({ target: a.link })) : 'Rendre ce texte cliquable'}">${icon('link')}${a.link ? 'Modifier le lien' : 'Lien…'}</button>`
      + (a.link ? '<button class="btn" data-act="unlink">Retirer le lien</button>' : '');
  } else if (ctx === 'edittext') {
    h = `<span class="hint">Cliquez sur un texte du PDF pour le réécrire (zones repérées en bleu au survol). À l'enregistrement, l'ancien texte est réellement supprimé du fichier.</span>`;
  } else if (ctx === 'ink') {
    const s = a || S.style.ink;
    h = color('ink', s.color) + `<label>Épaisseur <input type="range" min="0.5" max="10" step="0.5" data-g="ink" data-k="width" value="${s.width}"></label>`;
    if (!a && (t === 'check' || t === 'cross')) h += `<label>Taille <input type="number" min="4" max="60" data-g="ink" data-k="mark" value="${S.style.ink.mark}"></label><span class="hint">Cliquez dans une case pour la cocher.</span>`;
  } else if (ctx === 'highlight') {
    h = swatches('highlight', (a || S.style.highlight).color, ['#ffd84d', '#8ef0a0', '#ff9ec7', '#8fd3ff']);
    if (!a) h += `<span class="hint">Faites glisser sur le texte (ou une zone) à surligner.</span>`;
  } else if (ctx === 'underline' || ctx === 'strike') {
    h = swatches(ctx, (a || S.style[ctx]).color, ['#1f8a4c', '#d0312d', '#1a3fb8', '#111111']);
    if (!a) h += `<span class="hint">Faites glisser sur le texte à ${ctx === 'underline' ? 'souligner' : 'barrer'}.</span>`;
  } else if (ctx === 'shape') {
    const s = a || S.style.shape, isLine = a ? a.type === 'line' : t === 'line' || t === 'arrow';
    const isRect = a ? a.type === 'shape' && a.kind === 'rect' : t === 'rect';
    // Épaisseur 0 : forme sans contour (fond de couleur seul)
    h = color('shape', s.stroke || '#111111', 'Trait', 'stroke') + `<label title="${isLine ? '' : '0 : sans contour'}">Épaisseur <input type="range" min="${isLine ? 0.5 : 0}" max="12" step="0.5" data-g="shape" data-k="width" value="${s.width}"></label>`;
    if (!isLine) h += `<label><input type="checkbox" data-fill ${s.fill ? 'checked' : ''}> Remplir</label><input type="color" data-fillcolor value="${s.fill || '#ffe08a'}" aria-label="Couleur de remplissage">`;
    if (isRect) h += `<label title="Rayon des coins, en points">Arrondi <input type="number" min="0" max="200" step="1" data-g="shape" data-k="rx" value="${s.rx || 0}"></label>`;
    if (!a) h += `<span class="hint">Faites glisser pour dessiner (Maj : ${isLine ? 'angles de 45°' : 'carré ou cercle'}).</span>`;
  } else if (ctx === 'note') {
    h = swatches('note', (a || S.style.note).color, ['#ffd84d', '#8ef0a0', '#ff9ec7', '#8fd3ff']);
    h += a ? `<button class="btn" data-act="opennote">Ouvrir la note</button>`
      : `<label>Votre nom <input data-author value="${escHtml(noteAuthor())}" style="width:130px;height:30px;border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:0 6px"></label><span class="hint">Cliquez sur la page pour ajouter une note.</span>`;
  } else if (ctx === 'stamp') {
    const s = S.style.stamp;
    h = `<label>Tampon <input data-g="stamp" data-k="text" list="stampList" value="${escHtml(s.text)}" style="width:170px;height:30px;border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:0 6px"></label>
      <datalist id="stampList">${STAMPS.map(x => `<option value="${x}">`).join('')}</datalist>
      ${swatches('stamp', s.color, Object.keys(STAMP_COLORS))}
      <button class="btn toggle" data-g="stamp" data-k="date" aria-pressed="${!!s.date}">Avec la date</button>
      <span class="hint">Cliquez sur la page pour apposer le tampon.</span>`;
  } else if (ctx === 'field') {
    if (a) h = `<label>Nom du champ <input data-fname value="${escHtml(a.name)}" style="width:160px;height:30px;border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:0 6px"></label>`
      + (a.kind === 'text' ? `<button class="btn toggle" data-fmulti aria-pressed="${!!a.multiline}">Plusieurs lignes</button>` : '');
    else h = `<span class="hint">${t === 'fcheck' ? 'Cliquez pour placer une case à cocher.' : 'Faites glisser pour dessiner un champ (ou cliquez pour une taille standard).'} Les champs seront remplissables dans tout lecteur PDF.</span>`;
  } else if (ctx === 'link') {
    h = a ? `<span class="hint">${escHtml(linkLabel(a))}</span><button class="btn" data-act="editlink">Modifier le lien</button>`
        + (a.target.kind === 'page' ? '<button class="btn" data-act="golink">Aller à la page</button>' : '')
      : '<span class="hint">Faites glisser sur le texte ou la zone à rendre cliquable (ou cliquez pour une taille standard), puis choisissez la destination.</span>';
  } else if (ctx === 'crop') {
    h = `<span class="hint">Faites glisser sur la partie de la page à garder.</span>`
      + (crop ? `<button class="btn" data-act="cropall">Appliquer à toutes les pages</button><button class="btn" data-act="cropoff">Retirer le recadrage</button>` : '');
  } else if (ctx === 'mask') {
    h = color('mask', (a || S.style.mask).color, 'Couleur du cache');
    if (!a) h += `<span class="hint">Faites glisser pour couvrir. Attention : le texte caché reste présent dans le fichier. Pour le supprimer, utilisez Caviarder.</span>`;
  } else if (ctx === 'redact') {
    h = color('redact', (a || S.style.redact).color, 'Couleur de la zone');
    if (!a) h += `<span class="hint">Faites glisser sur ce qui doit disparaître (ou Rechercher › Tout caviarder). À l'enregistrement, tout ce que la zone couvre est définitivement retiré du fichier, puis vérifié.</span>`;
  } else if (ctx === 'erase') {
    h = color('erase', a.color, 'Couleur du fond') + `<span class="hint">Le texte d'origine sous cette zone sera supprimé du fichier à l'enregistrement.</span>`;
  } else if (ctx === 'signature') {
    h = `<button class="btn" data-act="sig">${S.pendingSig ? 'Changer de signature' : 'Créer une signature'}</button>` + (S.pendingSig ? `<span class="hint">Cliquez sur la page pour placer la signature.</span>` : '');
  } else if (ctx === 'image') {
    h = a ? `<button class="btn" data-act="replaceimg" title="La nouvelle image est recadrée au centre pour remplir le même cadre">${icon('image')}Remplacer l'image…</button><button class="btn" data-act="cropimg" title="Ou double-cliquez sur l'image">${icon('crop')}Recadrer</button><span class="hint">Faites glisser pour déplacer, poignée bleue pour redimensionner.</span>`
          : `<button class="btn" data-act="img">${S.pendingImg ? "Changer d'image" : 'Choisir une image'}</button>` + (S.pendingImg ? '<span class="hint">Cliquez sur la page pour placer l\'image.</span>' : '');
  } else if (ctx === 'select') {
    h = `<span class="hint" title="Ctrl+A : tout sélectionner · Ctrl+C / Ctrl+V : copier-coller · Ctrl+D : dupliquer · Flèches : ajuster (Maj : ×10) · Alt en déplaçant : déplacer une copie · Ctrl en déplaçant : sans aimant">Cliquez sur un élément pour le déplacer, double-cliquez sur un texte pour le modifier. Maj+clic ou cadre tiré dans le vide : plusieurs éléments.</span>`;
  }
  if (a) {
    const n = selIds().length, texts = selAnnots().filter(x => baselineOf(x) != null).length;
    const ab = (k, ic, tip) => `<button class="btn icon" data-align="${k}" title="${tip}">${icon(ic)}</button>`;
    const db = (k, ic, tip) => `<button class="btn icon" data-dist="${k}" title="${tip}">${icon(ic)}</button>`;
    h += n > 1
      ? `<span class="aligns" role="group" aria-label="Aligner"><span class="hint">${n} éléments</span>${ab('left', 'alignL', 'Aligner à gauche')}${ab('hcenter', 'alignHC', 'Centrer horizontalement')}${ab('right', 'alignR', 'Aligner à droite')}`
        + `${ab('top', 'alignT', 'Aligner en haut')}${ab('vcenter', 'alignVC', 'Centrer verticalement')}${ab('bottom', 'alignB', 'Aligner en bas')}`
        + (texts > 1 ? ab('baseline', 'baseline', 'Aligner les lignes de base des textes sur le dernier sélectionné') : '')
        + (n > 2 ? db('h', 'distH', 'Répartir horizontalement') + db('v', 'distV', 'Répartir verticalement') : '') + '</span>'
      : `<span class="aligns" role="group" aria-label="Centrer sur la page">${ab('hcenter', 'alignHC', 'Centrer horizontalement sur la page')}${ab('vcenter', 'alignVC', 'Centrer verticalement sur la page')}</span>`;
    h += `<button class="btn danger" data-act="del" title="Supprimer (Suppr)">${icon('trash')}Supprimer</button>`;
  }
  el.innerHTML = h;
  el.querySelectorAll('[data-g]').forEach(c => {
    const ev = c.tagName === 'BUTTON' ? 'click' : 'change';
    c.addEventListener(ev, () => {
      let val = c.tagName === 'BUTTON' ? (c.dataset.v ?? c.getAttribute('aria-pressed') !== 'true') : c.type === 'number' || c.type === 'range' ? parseFloat(c.value) : c.value;
      if (typeof val === 'number' && !isFinite(val)) return;
      setStyle(c.dataset.g, c.dataset.k, val);
      if (c.classList.contains('toggle')) c.setAttribute('aria-pressed', val);
      if (c.classList.contains('swatch')) el.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', s === c));
    });
    if (c.type === 'range') c.addEventListener('input', () => { S.style[c.dataset.g][c.dataset.k] = parseFloat(c.value); });
  });
  const fill = el.querySelector('[data-fill]'), fillc = el.querySelector('[data-fillcolor]');
  if (fill) { const upd = () => setStyle('shape', 'fill', fill.checked ? fillc.value : ''); fill.addEventListener('change', upd); fillc.addEventListener('change', () => { fill.checked = true; upd(); }); }
  el.querySelector('[data-author]')?.addEventListener('change', e => { try { localStorage.setItem('atelierpdf.author', e.target.value.trim() || 'Utilisateur'); } catch {} });
  el.querySelector('[data-fname]')?.addEventListener('change', e => {
    const name = e.target.value.trim(); if (!name || name === a.name) return;
    if (S.pages.some(p => p.annots.some(x => x.type === 'field' && x !== a && x.name === name))) { toast('Un autre champ porte déjà ce nom.'); e.target.value = a.name; return; }
    snapshot(); a.name = name; redraw(S.sel.pid);
  });
  el.querySelector('[data-fmulti]')?.addEventListener('click', e => { snapshot(); a.multiline = !a.multiline; e.currentTarget.setAttribute('aria-pressed', a.multiline); });
  el.querySelector('[data-act=del]')?.addEventListener('click', deleteSel);
  el.querySelectorAll('[data-align]').forEach(b => b.addEventListener('click', () => alignSel(b.dataset.align)));
  el.querySelectorAll('[data-dist]').forEach(b => b.addEventListener('click', () => distributeSel(b.dataset.dist)));
  el.querySelector('[data-act=sig]')?.addEventListener('click', openSig);
  el.querySelector('[data-act=img]')?.addEventListener('click', () => $('#fileImage').click());
  el.querySelector('[data-act=cropimg]')?.addEventListener('click', () => { const v = V.get(S.sel.pid); if (v) enterCrop(v, a); });
  el.querySelector('[data-act=replaceimg]')?.addEventListener('click', () => { S.replacing = { pid: S.sel.pid, aid: a.id }; $('#fileImage').click(); });
  el.querySelector('[data-act=textlink]')?.addEventListener('click', () => { const v = V.get(S.sel.pid); if (v) editTextLink(v, a); });
  el.querySelector('[data-act=unlink]')?.addEventListener('click', () => { snapshot(); delete a.link; propsKey = ''; redraw(S.sel.pid); updateProps(); });
  el.querySelector('[data-act=opennote]')?.addEventListener('click', () => { const v = V.get(S.sel.pid); if (v) openNote(v, a); });
  el.querySelector('[data-act=cropall]')?.addEventListener('click', cropAll);
  el.querySelector('[data-act=editlink]')?.addEventListener('click', () => { const v = V.get(S.sel.pid); if (v) editLink(v, a); });
  el.querySelector('[data-act=golink]')?.addEventListener('click', () => { const i = S.pages.findIndex(p => p.id === a.target.page); if (i < 0) toast('Cette page a été supprimée.'); else scrollToPage(i); });
  el.querySelector('[data-act=cropoff]')?.addEventListener('click', () => { snapshot(); delete S.pages[S.cur].crop; redrawAll(); propsKey = ''; updateProps(); });
}
function setStyle(g, k, val) {
  S.style[g][k] = val;
  // Appliqué à tous les éléments sélectionnés du même genre (par exemple la police de plusieurs textes)
  const list = selAnnots().filter(a => groupOf(a) === g && a[k] !== val && (k !== 'fill' || a.type === 'shape'));
  if (list.length) { snapshot(); list.forEach(a => { a[k] = val; }); redraw(S.sel.pid); }
  if (g === 'text' && k === 'font') { propsKey = ''; updateProps(); }   // gras et italique selon la police
}
/* ---------- Copier, coller, dupliquer, déplacer au clavier ---------- */
function shiftAnnot(a, dx, dy) {
  if (a.type === 'ink') a.strokes = a.strokes.map(s => s.map(([x, y]) => [r2(x + dx), r2(y + dy)]));
  else if (a.type === 'line') Object.assign(a, { x1: r2(a.x1 + dx), y1: r2(a.y1 + dy), x2: r2(a.x2 + dx), y2: r2(a.y2 + dy) });
  else { a.x = r2(a.x + dx); a.y = r2(a.y + dy); }
}
let pasteN = 0;
function copySel(cut) {
  const list = selAnnots(); if (!list.length) return;
  S.clip = { list: list.map(clone), pid: S.sel.pid }; pasteN = 0;   // gardé d'un document à l'autre
  if (cut) deleteSel(); else toast(`${list.length > 1 ? `${list.length} éléments copiés` : 'Copié'}. Ctrl+V pour coller sur la page affichée.`, 2000);
}
function pasteClip() {
  if (!S.clip || !S.pages.length) return;
  const p = S.pages[S.cur] || S.pages[0], same = p.id === S.clip.pid;
  snapshot(); if (same) pasteN++;
  const ids = S.clip.list.map(o => {
    const a = clone(o); a.id = uid();
    if (a.type === 'field') a.name = fieldName(a.name);
    if (same) shiftAnnot(a, 12 * pasteN, -12 * pasteN);   // décalé pour rester visible
    p.annots.push(a); return a.id;
  });
  setTool('select'); selectMany(p.id, ids);
}
function nudgeSel(dx, dy) {
  const list = selAnnots(); if (!list.length) return;
  snapshot(); list.forEach(a => shiftAnnot(a, dx, dy)); redraw(S.sel.pid);
}
function selectAll() {
  const p = S.pages[S.cur]; if (!p) return;
  setTool('select'); selectMany(p.id, p.annots.filter(groupable).map(a => a.id));
}
function deleteSel() {
  const list = selAnnots(); if (!list.length) return;
  snapshot(); const p = S.pages.find(x => x.id === S.sel.pid);
  list.forEach(a => p.annots.splice(p.annots.indexOf(a), 1));
  const pid = S.sel.pid; S.sel = null; redraw(pid); updateProps(); renderComments();
}
// Même recadrage (en proportion de la page) sur toutes les pages
async function cropAll() {
  const ref = S.pages[S.cur], c = ref?.crop; if (!c) return;
  const v0 = (await getPdfPage(ref)).view, W0 = v0[2] - v0[0], H0 = v0[3] - v0[1];
  snapshot();
  for (const p of S.pages) {
    const [x0, y0, x1, y1] = (await getPdfPage(p)).view, W = x1 - x0, H = y1 - y0;
    p.crop = { x0: r2(x0 + (c.x0 - v0[0]) / W0 * W), y0: r2(y0 + (c.y0 - v0[1]) / H0 * H), x1: r2(x0 + (c.x1 - v0[0]) / W0 * W), y1: r2(y0 + (c.y1 - v0[1]) / H0 * H) };
  }
  redrawAll(); toast(`Recadrage appliqué aux ${S.pages.length} pages.`);
}

/* ---------- Miniatures & pages ---------- */
let dragId = null;
function renderThumbs() {
  const box = $('#thumbs'); box.replaceChildren(); tio?.disconnect();
  tio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { tio.unobserve(en.target); drawThumb(en.target); } }), { root: $('#side'), rootMargin: '400px' });
  S.pages.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'thumb'; d.draggable = true; d.dataset.id = p.id; d.tabIndex = 0;
    d.innerHTML = `<div class="tcanvas"><canvas></canvas></div><div class="tmeta"><span class="num">${i + 1}</span><span class="tact">
      <button data-act="rl" title="Pivoter à gauche" aria-label="Pivoter la page ${i + 1} à gauche">${icon('rotl')}</button>
      <button data-act="rr" title="Pivoter à droite" aria-label="Pivoter la page ${i + 1} à droite">${icon('rotr')}</button>
      <button data-act="del" class="del" title="Supprimer la page" aria-label="Supprimer la page ${i + 1}">${icon('trash')}</button></span></div>`;
    d.addEventListener('click', e => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'rl' || act === 'rr') { snapshot(); p.rot = (p.rot + (act === 'rr' ? 90 : 270)) % 360; rebuild(); }
      else if (act === 'del') {
        if (S.pages.length === 1) return toast('Le document doit garder au moins une page.');
        snapshot(); S.pages.splice(S.pages.indexOf(p), 1); rebuild(); toast(`Page ${i + 1} supprimée. Ctrl+Z pour annuler.`);
      } else scrollToPage(S.pages.indexOf(p));
    });
    d.addEventListener('keydown', e => { if (e.key === 'Enter') scrollToPage(S.pages.indexOf(p)); });
    d.addEventListener('dragstart', e => { dragId = p.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); d.classList.add('dragging'); });
    d.addEventListener('dragend', () => { dragId = null; box.querySelectorAll('.thumb').forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-after')); });
    d.addEventListener('dragover', e => {
      if (!dragId) return; e.preventDefault();
      const r = d.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      d.classList.toggle('drop-before', !after); d.classList.toggle('drop-after', after);
    });
    d.addEventListener('dragleave', () => d.classList.remove('drop-before', 'drop-after'));
    d.addEventListener('drop', e => {
      if (!dragId) return; e.preventDefault(); e.stopPropagation();
      const after = d.classList.contains('drop-after'), from = S.pages.findIndex(x => x.id === dragId);
      if (dragId === p.id || from < 0) return;
      snapshot(); const [m] = S.pages.splice(from, 1);
      S.pages.splice(S.pages.indexOf(p) + (after ? 1 : 0), 0, m); dragId = null; rebuild();
    });
    box.append(d); tio.observe(d);
  });
  $('#pageCount').textContent = S.pages.length ? S.pages.length : '';
  markActiveThumb();
}
async function drawThumb(d) {
  const p = S.pages.find(x => x.id === d.dataset.id); if (!p) return;
  const pg = await getPdfPage(p), rotation = ((pg.rotate || 0) + p.rot) % 360;
  const base = pg.getViewport({ scale: 1, rotation }), k = Math.min(132 / base.width, 170 / base.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2), vp = pg.getViewport({ scale: k * dpr, rotation });
  const c = d.querySelector('canvas'); c.width = vp.width; c.height = vp.height; c.style.width = vp.width / dpr + 'px'; c.style.height = vp.height / dpr + 'px';
  try { await pg.render({ canvasContext: c.getContext('2d'), viewport: vp, annotationMode: pdfjsLib.AnnotationMode.ENABLE }).promise; } catch {}
}
function scrollToPage(i) { const p = S.pages[i]; const v = p && V.get(p.id); if (v) $('#workspace').scrollTo({ top: v.wrap.offsetTop - 16, behavior: 'smooth' }); }
function markActiveThumb() {
  const id = S.pages[S.cur]?.id;
  document.querySelectorAll('.thumb').forEach(t => { const on = t.dataset.id === id; t.classList.toggle('active', on); });
}
function trackPage() {
  const ws = $('#workspace'), mid = ws.scrollTop + ws.clientHeight * 0.35;
  let cur = 0; S.pages.forEach((p, i) => { const v = V.get(p.id); if (v && v.wrap.offsetTop <= mid) cur = i; });
  if (cur !== S.cur) { S.cur = cur; markActiveThumb(); document.querySelector('.thumb.active')?.scrollIntoView({ block: 'nearest' }); }
  updateStatus();
}
const FORMATS = [['A4', 210, 297], ['A3', 297, 420], ['A5', 148, 210], ['Lettre US', 216, 279], ['Légal US', 216, 356]];
function updateStatus() {
  const p = S.pages[S.cur], v = p && V.get(p.id);
  $('#stPage').textContent = p ? `Page ${S.cur + 1} / ${S.pages.length}` : 'Aucun document';
  if (v) {
    const [x1, y1, x2, y2] = v.pg.view; let w = (x2 - x1) * 25.4 / 72, h = (y2 - y1) * 25.4 / 72;
    if (v.rotation % 180) [w, h] = [h, w];
    const f = FORMATS.find(([, a, b]) => (Math.abs(w - a) < 3 && Math.abs(h - b) < 3) || (Math.abs(w - b) < 3 && Math.abs(h - a) < 3));
    $('#stFormat').textContent = `${f ? f[0] + (w > h ? ' paysage' : '') + ' · ' : ''}${Math.round(w)} × ${Math.round(h)} mm`;
  } else $('#stFormat').textContent = '';
  $('#stFile').textContent = S.fileName ? S.fileName + '.pdf' : '';
  document.title = S.fileName ? `${S.dirty ? '• ' : ''}${S.fileName} – Atelier PDF` : 'Atelier PDF';
  $('#stDirty').innerHTML = (S.protect ? `<span title="Protégé par mot de passe à l'enregistrement">${icon('lock')}</span> ` : '')
    + (S.dirty ? '<span class="dirty">● Modifications non enregistrées</span>' : (S.pages.length ? 'Enregistré' : ''));
}
function updateUI() {
  $('#btnUndo').disabled = !S.undo.length; $('#btnRedo').disabled = !S.redo.length;
  document.querySelectorAll('.needdoc').forEach(b => b.disabled = !S.pages.length);
  $('#btnZoomFit').textContent = Math.round(S.zoom * 100) + ' %';
  updateStatus();
}

/* ---------- Zoom ---------- */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
async function fitZoom() {
  const p = S.pages[S.cur] || S.pages[0]; if (!p) return;
  const pg = await getPdfPage(p), vp = pg.getViewport({ scale: PX, rotation: ((pg.rotate || 0) + p.rot) % 360 });
  S.zoom = Math.max(0.25, Math.min(1.5, ($('#workspace').clientWidth - 64) / vp.width));
}
function zoomStep(dir) {
  const z = dir > 0 ? ZOOMS.find(x => x > S.zoom + 0.001) : [...ZOOMS].reverse().find(x => x < S.zoom - 0.001);
  if (z) { S.zoom = z; rebuild(); }
}

/* ---------- Pages blanches ---------- */
async function insertBlank() {
  const p = S.pages[S.cur]; let W = 595.28, H = 841.89;
  if (p) { const pg = await getPdfPage(p); const vp = pg.getViewport({ scale: 1, rotation: ((pg.rotate || 0) + p.rot) % 360 }); W = vp.width; H = vp.height; }
  const doc = await PDFLib.PDFDocument.create(); doc.addPage([W, H]);
  const src = await loadSource(await doc.save(), 'page blanche');
  snapshot(); S.pages.splice(S.cur + 1, 0, newPage(src.id, 0));
  await rebuild(); scrollToPage(S.cur + 1);
}

/* ---------- Export ---------- */
const WIN_FALLBACK = { '\t': '    ', '−': '-', '‐': '-', '‑': '-', ' ': ' ', ' ': ' ', ' ': ' ', '…': '...' };
function safeText(font, str) {
  let o = '';
  for (const ch of str) { try { font.encodeText(ch); o += ch; } catch { const f = WIN_FALLBACK[ch]; o += f ?? '?'; } }
  return o;
}
// Assemble les pages d'origine (copie, formulaires, rotation), sans les ajouts de l'utilisateur.
// fresh : toujours repartir d'un document vide (rien du fichier d'origine hors des pages copiées)
async function assemble(list, { fresh = false } = {}) {
  const { PDFDocument, degrees } = PDFLib;
  const libs = {};
  const lib = async id => libs[id] ??= await PDFDocument.load(S.sources[id].bytes, { ignoreEncryption: true });
  const identity = !fresh && S.sources.length && list.length === S.sources[0].pdf.numPages && list.every((p, i) => p.src === 0 && p.idx === i);
  let out;
  if (identity) { out = await lib(0); applyForm(out, 0); }
  else {
    out = await PDFDocument.create();
    for (const id of new Set(list.map(p => p.src))) { const d = await lib(id); if (applyForm(d, id)) { try { d.getForm().flatten(); } catch (e) { console.warn(e); } } }
    for (const p of list) { const [cp] = await out.copyPages(libs[p.src], [p.idx]); out.addPage(cp); }
    out.setTitle(S.fileName || 'Document');
  }
  out.getPages().forEach((page, i) => {
    const { rot: r, crop: c } = list[i];
    if (r) page.setRotation(degrees(((page.getRotation().angle || 0) + r) % 360));
    if (c) page.setCropBox(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
  });
  return out;
}
// Ajouts de la page + en-têtes, pieds de page, numéros et filigrane
async function annotsFor(list, i) {
  const p = list[i], pg = await getPdfPage(p);
  const ocr = (p.ocr || []).map(o => ({ type: 'ocr', ...o }));
  return [...ocr, ...decorFor(p, i, list.length, pg.view, ((pg.rotate || 0) + p.rot) % 360), ...p.annots];
}
// Note PDF native (/Text) avec son apparence : visible et modifiable dans les autres lecteurs
function addNoteAnnot(out, page, a) {
  const { PDFHexString, PDFString, PDFName } = PDFLib, ctx = out.context, [r, g, b] = hex2rgb(a.color);
  const ap = `q ${r} ${g} ${b} rg 0.48 0.42 0.11 RG 0.8 w 0.4 5 17.2 12.6 re B 3 5.4 m 3 0.4 l 8 5.4 l h B
    0.35 0.3 0.08 RG 1 w 1 J 4 14.5 m 14 14.5 l S 4 11.5 m 14 11.5 l S 4 8.5 m 10 8.5 l S Q`;
  const apRef = ctx.register(ctx.flateStream(ap, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, NOTE, NOTE] }));
  const date = PDFString.fromDate(new Date(a.date));
  const note = ctx.obj({ Type: 'Annot', Subtype: 'Text', Rect: [a.x, a.y, a.x + NOTE, a.y + NOTE], Contents: PDFHexString.fromText(a.text),
    T: PDFHexString.fromText(a.author || ''), M: date, CreationDate: date, NM: PDFHexString.fromText(a.id), Name: 'Comment', C: [r, g, b], F: 28, Open: false,
    AP: { N: apRef }, P: page.ref });
  const noteRef = ctx.register(note);
  const popRef = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Popup', Rect: [a.x + NOTE, a.y - 100, a.x + NOTE + 220, a.y + NOTE], Parent: noteRef, Open: false, F: 28 }));
  note.set(PDFName.of('Popup'), popRef);
  page.node.addAnnot(noteRef); page.node.addAnnot(popRef);
}
function addField(out, page, a) {
  const { rgb } = PDFLib, form = out.getForm();
  let name = a.name, n = 2; while (form.getFieldMaybe(name)) name = `${a.name} (${n++})`;
  const at = { x: a.x, y: a.y, width: a.w, height: a.h, borderWidth: 1, borderColor: rgb(0.55, 0.6, 0.65) };
  if (a.kind === 'check') form.createCheckBox(name).addToPage(page, at);
  else { const f = form.createTextField(name); if (a.multiline) f.enableMultiline(); f.addToPage(page, at); }
}

// Dessine les ajouts de l'utilisateur sur une page ; renvoie les textes écrits (pour la vérification)
async function paintAnnots(out, page, annots, cache) {
  const { StandardFonts, rgb, degrees, LineCapStyle, BlendMode, pushGraphicsState, popGraphicsState, setCharacterSpacing } = PDFLib;
  const fonts = cache.fonts ??= {}, imgs = cache.imgs ??= {}, drawn = [];
  const font = async name => fonts[name] ??= await out.embedFont(StandardFonts[name]);
  // Police intégrée : fichier de l'application, sous-ensemble des seuls caractères utilisés
  const custom = async file => {
    if (!fonts[file]) { out.registerFontkit(window.fontkit); fonts[file] = out.embedFont(await appBytes('fonts/' + file), { subset: true }); }
    return fonts[file];
  };
  const col = h => rgb(...hex2rgb(h));
  for (const a of annots) {
    if (a.type === 'rect' && (a.kind === 'underline' || a.kind === 'strike')) {
      const y = markLine(a), s = add([a.x, a.y], rot([0, y], a.r || 0)), e = add([a.x, a.y], rot([a.w, y], a.r || 0));
      page.drawLine({ start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: markWidth(a), color: col(a.color) });
    } else if (a.type === 'rect') {
      const o = { x: a.x, y: a.y, width: a.w, height: a.h, rotate: degrees(a.r || 0), color: col(a.color) };
      if (a.kind === 'highlight') { o.opacity = 0.4; if (BlendMode) o.blendMode = BlendMode.Multiply; }
      page.drawRectangle(o);
    } else if (a.type === 'shape') {
      const edge = a.stroke && a.width > 0;   // une épaisseur nulle laisserait un filet d'un pixel dans certains lecteurs
      const o = { borderColor: edge ? col(a.stroke) : undefined, borderWidth: edge ? a.width : 0, color: a.fill ? col(a.fill) : undefined, rotate: degrees(a.r || 0) };
      if (a.kind === 'ellipse') { const c = add([a.x, a.y], rot([a.w / 2, a.h / 2], a.r || 0)); page.drawEllipse({ ...o, x: c[0], y: c[1], xScale: a.w / 2, yScale: a.h / 2 }); }
      else if (radiusOf(a)) page.drawSvgPath(roundRectPath(a.w, a.h, radiusOf(a)), { ...o, x: a.x, y: a.y });
      else page.drawRectangle({ ...o, x: a.x, y: a.y, width: a.w, height: a.h });
    } else if (a.type === 'line') {
      const h = a.arrow ? arrowHead(a) : null, end = h ? h.base : [a.x2, a.y2];
      page.drawLine({ start: { x: a.x1, y: a.y1 }, end: { x: end[0], y: end[1] }, thickness: a.width, color: col(a.stroke), lineCap: h ? LineCapStyle.Butt : LineCapStyle.Round });
      if (h) page.drawSvgPath(`M${h.tip[0]} ${-h.tip[1]}L${h.l[0]} ${-h.l[1]}L${h.r[0]} ${-h.r[1]}Z`, { x: 0, y: 0, color: col(a.stroke), borderWidth: 0 });
    } else if (a.type === 'ocr') {   // texte reconnu : invisible, à la largeur du mot sur l'image
      const f = cache.helv ??= await out.embedFont(StandardFonts.Helvetica), str = safeText(f, a.str), unit = f.widthOfTextAtSize(str, 1);
      const { pushGraphicsState, popGraphicsState, setTextRenderingMode, TextRenderingMode } = PDFLib;
      page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));
      page.drawText(str, { x: a.x, y: a.y, size: unit > 0 ? Math.max(1, Math.min(a.fs * 3, a.w / unit)) : a.fs, font: f, rotate: degrees(a.r || 0) });
      page.pushOperators(popGraphicsState());
      drawn.push(str);
    } else if (a.type === 'link') {
      addLinkAnnot(out, page, a, cache);
    } else if (a.type === 'note') {
      addNoteAnnot(out, page, a);
    } else if (a.type === 'field') {
      addField(out, page, a);
    } else if (a.type === 'image') {
      const im = imgs[a.src] ??= await embedImage(out, a.src);
      if (a.orig && !imgs[a.orig]) imgs[a.orig] = await embedImage(out, a.orig);   // image complète, gardée pour recadrer plus tard
      page.drawImage(im, { x: a.x, y: a.y, width: a.w, height: a.h, rotate: degrees(a.r || 0) });
    } else if (a.type === 'text') {
      const fc = faceOf(a), f = fc.std ? await font(fc.std) : await custom(fc.file), tc = lsOf(a);
      if (tc) page.pushOperators(pushGraphicsState(), setCharacterSpacing(tc));
      a.text.split('\n').forEach((ln, k) => {
        if (!ln) return;
        const o = add([a.x, a.y], rot([0, -k * lhOf(a)], a.r || 0)), str = safeText(f, ln);
        page.drawText(str, { x: o[0], y: o[1], size: a.size, font: f, color: col(a.color), rotate: degrees(a.r || 0), opacity: a.opacity ?? 1 });
        drawn.push(str);
      });
      if (tc) page.pushOperators(popGraphicsState());
      if (a.link) { const b = annotBox(a); addLinkAnnot(out, page, { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0, target: a.link }, cache, true); }
    } else if (a.type === 'ink') {
      for (const st of a.strokes) {
        if (st.length === 1) { page.drawCircle({ x: st[0][0], y: st[0][1], size: a.width / 2, color: col(a.color) }); continue; }
        for (let k = 1; k < st.length; k++)
          page.drawLine({ start: { x: st[k - 1][0], y: st[k - 1][1] }, end: { x: st[k][0], y: st[k][1] }, thickness: a.width, color: col(a.color), lineCap: LineCapStyle.Round });
      }
    }
  }
  return drawn;
}

// Dessine une page : d'abord le reste, puis les ajouts réouvrables dans leur propre flux, décrit par le calque
async function paintPage(out, page, all, p, cache) {
  const mine = new Set(p.annots.filter(AtelierLayer.keep)), layer = all.filter(a => mine.has(a));
  const drawn = await paintAnnots(out, page, all.filter(a => !mine.has(a)), cache);
  if (!layer.length) return drawn;
  const refs = () => { const c = page.node.get(PDFLib.PDFName.of('Contents')); return c instanceof PDFLib.PDFArray ? c.asArray() : [c]; };
  const before = new Set(refs().map(r => r?.tag));
  page.getContentStream(false);   // nouveau flux, séparé de celui des autres ajouts
  drawn.push(...await paintAnnots(out, page, layer, cache));
  // Les images sont désignées par leur référence dans le fichier, pas recopiées dans la description
  const images = new Map(Object.entries(cache.imgs || {}).map(([src, im]) => [src, im.ref]));
  AtelierLayer.write(out, page, layer, refs().filter(r => r instanceof PDFLib.PDFRef && !before.has(r.tag)), { images, pageIndex: cache.pageIdx });
  return drawn;
}

async function saveDoc(out) {
  try { return await out.save(); }
  catch (e) { console.warn('Nouvel essai sans régénérer les champs', e); return await out.save({ updateFieldAppearances: false }); }
}
async function buildPdf(list, opts) {
  const out = await assemble(list, opts), pages = out.getPages(), cache = {};
  cache.pageRefs = new Map(list.map((p, i) => [p.id, pages[i].ref]));   // destinations des liens internes
  cache.pageIdx = new Map(list.map((p, i) => [p.id, i]));
  for (const i of list.keys()) await paintPage(out, pages[i], await annotsFor(list, i), list[i], cache);
  return saveDoc(out);
}

/* ---------- Caviardage : suppression réelle du contenu ---------- */
// Chaque page caviardée est d'abord nettoyée en vectoriel (js/redact.js) : lettres, images et dessins sous les zones
// sont retirés du flux de contenu, la page garde sa qualité d'origine. Si la page contient quelque chose que le
// moteur ne sait pas traiter avec certitude, ou si la vérification échoue, elle est réenregistrée en image avec un
// calque de texte invisible. Le fichier est ensuite reconstruit, relu et vérifié avant d'être écrit sur le disque.
const REDACT_DPI = 200;
const isRedact = a => a.type === 'rect' && a.kind === 'redact';
const quad = (x, y, r, x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(q => add([x, y], rot(q, r)));
const bbox = pts => ({ x0: Math.min(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), x1: Math.max(...pts.map(p => p[0])), y1: Math.max(...pts.map(p => p[1])) });
const hits = (b, z, m = 0) => b.x0 < z.x1 + m && b.x1 > z.x0 - m && b.y0 < z.y1 + m && b.y1 > z.y0 - m;
const within = (b, z, m = 0) => b.x0 >= z.x0 + m && b.x1 <= z.x1 - m && b.y0 >= z.y0 + m && b.y1 <= z.y1 - m;
const zoneOf = a => { const pts = quad(a.x, a.y, a.r || 0, 0, 0, a.w, a.h); return { pts, ...bbox(pts), color: a.color, user: !a.erase }; };
const zonesOf = p => p.annots.filter(isRedact).map(zoneOf);
const annotBox = a => { const fr = frameOf(a), b = localBox(a); return bbox(quad(fr.x, fr.y, fr.r, b.x0, b.y0, b.x1, b.y1)); };
// Un ajout de l'utilisateur recouvert ensuite par une zone noire disparaît lui aussi
// (le texte reconnu par OCR disparaît sous toute zone, y compris celle d'un texte remplacé)
// (un lien qui touche une zone noire disparaît quel que soit l'ordre : son adresse pourrait trahir le contenu caché)
const visibleAnnots = annots => annots.filter((a, k) => isRedact(a) || !annots.some((z, j) => isRedact(z) && (j > k || (a.type === 'link' && !z.erase))
  && (!z.erase || a.type === 'ocr') && hits(annotBox(a), zoneOf(z))));
const openPdfjs = (bytes, password) => pdfjsLib.getDocument({
  data: bytes.slice(), password, cMapUrl: PDFJS_BASE + 'cmaps/', cMapPacked: true, standardFontDataUrl: PDFJS_BASE + 'standard_fonts/',
  wasmUrl: PDFJS_BASE + 'wasm/', iccUrl: PDFJS_BASE + 'iccs/', enableXfa: false,
}).promise;

// Mots d'un élément de texte pdf.js, avec leur boîte (position estimée au prorata de la largeur)
const HELV = { font: 'Helvetica', bold: false, size: 100 };
function textWords(it) {
  const [a, b, c, d, e, f] = it.transform;
  const r = Math.atan2(b, a) * 180 / Math.PI, fs = Math.hypot(c, d) || it.height || 10;
  const total = measure(it.str, HELV) || 1, k = (it.width || total * fs / 100) / total;
  return [...it.str.matchAll(/\S+/g)].map(m => {
    const i0 = m.index, i1 = m.index + m[0].length;
    const s0 = measure(it.str.slice(0, i0), HELV) * k, s1 = measure(it.str.slice(0, i1), HELV) * k;
    return { it, i0, i1, str: m[0], x: e, y: f, r, fs, s0, s1, box: bbox(quad(e, f, r, s0, -fs * 0.3, s1, fs)) };
  });
}
async function pageWords(pg) {
  const words = (await pg.getTextContent()).items.filter(it => it.str?.trim()).flatMap(textWords);
  words.forEach((w, k) => { w.after = words[k + 1]; });
  return words;
}
// Regroupe les mots conservés consécutifs d'un même élément en une seule ligne (copier-coller naturel)
function textRuns(words) {
  const runs = [];
  for (const w of words) {
    const last = runs[runs.length - 1];
    if (last && last.it === w.it && last.next === w) { last.i1 = w.i1; last.s1 = w.s1; last.next = w.after; continue; }
    runs.push({ ...w, next: w.after });
  }
  return runs.map(r => ({ ...r, str: r.it.str.slice(r.i0, r.i1), w: r.s1 - r.s0 }));
}
const sensitiveTokens = s => (s.match(/[\p{L}\p{N}][\p{L}\p{N}@._'-]*[\p{L}\p{N}]/gu) || []).filter(t => t.length >= 3);

async function rasterize(pg, zones) {
  const base = pg.getViewport({ scale: 1, rotation: 0 });
  const s = Math.min(REDACT_DPI / 72, 8000 / Math.max(base.width, base.height), Math.sqrt(40e6 / (base.width * base.height)));
  const vp = pg.getViewport({ scale: s, rotation: 0 });
  const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: ctx, viewport: vp, annotationMode: pdfjsLib.AnnotationMode.ENABLE }).promise;
  // Les annotations du PDF (tampons, champs) s'affichent au-dessus du contenu : on repeint les zones par-dessus tout
  for (const z of zones) {
    ctx.beginPath();
    z.pts.forEach((p, k) => { const [x, y] = vp.convertToViewportPoint(p[0], p[1]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.fillStyle = ctx.strokeStyle = z.color; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
  }
  const url = c.toDataURL('image/jpeg', 0.92);
  c.width = c.height = 0;
  return url;
}

// Vide une page de tout son contenu d'origine (le dessin est refait ensuite)
function blankPage(doc, page) {
  const { PDFName } = PDFLib, n = page.node;
  for (const k of ['Annots', 'B', 'Thumb', 'PieceInfo', 'Metadata', 'AA', 'StructParents', 'Group', 'SeparationInfo', 'VP']) n.delete(PDFName.of(k));
  n.set(PDFName.of('Contents'), doc.context.obj([]));
  n.set(PDFName.of('Resources'), doc.context.obj({ Font: {}, XObject: {}, ExtGState: {} }));
}

// Repli : page en image + texte invisible pour la recherche
async function rasterPage(doc, page, pg, inf, cache) {
  const { StandardFonts, degrees, pushGraphicsState, popGraphicsState, setTextRenderingMode, TextRenderingMode } = PDFLib;
  const font = cache.helv ??= await doc.embedFont(StandardFonts.Helvetica);
  const img = await doc.embedJpg(await rasterize(pg, inf.zones)), [x0, y0, x1, y1] = pg.view;
  blankPage(doc, page);
  page.drawImage(img, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
  const layer = [];
  page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));
  for (const w of textRuns(inf.keep)) {
    const str = safeText(font, w.str), unit = font.widthOfTextAtSize(str, 1);
    const size = unit > 0 ? Math.min(w.fs * 2, Math.max(w.fs * 0.5, w.w / unit)) : w.fs;   // même largeur que l'original
    const o = add([w.x, w.y], rot([w.s0, 0], w.r));
    page.drawText(str, { x: o[0], y: o[1], size, font, rotate: degrees(w.r) });
    layer.push(str);
  }
  page.pushOperators(popGraphicsState());
  return layer;
}

// Copies fantômes de pages (entraînées par un lien ou un champ qui pointait vers une page) : on les vide aussi
function neutralizeGhostPages(doc) {
  const { PDFDict, PDFName } = PDFLib, real = new Set(doc.getPages().map(p => p.ref.tag));
  for (const [ref, o] of doc.context.enumerateIndirectObjects()) {
    if (!(o instanceof PDFDict) || o.get(PDFName.of('Type')) !== PDFName.of('Page') || real.has(ref.tag)) continue;
    for (const k of ['Annots', 'Parent', 'B', 'Thumb', 'PieceInfo', 'Metadata']) o.delete(PDFName.of(k));
    o.set(PDFName.of('Contents'), doc.context.obj([]));
    o.set(PDFName.of('Resources'), doc.context.obj({}));
  }
}

// Supprime tout objet qui n'est plus atteignable depuis le catalogue : pdf-lib écrirait sinon l'ancien contenu
function collectGarbage(doc) {
  const { PDFRef, PDFDict, PDFArray, PDFStream } = PDFLib, ctx = doc.context, seen = new Set(), stack = [];
  const push = o => { if (o) stack.push(o); };
  push(ctx.trailerInfo.Root); push(ctx.trailerInfo.Info); push(ctx.trailerInfo.Encrypt);
  while (stack.length) {
    const o = stack.pop();
    if (o instanceof PDFRef) { if (!seen.has(o.tag)) { seen.add(o.tag); push(ctx.lookup(o)); } }
    else if (o instanceof PDFDict) for (const [, v] of o.entries()) push(v);
    else if (o instanceof PDFArray) for (let i = 0; i < o.size(); i++) push(o.get(i));
    else if (o instanceof PDFStream) push(o.dict);
  }
  for (const [ref] of ctx.enumerateIndirectObjects()) if (!seen.has(ref.tag)) ctx.delete(ref);
}

async function exportPdf(list) {
  const red = list.flatMap((p, i) => p.annots.some(isRedact) ? [i] : []);
  if (!red.length) return { bytes: await buildPdf(list) };
  await workerReady;
  const base = await saveDoc(await assemble(list, { fresh: true }));   // pages d'origine, sans les ajouts
  const src = await openPdfjs(base);
  try {
    // Mots d'origine de chaque page caviardée : calque de texte (repli en image) et contrôle indépendant
    const info = new Map();
    for (const i of red) {
      const zones = zonesOf(list[i]), words = await pageWords(await src.getPage(i + 1));
      const keep = [], removed = new Set(), gone = new Set();
      for (const w of words) {
        const z = zones.find(z => hits(w.box, z, w.fs * 0.15));
        if (!z) keep.push(w); else if (z.user) sensitiveTokens(w.str).forEach(t => removed.add(t));
      }
      // Mots entièrement sous une zone, absents du reste de la page : ils ne doivent plus apparaître du tout
      const outside = new Set(keep.flatMap(w => sensitiveTokens(w.str)));
      const own = list[i].annots.filter(a => a.type === 'text').map(a => a.text).join(' ');
      for (const w of words) if (zones.some(z => within(w.box, z, -w.fs * 0.1))) sensitiveTokens(w.str).forEach(t => { if (!outside.has(t) && !own.includes(t)) gone.add(t); });
      info.set(i, { zones, keep, removed, gone });
    }
    const raster = new Set();
    for (;;) {
      const r = await produce(list, base, src, info, raster);
      if (!r.problems.length) {
        const user = list.some(p => p.annots.some(a => isRedact(a) && !a.erase));
        return { bytes: r.bytes, report: { elsewhere: r.elsewhere, pages: red.length, raster: [...raster].map(i => i + 1), user } };
      }
      const retry = r.bad.filter(i => !raster.has(i));
      if (!retry.length) { const e = new Error(r.problems.join(' ; ')); e.redaction = true; throw e; }
      console.info('Caviardage : passage en image des pages', retry.map(i => i + 1), r.problems);
      retry.forEach(i => raster.add(i));
    }
  } finally { src.loadingTask.destroy(); }
}

async function produce(list, base, src, info, raster) {
  const doc = await PDFLib.PDFDocument.load(base), pages = doc.getPages(), drawn = new Map(), layers = new Map();
  const cache = { pageRefs: new Map(list.map((p, i) => [p.id, pages[i].ref])), pageIdx: new Map(list.map((p, i) => [p.id, i])) };
  for (const [i, p] of list.entries()) {
    const inf = info.get(i);
    const all = await annotsFor(list, i);
    if (!inf) { await paintPage(doc, pages[i], all, p, cache); continue; }
    if (!raster.has(i)) {
      try { await AtelierRedact.cleanPage(doc, pages[i], inf.zones); }
      catch (e) {
        if (!(e instanceof AtelierRedact.Unsupported)) console.warn(e);
        console.info(`Caviardage page ${i + 1} en image : ${e.message}`);
        raster.add(i);
      }
    }
    if (raster.has(i)) layers.set(i, await rasterPage(doc, pages[i], await src.getPage(i + 1), inf, cache));
    drawn.set(i, await paintPage(doc, pages[i], visibleAnnots(all), p, cache));   // rien de caché n'entre dans le calque
  }
  neutralizeGhostPages(doc);
  collectGarbage(doc);
  const bytes = await saveDoc(doc);
  return { bytes, ...(await verifyRedaction(bytes, info, raster, layers, drawn)) };
}

// Relit le fichier produit. Pages en image : une image + le texte que nous y avons mis. Pages vectorielles : plus
// aucune lettre, image ou dessin sous les zones (relecture du flux) et aucun mot caché lisible (relecture pdf.js).
// Partout : aucune copie cachée de page. Liste aussi les mots supprimés qui figurent encore ailleurs.
async function verifyRedaction(bytes, info, raster, layers, drawn) {
  const { PDFDocument, PDFDict, PDFArray, PDFName } = PDFLib;
  const problems = [], bad = new Set(), elsewhere = new Map();
  const fail = (i, msg) => { problems.push(`page ${i + 1} : ${msg}`); bad.add(i); };
  const doc = await PDFDocument.load(bytes), pages = doc.getPages(), real = new Set(pages.map(p => p.ref.tag));
  for (const [ref, o] of doc.context.enumerateIndirectObjects()) {
    if (!(o instanceof PDFDict) || o.get(PDFName.of('Type')) !== PDFName.of('Page') || real.has(ref.tag)) continue;
    const c = o.lookup(PDFName.of('Contents'));
    if (!(c instanceof PDFArray) || c.size()) problems.push('une copie cachée de page contient encore du contenu');
  }
  for (const [i, inf] of info) {
    if (raster.has(i)) {
      const xo = pages[i].node.Resources()?.lookup(PDFName.of('XObject'));
      if (xo instanceof PDFDict && xo.entries().some(([, v]) => doc.context.lookup(v)?.dict?.get(PDFName.of('Subtype')) !== PDFName.of('Image'))) fail(i, "un élément d'origine subsiste");
    } else (await AtelierRedact.auditPage(doc, pages[i], inf.zones)).forEach(m => fail(i, m));
  }
  const removed = new Set([...info.values()].flatMap(inf => [...inf.removed]));
  const pdf = await openPdfjs(bytes);
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n), i = n - 1;
      const items = (await pg.getTextContent()).items.filter(it => it.str?.trim());
      let txt = items.map(it => it.str).join(' ');
      if (info.has(i)) {
        const own = (drawn.get(i) || []).join(' ');
        if (raster.has(i)) {
          const pool = new Map();
          for (const s of [...(layers.get(i) || []), ...(drawn.get(i) || [])]) for (const t of s.split(/\s+/)) pool.set(t, (pool.get(t) || 0) + 1);
          for (const t of items.flatMap(it => it.str.split(/\s+/)).filter(Boolean)) {
            if (pool.get(t)) pool.set(t, pool.get(t) - 1); else { fail(i, "du texte d'origine subsiste"); break; }
          }
        } else for (const t of info.get(i).gone) if (txt.includes(t) && !own.includes(t)) { fail(i, `le mot caché « ${t} » est encore lisible`); break; }
      }
      for (const an of await pg.getAnnotations()) txt += ' ' + (an.contentsObj?.str || '') + ' ' + (an.fieldValue || '');
      txt = txt.toLocaleLowerCase('fr');
      for (const w of removed) if (txt.includes(w.toLocaleLowerCase('fr'))) { if (!elsewhere.has(w)) elsewhere.set(w, []); elsewhere.get(w).push(n); }
    }
  } finally { pdf.loadingTask.destroy(); }
  return { problems: [...new Set(problems)], bad: [...bad], elsewhere };
}
function redactionMessage(r) {
  if (!r.user) return '';
  let m = ` Caviardage vérifié : contenu supprimé sur ${r.pages} page${r.pages > 1 ? 's' : ''}`;
  m += r.raster.length ? ` (page${r.raster.length > 1 ? 's' : ''} ${r.raster.join(', ')} enregistrée${r.raster.length > 1 ? 's' : ''} en image).` : ', qualité d\'origine conservée.';
  const left = [...r.elsewhere].slice(0, 3).map(([w, p]) => `« ${w} » (page${p.length > 1 ? 's' : ''} ${p.join(', ')})`);
  if (left.length) m += ` Attention, figure encore ailleurs : ${left.join(', ')}${r.elsewhere.size > 3 ? '…' : ''}.`;
  return m;
}

/* ---------- Fichiers produits ---------- */
// Choisit où écrire un fichier (application Windows, navigateur avec sélecteur, ou simple téléchargement)
async function pickOutput(name, ext = 'pdf', label = 'Document PDF', mime = 'application/pdf') {
  if (window.desktop) { const p = await window.desktop.pickSave(name, S.dir, ext, label); return p ? { kind: 'desk', name: p.split(/[\\/]/).pop() } : null; }
  if (window.showSaveFilePicker) {
    try { const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: label, accept: { [mime]: ['.' + ext] } }] }); return { kind: 'fs', h, name: h.name }; }
    catch (e) { if (e.name === 'AbortError') return null; }
  }
  return { kind: 'dl', name, mime };
}
function download(name, bytes, mime) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function writeOutput(o, bytes) {
  if (o.kind === 'desk') return window.desktop.writeFile(bytes);
  if (o.kind === 'fs') { const w = await o.h.createWritable(); await w.write(bytes); await w.close(); return; }
  download(o.name, bytes, o.mime);
}
// Plusieurs fichiers dans un dossier (diviser, exporter en images)
async function pickFolder() {
  if (window.desktop) { const d = await window.desktop.pickDir(S.dir); return d ? { kind: 'desk', dir: d } : null; }
  if (window.showDirectoryPicker) { try { return { kind: 'fs', h: await window.showDirectoryPicker({ mode: 'readwrite' }) }; } catch (e) { if (e.name === 'AbortError') return null; } }
  return { kind: 'dl' };
}
async function writeInFolder(f, name, bytes, mime) {
  if (f.kind === 'desk') return window.desktop.writeInDir(name, bytes);
  if (f.kind === 'fs') { const w = await (await f.h.getFileHandle(name, { create: true })).createWritable(); await w.write(bytes); await w.close(); return; }
  download(name, bytes, mime);
}

const isIdentity = list => S.sources.length && list.length === S.sources[0].pdf.numPages && list.every((p, i) => p.src === 0 && p.idx === i);
// Dernière étape commune : propriétés, signets, nettoyage, objets inutiles, mot de passe
async function finalizePdf(bytes, list, { redacted = false, protect = S.protect } = {}) {
  const { PDFDocument, PDFName } = PDFLib;
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const m = S.meta, toDate = s => { try { return s ? pdfjsLib.PDFDateString.toDateObject(s) : null; } catch { return null; } };
  doc.setTitle(m.title || S.fileName || ''); doc.setAuthor(m.author || ''); doc.setSubject(m.subject || '');
  doc.setKeywords(m.keywords ? m.keywords.split(/\s*[,;]\s*/).filter(Boolean) : []);
  doc.setCreator(m.creator || 'Atelier PDF'); doc.setProducer('Atelier PDF');
  const created = toDate(m.created); if (created) doc.setCreationDate(created);
  doc.setModificationDate(new Date());
  if (S.metaEdited) doc.catalog.delete(PDFName.of('Metadata'));   // l'ancienne fiche XMP contredirait les nouvelles propriétés
  if (!redacted && !isIdentity(list)) addOutline(doc, list);
  if (S.clean) AtelierSanitize.clean(doc, S.clean);
  collectGarbage(doc);
  let out = await doc.save();
  if (protect) out = await AtelierCrypt.encryptBytes(out, protect);
  return out;
}
// Reconstruit les signets des documents d'origine pour les pages conservées
function addOutline(doc, list) {
  const { PDFHexString, PDFName } = PDFLib, ctx = doc.context, refs = doc.getPages().map(p => p.ref), where = new Map();
  list.forEach((p, i) => { const k = `${p.src}:${p.idx}`; if (!where.has(k)) where.set(k, i); });
  const conv = (src, items) => items.map(it => ({ title: it.title, page: it.idx == null ? null : where.get(`${src}:${it.idx}`), items: conv(src, it.items) }))
    .filter(it => it.page != null || it.items.length);
  const withOutline = S.sources.filter(s => s.outline?.length && list.some(p => p.src === s.id));
  let tree = withOutline.length > 1
    ? withOutline.map(s => ({ title: s.name.replace(/\.pdf$/i, ''), page: where.get(`${s.id}:0`) ?? null, items: conv(s.id, s.outline) }))
    : withOutline.flatMap(s => conv(s.id, s.outline));
  tree = tree.filter(it => it.page != null || it.items.length);
  if (!tree.length) return;
  const rootRef = ctx.nextRef();
  const make = (items, parent) => {
    const r = items.map(() => ctx.nextRef()); let n = 0;
    items.forEach((it, k) => {
      const d = ctx.obj({ Title: PDFHexString.fromText(it.title || ''), Parent: parent });
      if (k) d.set(PDFName.of('Prev'), r[k - 1]);
      if (k < items.length - 1) d.set(PDFName.of('Next'), r[k + 1]);
      if (it.page != null) d.set(PDFName.of('Dest'), ctx.obj([refs[it.page], 'XYZ', null, null, null]));
      const kids = make(it.items, r[k]);
      if (kids.n) { d.set(PDFName.of('First'), kids.first); d.set(PDFName.of('Last'), kids.last); d.set(PDFName.of('Count'), ctx.obj(-kids.n)); }
      ctx.assign(r[k], d); n++;
    });
    return { first: r[0], last: r[r.length - 1], n };
  };
  const top = make(tree, rootRef);
  ctx.assign(rootRef, ctx.obj({ Type: 'Outlines', First: top.first, Last: top.last, Count: top.n }));
  doc.catalog.set(PDFName.of('Outlines'), rootRef);
}

// Construit le PDF final d'une liste de pages : { bytes, report }
async function producePdf(list, opts) {
  const { bytes, report } = await exportPdf(list);
  return { bytes: await finalizePdf(bytes, list, { redacted: !!report, ...opts }), report };
}
async function saveFlow(list, name) {
  commitEditor();
  if (!list.length) return;
  const o = await pickOutput(name); if (!o) return false;
  const redacting = list.some(p => p.annots.some(isRedact));
  busy(true, redacting ? 'Caviardage et vérification…' : 'Création du PDF…');
  try {
    const { bytes, report } = await producePdf(list);
    const extra = (report ? redactionMessage(report) : '') + (S.protect ? ' Document protégé par mot de passe.' : '');
    const ms = report?.elsewhere.size ? 12000 : extra ? 7000 : 3500;
    await writeOutput(o, bytes);
    toast(`${o.kind === 'dl' ? 'Téléchargé' : 'Enregistré'} : ${o.name}.${extra}`, ms);
    return true;
  } catch (e) {
    console.error(e);
    if (e.redaction) { toast(`Rien n'a été enregistré : la vérification du caviardage a échoué (${e.message}).`, 10000); return false; }
    toast("L'enregistrement a échoué. Le fichier est peut-être ouvert dans un autre logiciel, ou protégé contre la modification.", 7000); return false;
  } finally { busy(false); }
}
async function save() {
  if (!S.pages.length) return;
  if (await saveFlow(S.pages, `${S.fileName || 'document'}-modifié.pdf`)) { S.dirty = false; updateUI(); }
}

/* ---------- Extraction ---------- */
function parseRange(str, n) {
  const out = [];
  for (const part of str.split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d*))?$/); if (!m) return null;
    const a = +m[1], b = m[2] === undefined ? a : (m[2] === '' ? n : +m[2]);
    if (a < 1 || b < 1 || a > n || b > n) return null;
    for (let i = a; a <= b ? i <= b : i >= b; i += a <= b ? 1 : -1) out.push(i - 1);
  }
  return out.length ? out : null;
}
function openExtract() {
  commitEditor(); $('#extractCount').textContent = S.pages.length; $('#extractErr').textContent = '';
  $('#extractInput').value = `${S.cur + 1}`; $('#extractDlg').showModal(); $('#extractInput').select();
}
$('#extractForm').addEventListener('submit', async e => {
  if (e.submitter?.value !== 'ok') return;
  e.preventDefault();
  const idx = parseRange($('#extractInput').value, S.pages.length);
  if (!idx) { $('#extractErr').textContent = `Écrivez des numéros entre 1 et ${S.pages.length}, par exemple 1-3, 5.`; return; }
  $('#extractDlg').close();
  const label = $('#extractInput').value.replace(/\s+/g, '').replace(/[^\d,-]/g, '');
  await saveFlow(idx.map(i => S.pages[i]), `${S.fileName || 'document'}-pages-${label}.pdf`);
});

/* ---------- Signature ---------- */
const pad = $('#sigPad'), typeC = $('#sigTypeCanvas');
let sigInk = '#111111', sigMode = 'draw', padDirty = false, padPts = null;
function sizeCanvas(c) { const r = c.getBoundingClientRect(), d = 2; c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); const ctx = c.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); return ctx; }
function loadSaved() { try { return JSON.parse(localStorage.getItem('atelierpdf.sigs') || '[]'); } catch { return []; } }
function storeSaved(list) { try { localStorage.setItem('atelierpdf.sigs', JSON.stringify(list)); } catch {} }
function renderSaved() {
  const list = loadSaved(), box = $('#sigSaved'); box.replaceChildren(); $('#sigSavedWrap').hidden = !list.length;
  list.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'saved'; d.title = 'Utiliser cette signature';
    d.innerHTML = `<img alt="Signature enregistrée ${i + 1}" src="${s.src}"><button type="button" aria-label="Oublier cette signature">×</button>`;
    d.addEventListener('click', e => {
      if (e.target.closest('button')) { list.splice(i, 1); storeSaved(list); renderSaved(); return; }
      useSignature(s); $('#sigDlg').close();
    });
    box.append(d);
  });
}
function openSig() {
  commitEditor(); $('#sigDlg').showModal(); sizeCanvas(pad); sizeCanvas(typeC); padDirty = false; drawTyped(); renderSaved();
}
function setSigMode(m) {
  sigMode = m; $('#sigDrawPane').hidden = m !== 'draw'; $('#sigTypePane').hidden = m !== 'type';
  document.querySelectorAll('#sigTabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === m));
  if (m === 'type') { sizeCanvas(typeC); drawTyped(); $('#sigText').focus(); } else sizeCanvas(pad);
}
document.querySelectorAll('#sigTabs button').forEach(b => b.addEventListener('click', () => setSigMode(b.dataset.tab)));
document.querySelectorAll('#sigColors .swatch').forEach(b => b.addEventListener('click', () => {
  sigInk = b.dataset.c; document.querySelectorAll('#sigColors .swatch').forEach(x => x.setAttribute('aria-pressed', x === b)); drawTyped();
}));
pad.addEventListener('pointerdown', e => {
  pad.setPointerCapture(e.pointerId); const r = pad.getBoundingClientRect(); padPts = [[e.clientX - r.left, e.clientY - r.top]];
  const ctx = pad.getContext('2d'); ctx.fillStyle = sigInk; ctx.beginPath(); ctx.arc(padPts[0][0], padPts[0][1], 1.3, 0, 7); ctx.fill(); padDirty = true;
});
pad.addEventListener('pointermove', e => {
  if (!padPts) return; const r = pad.getBoundingClientRect(), ctx = pad.getContext('2d');
  for (const ce of (e.getCoalescedEvents?.() || [e])) {
    const P = [ce.clientX - r.left, ce.clientY - r.top], L = padPts[padPts.length - 1], LL = padPts[padPts.length - 2] || L;
    ctx.strokeStyle = sigInk; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo((LL[0] + L[0]) / 2, (LL[1] + L[1]) / 2); ctx.quadraticCurveTo(L[0], L[1], (L[0] + P[0]) / 2, (L[1] + P[1]) / 2); ctx.stroke();
    padPts.push(P);
  }
});
['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, () => padPts = null));
$('#sigClear').addEventListener('click', () => { if (sigMode === 'draw') { pad.getContext('2d').clearRect(0, 0, pad.width, pad.height); padDirty = false; } else { $('#sigText').value = ''; drawTyped(); } });
$('#sigText').addEventListener('input', drawTyped);
async function drawTyped() {
  const ctx = typeC.getContext('2d'); const w = typeC.width / 2, h = typeC.height / 2; ctx.clearRect(0, 0, w, h);
  const txt = $('#sigText').value.trim(); if (!txt) return;
  try { await document.fonts.load('600 60px "Dancing Script"'); } catch {}
  let size = 64; ctx.font = `600 ${size}px "Dancing Script", "Segoe Script", cursive`;
  while (ctx.measureText(txt).width > w - 40 && size > 20) { size -= 2; ctx.font = `600 ${size}px "Dancing Script", "Segoe Script", cursive`; }
  ctx.fillStyle = sigInk; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(txt, w / 2, h / 2);
}
function trim(c) {
  const ctx = c.getContext('2d'), { width: W, height: H } = c, d = ctx.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const m = 8; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return { src: o.toDataURL('image/png'), w: o.width, h: o.height };
}
function useSignature(s) {
  S.pendingSig = s; propsKey = '';
  if (S.tool !== 'signature') setTool('signature'); else updateProps(true);
  toast('Cliquez sur la page à l\'endroit où signer.');
}
$('#sigForm').addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  const s = trim(sigMode === 'draw' ? pad : typeC);
  if (!s) { e.preventDefault(); toast(sigMode === 'draw' ? 'Dessinez votre signature dans le cadre.' : 'Tapez votre nom pour créer la signature.'); return; }
  const list = loadSaved().filter(x => x.src !== s.src); list.unshift(s); storeSaved(list.slice(0, 5));
  useSignature(s);
});
$('#sigDlg').addEventListener('close', () => { if (S.tool === 'signature' && !S.pendingSig) setTool('select'); });

/* ---------- Exemple ---------- */
async function sampleFile() {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const doc = await PDFDocument.create(); doc.setTitle("Bulletin d'adhésion (exemple)");
  const f = await doc.embedFont(StandardFonts.Helvetica), fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.05, 0.42, 0.38), grey = rgb(0.38, 0.4, 0.4), ink = rgb(0.1, 0.1, 0.1);
  const pg = doc.addPage([595.28, 841.89]); const form = doc.getForm();
  const T = (s, x, y, size = 10.5, font = f, color = ink) => pg.drawText(s, { x, y, size, font, color });
  pg.drawRectangle({ x: 0, y: 800, width: 595.28, height: 41.89, color: green });
  T('JARDINS PARTAGÉS DU CANAL', 56, 815, 11, fb, rgb(1, 1, 1));
  T('Exemple fictif', 470, 815, 9, f, rgb(0.85, 0.95, 0.92));
  T("Bulletin d'adhésion 2026", 56, 740, 24, fb);
  T("Merci de compléter ce bulletin et de le renvoyer signé avant le 30 novembre 2026.", 56, 714, 10.5, f, grey);
  T('Votre parcelle est attribuée pour une saison, de mars à octobre.', 56, 699, 10.5, f, grey);
  const field = (label, name, y) => { T(label, 56, y + 6); const t = form.createTextField(name); t.addToPage(pg, { x: 180, y, width: 340, height: 20, borderWidth: 0, backgroundColor: rgb(0.95, 0.96, 0.95) }); };
  field('Nom', 'nom', 640); field('Prénom', 'prenom', 610); field('Adresse e-mail', 'email', 580); field('Téléphone', 'telephone', 550);
  T('Formule choisie', 56, 505, 12, fb);
  const box = (label, name, y) => { const c = form.createCheckBox(name); c.addToPage(pg, { x: 56, y, width: 12, height: 12, borderColor: grey, borderWidth: 1 }); T(label, 76, y + 2); };
  box('Parcelle individuelle (8 m²) : 45 €', 'individuelle', 480); box('Parcelle partagée (4 m²) : 25 €', 'partagee', 458); box("Adhésion simple, sans parcelle : 10 €", 'simple', 436);
  T('Engagements', 56, 395, 12, fb);
  ['Je participe à au moins deux journées collectives par saison.', "J'utilise uniquement des produits autorisés en agriculture biologique.", "Je laisse ma parcelle propre et accessible à la fin d'octobre."]
    .forEach((s, i) => T('–  ' + s, 56, 372 - i * 18));
  T('Fait à', 56, 250); T('le', 300, 250); pg.drawLine({ start: { x: 92, y: 248 }, end: { x: 280, y: 248 }, thickness: 0.6, color: grey }); pg.drawLine({ start: { x: 318, y: 248 }, end: { x: 520, y: 248 }, thickness: 0.6, color: grey });
  T('Signature', 56, 210); pg.drawRectangle({ x: 56, y: 110, width: 260, height: 90, borderColor: grey, borderWidth: 0.6 });
  T('Jardins partagés du Canal · 12 quai de la Loire, 75019 Paris · Association loi 1901', 56, 50, 8.5, f, grey);
  const p2 = doc.addPage([595.28, 841.89]);
  p2.drawText('Règlement intérieur (extrait)', { x: 56, y: 770, size: 18, font: fb, color: ink });
  ['Article 1. Les parcelles sont cultivées par leurs titulaires ou leur famille.', 'Article 2. Le local à outils est ouvert le samedi de 9 h à 12 h.', "Article 3. L'arrosage est autorisé avant 10 h et après 18 h en été.", 'Article 4. Les déchets verts vont au composteur collectif.', 'Article 5. Tout manquement répété peut entraîner le retrait de la parcelle.']
    .forEach((s, i) => p2.drawText(s, { x: 56, y: 730 - i * 22, size: 11, font: f, color: ink }));
  return new File([await doc.save()], 'exemple-bulletin-adhesion.pdf', { type: 'application/pdf' });
}

/* ---------- En-tête, pied de page, numéros, filigrane ---------- */
// Point de la page telle qu'affichée (u vers la droite, v vers le bas depuis le coin haut-gauche) -> coordonnées PDF
function viewToPdf(R, [x0, y0, x1, y1], u, v) {
  if (R === 90) return [x0 + v, y0 + u];
  if (R === 180) return [x1 - u, y0 + v];
  if (R === 270) return [x1 - v, y1 - u];
  return [x0 + u, y1 - v];
}
const fillTpl = (s, n, total) => s.replace(/\{n\}/g, n).replace(/\{N\}/g, total).replace(/\{date\}/g, new Date().toLocaleDateString('fr-FR'))
  .replace(/\{fichier\}/g, S.fileName || '').replace(/\{titre\}/g, S.meta.title || S.fileName || '');
const SLOTS = { hl: ['h', 'l'], hc: ['h', 'c'], hr: ['h', 'r'], fl: ['f', 'l'], fc: ['f', 'c'], fr: ['f', 'r'] };
// Textes ajoutés à une page (mêmes objets que les textes de l'utilisateur, non sélectionnables)
function decorFor(p, i, total, view, R) {
  const d = S.decor, out = [];
  const box = p.crop ? [p.crop.x0, p.crop.y0, p.crop.x1, p.crop.y1] : view;
  const W = box[2] - box[0], H = box[3] - box[1], [Wd, Hd] = R % 180 ? [H, W] : [W, H];
  const h = d.hf;
  if (h) {
    const from = Math.max(1, h.from || 1) - 1, to = Math.min(total, h.to || total) - 1;
    if (i >= from && i <= to) {
      const start = h.start ?? 1, n = start + i - from, count = start + to - from;
      const st = { font: 'Helvetica', bold: false, size: h.size || 10 }, m = (h.margin ?? 12) * 72 / 25.4;
      for (const [k, [pos, al]] of Object.entries(SLOTS)) {
        if (!h[k]) continue;
        const text = fillTpl(h[k], n, count), w = measure(text, st);
        const u = al === 'l' ? m : al === 'r' ? Wd - m - w : (Wd - w) / 2, vv = pos === 'h' ? m + st.size * 0.75 : Hd - m;
        const [x, y] = viewToPdf(R, box, u, vv);
        out.push({ type: 'text', x, y, r: R, text, size: st.size, font: 'Helvetica', bold: false, color: h.color || '#333333' });
      }
    }
  }
  const wm = d.wm;
  if (wm?.text) {
    const st = { font: 'Helvetica', bold: true, size: wm.size || 60 }, ang = R + (wm.angle ?? 45), w = measure(wm.text, st);
    const c = viewToPdf(R, box, Wd / 2, Hd / 2), o = sub(c, rot([w / 2, st.size * 0.35], ang));
    out.push({ type: 'text', x: o[0], y: o[1], r: ang, text: wm.text, size: st.size, font: 'Helvetica', bold: true, color: wm.color || '#c62828', opacity: wm.opacity ?? 0.25 });
  }
  return out;
}
async function openHeaderFooter() {
  const h = S.decor.hf || { size: 10, color: '#333333', margin: 12, start: 1, from: 1 };
  const inp = k => `<input name="${k}" value="${escHtml(h[k] || '')}" placeholder="${{ l: 'À gauche', c: 'Au centre', r: 'À droite' }[SLOTS[k][1]]}">`;
  const d = await ask({
    title: 'En-tête, pied de page et numéros', ok: 'Appliquer', wide: true,
    html: `<div class="info">Variables : <b>{n}</b> numéro de page, <b>{N}</b> nombre de pages, <b>{date}</b>, <b>{fichier}</b>, <b>{titre}</b>. Laissez tout vide pour retirer.</div>
      <div class="row"><button type="button" class="btn" data-preset="Page {n} sur {N}">« Page n sur N » en bas au centre</button><button type="button" class="btn" data-preset="{n}">Numéro seul en bas au centre</button><button type="button" class="btn" data-clear>Tout effacer</button></div>
      <fieldset><legend>En-tête</legend><div class="three">${inp('hl')}${inp('hc')}${inp('hr')}</div></fieldset>
      <fieldset><legend>Pied de page</legend><div class="three">${inp('fl')}${inp('fc')}${inp('fr')}</div></fieldset>
      <div class="three"><label class="f">Taille du texte<input type="number" name="size" min="5" max="40" step="0.5" value="${h.size}"></label>
        <label class="f">Couleur<input type="color" name="color" value="${h.color}"></label>
        <label class="f">Marge (mm)<input type="number" name="margin" min="0" max="60" value="${h.margin}"></label></div>
      <div class="three"><label class="f">De la page<input type="number" name="from" min="1" max="${S.pages.length}" value="${h.from || 1}"></label>
        <label class="f">À la page<input type="number" name="to" min="1" max="${S.pages.length}" value="${h.to || ''}" placeholder="dernière"></label>
        <label class="f">Premier numéro<input type="number" name="start" min="0" value="${h.start ?? 1}"></label></div>`,
    init: b => {
      b.querySelectorAll('[data-preset]').forEach(x => x.addEventListener('click', () => { b.querySelector('[name=fc]').value = x.dataset.preset; }));
      b.querySelector('[data-clear]').addEventListener('click', () => Object.keys(SLOTS).forEach(k => { b.querySelector(`[name=${k}]`).value = ''; }));
    },
  });
  if (!d) return;
  snapshot();
  const any = Object.keys(SLOTS).some(k => d[k].trim());
  S.decor = { ...S.decor, hf: any ? { ...Object.fromEntries(Object.keys(SLOTS).map(k => [k, d[k].trim()])), size: +d.size || 10, color: d.color, margin: +d.margin || 0, from: +d.from || 1, to: +d.to || 0, start: d.start === '' ? 1 : +d.start } : null };
  redrawAll(); toast(any ? 'En-tête et pied de page appliqués (aperçu sur les pages).' : 'En-tête et pied de page retirés.');
}
async function openWatermark() {
  const w = S.decor.wm || { text: 'CONFIDENTIEL', size: 60, color: '#c62828', opacity: 0.25, angle: 45 };
  const d = await ask({
    title: 'Filigrane', ok: 'Appliquer',
    html: `<label class="f">Texte (vide pour retirer)<input name="text" value="${escHtml(S.decor.wm ? w.text : 'CONFIDENTIEL')}"></label>
      <div class="three"><label class="f">Taille<input type="number" name="size" min="8" max="300" value="${w.size}"></label>
        <label class="f">Couleur<input type="color" name="color" value="${w.color}"></label>
        <label class="f">Angle<select name="angle">${[0, 30, 45, 60, 90, -45].map(a => `<option value="${a}"${a === w.angle ? ' selected' : ''}>${a}°</option>`).join('')}</select></label></div>
      <label class="f">Opacité : <span id="wmOp">${Math.round(w.opacity * 100)} %</span><input type="range" name="opacity" min="5" max="100" value="${Math.round(w.opacity * 100)}"></label>`,
    init: b => b.querySelector('[name=opacity]').addEventListener('input', e => { b.querySelector('#wmOp').textContent = e.target.value + ' %'; }),
  });
  if (!d) return;
  snapshot();
  S.decor = { ...S.decor, wm: d.text.trim() ? { text: d.text.trim(), size: +d.size || 60, color: d.color, opacity: (+d.opacity || 25) / 100, angle: +d.angle } : null };
  redrawAll(); toast(d.text.trim() ? 'Filigrane appliqué à toutes les pages.' : 'Filigrane retiré.');
}

/* ---------- Pages : insérer, dupliquer, diviser, supprimer, pivoter ---------- */
function duplicatePage() {
  const p = S.pages[S.cur]; if (!p) return;
  snapshot();
  const c = { ...clone(p), id: uid(), annots: p.annots.map(a => ({ ...clone(a), id: uid() })) };
  S.pages.splice(S.cur + 1, 0, c); rebuild().then(() => scrollToPage(S.cur + 1));
  toast(`Page ${S.cur + 1} dupliquée.`);
}
async function deletePages() {
  const d = await ask({
    title: 'Supprimer des pages', ok: 'Supprimer',
    html: `<p class="small" style="margin:0">Pages à supprimer, par exemple <code>2, 5-7</code>. Le document compte ${S.pages.length} pages.</p><input name="r" value="${S.cur + 1}" autocomplete="off">`,
    validate: d => { const r = parseRange(d.r, S.pages.length); if (!r) return `Écrivez des numéros entre 1 et ${S.pages.length}.`; if (new Set(r).size >= S.pages.length) return 'Le document doit garder au moins une page.'; },
  });
  if (!d) return;
  const del = new Set(parseRange(d.r, S.pages.length));
  snapshot(); S.pages = S.pages.filter((_, i) => !del.has(i)); S.cur = Math.min(S.cur, S.pages.length - 1);
  await rebuild(); toast(`${del.size} page${del.size > 1 ? 's supprimées' : ' supprimée'}. Ctrl+Z pour annuler.`);
}
function rotateAll() { snapshot(); S.pages.forEach(p => { p.rot = (p.rot + 90) % 360; }); rebuild(); }
async function splitDoc() {
  const n = S.pages.length;
  const d = await ask({
    title: 'Diviser le document', ok: 'Choisir le dossier…',
    html: `<label class="check"><input type="radio" name="mode" value="every" checked> Toutes les <input type="number" name="every" min="1" max="${n}" value="1" style="width:70px;height:30px;margin:0 6px"> page(s)</label>
      <label class="check"><input type="radio" name="mode" value="ranges"> Selon des plages :<input name="ranges" placeholder="1-3; 4-8; 9-" style="height:30px;margin-left:6px"></label>
      <p class="small" style="margin:0">Le document compte ${n} pages. Chaque partie est enregistrée dans un fichier séparé, avec vos annotations.</p>`,
    validate: d => {
      if (d.mode === 'every' && !(+d.every >= 1)) return 'Indiquez un nombre de pages.';
      if (d.mode === 'ranges' && !d.ranges.split(';').map(s => parseRange(s.trim(), n)).every(Boolean)) return `Plages invalides : séparez-les par « ; », numéros entre 1 et ${n}.`;
    },
  });
  if (!d) return;
  const groups = d.mode === 'every'
    ? Array.from({ length: Math.ceil(n / +d.every) }, (_, k) => Array.from({ length: Math.min(+d.every, n - k * +d.every) }, (_, j) => k * +d.every + j))
    : d.ranges.split(';').map(s => parseRange(s.trim(), n));
  const f = await pickFolder(); if (!f) return;
  busy(true, 'Division du document…');
  try {
    for (const [k, g] of groups.entries()) {
      $('#busyText').textContent = `Partie ${k + 1} sur ${groups.length}…`;
      const { bytes } = await producePdf(g.map(i => S.pages[i]));
      const label = g.length === 1 ? `page-${g[0] + 1}` : `pages-${g[0] + 1}-${g[g.length - 1] + 1}`;
      await writeInFolder(f, `${S.fileName || 'document'}-${label}.pdf`, bytes, 'application/pdf');
    }
    toast(`${groups.length} fichiers créés.`);
  } catch (e) { console.error(e); toast(`La division a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}

/* ---------- Recherche ---------- */
let findSeq = 0, findTimer = 0;
function openFind() { if (!S.pages.length) return; $('#findbar').hidden = false; const i = $('#findInput'); i.focus(); i.select(); if (i.value && !S.find.hits.length) runFind(); }
function closeFind() { $('#findbar').hidden = true; S.find = { q: '', hits: [], cur: -1, n: 0 }; $('#findCount').textContent = ''; redrawAll(); }
async function pageText(p) {
  const v = V.get(p.id); if (!v) return { text: '', map: [] };
  let text = ''; const map = [];
  for (const it of await ensureText(v)) { if (text && !/\s$/.test(text)) text += ' '; map.push({ it, at: text.length }); text += it.str; }
  return { text, map };
}
async function runFind() {
  const seq = ++findSeq, q = $('#findInput').value.trim();
  S.find = { q, hits: [], cur: -1, n: 0 };
  if (!q) { $('#findCount').textContent = ''; redrawAll(); return; }
  $('#findCount').textContent = 'Recherche…';
  const pat = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const re = new RegExp($('#findWord').checked ? `(?<![\\p{L}\\p{N}])${pat}(?![\\p{L}\\p{N}])` : pat, 'gu' + ($('#findCase').checked ? '' : 'i'));
  for (const p of S.pages) {
    const { text, map } = await pageText(p); if (seq !== findSeq) return;
    for (const m of text.matchAll(re)) {
      const a = m.index, b = a + m[0].length, id = S.find.n++;
      for (const { it, at } of map) {   // une boîte par élément de texte touché
        const s = Math.max(a, at), e = Math.min(b, at + it.str.length); if (s >= e) continue;
        const k = it.w / (measure(it.str, HELV) || 1), s0 = measure(it.str.slice(0, s - at), HELV) * k, s1 = measure(it.str.slice(0, e - at), HELV) * k;
        const o = add([it.x, it.y], rot([s0, -it.fs * 0.24], it.r));
        S.find.hits.push({ m: id, pid: p.id, x: r2(o[0]), y: r2(o[1]), w: r2(Math.max(1, s1 - s0)), h: r2(it.fs * 1.2), r: it.r });
      }
    }
  }
  if (S.find.n) gotoHit(Math.max(0, S.find.hits.findIndex(h => S.pages.findIndex(p => p.id === h.pid) >= S.cur)) >= 0 ? S.find.hits[Math.max(0, S.find.hits.findIndex(h => S.pages.findIndex(p => p.id === h.pid) >= S.cur))].m : 0);
  else { $('#findCount').textContent = 'Aucun résultat'; redrawAll(); }
}
function gotoHit(m) {
  const f = S.find; if (!f.n) return;
  f.cur = (m + f.n) % f.n;
  // la surbrillance « courante » porte sur toutes les boîtes du résultat
  const k = f.hits.findIndex(h => h.m === f.cur); S.find.cur = f.cur;
  $('#findCount').textContent = `${f.cur + 1} / ${f.n}`;
  V.forEach(v => drawAnnots(v));
  const h = f.hits[k], v = V.get(h.pid); if (!v) return;
  const [x, y] = v.vp.convertToViewportPoint(h.x, h.y), ws = $('#workspace');
  ws.scrollTo({ top: v.wrap.offsetTop + y - ws.clientHeight / 3, left: Math.max(0, v.wrap.offsetLeft + x - ws.clientWidth / 2), behavior: 'smooth' });
}
function markAllHits(kind) {
  if (!S.find.hits.length) return toast('Lancez d\'abord une recherche.');
  snapshot();
  for (const h of S.find.hits) {
    const p = S.pages.find(x => x.id === h.pid), pad = kind === 'redact' ? 0.6 : 0;
    const o = add([h.x, h.y], rot([-pad, -pad], h.r));
    p.annots.push({ id: uid(), type: 'rect', kind, x: r2(o[0]), y: r2(o[1]), w: r2(h.w + pad * 2), h: r2(h.h + pad * 2), r: h.r, color: S.style[kind].color });
  }
  const n = S.find.n; closeFind();
  toast(kind === 'redact' ? `${n} résultat${n > 1 ? 's marqués' : ' marqué'} pour le caviardage. Vérifiez puis enregistrez : le texte sera alors définitivement supprimé.` : `${n} résultat${n > 1 ? 's surlignés' : ' surligné'}.`, 7000);
}

/* ---------- Barre latérale : signets et notes ---------- */
function showPane(name) {
  document.querySelectorAll('.sidetabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.pane === name));
  document.querySelectorAll('#side .pane').forEach(p => { p.hidden = p.id !== name; });
  if (name === 'outline') renderOutline();
  if (name === 'comments') renderComments();
}
function goToSource(src, idx) {
  const i = S.pages.findIndex(p => p.src === src && p.idx === idx);
  if (i < 0) return toast('Cette page ne fait plus partie du document.');
  scrollToPage(i);
}
function renderOutline() {
  const box = $('#outline'), srcs = S.sources.filter(s => s.outline?.length && S.pages.some(p => p.src === s.id));
  if (!srcs.length) { box.innerHTML = '<p class="empty">Ce document n\'a pas de signets.</p>'; return; }
  const tree = (s, items) => `<ul class="otree">${items.map(it => `<li><button data-src="${s.id}" data-idx="${it.idx ?? ''}" title="${escHtml(it.title)}">${escHtml(it.title)}</button>${it.items.length ? tree(s, it.items) : ''}</li>`).join('')}</ul>`;
  box.innerHTML = srcs.map(s => (srcs.length > 1 ? `<p class="sidehead" style="margin:10px 0 4px">${escHtml(s.name)}</p>` : '') + tree(s, s.outline)).join('');
}
$('#outline').addEventListener('click', e => { const b = e.target.closest('button[data-src]'); if (b && b.dataset.idx !== '') goToSource(+b.dataset.src, +b.dataset.idx); });
let commentSeq = 0;
async function renderComments() {
  const ours = S.pages.flatMap((p, i) => p.annots.filter(a => a.type === 'note').map(a => ({ a, i, p })));
  $('#noteCount').textContent = ours.length || '';
  const box = $('#comments'); if (box.hidden) return;
  const seq = ++commentSeq, theirs = [];
  for (const [i, p] of S.pages.entries()) {   // commentaires déjà présents dans le PDF d'origine (lecture seule)
    try {
      for (const an of await (await getPdfPage(p)).getAnnotations({ intent: 'display' }))
        if (an.subtype !== 'Popup' && an.subtype !== 'Link' && an.subtype !== 'Widget' && an.contentsObj?.str) theirs.push({ i, an });
    } catch {}
    if (seq !== commentSeq) return;
  }
  const fmt = d => { try { return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; } };
  box.innerHTML = (ours.length || theirs.length ? '' : '<p class="empty">Aucune note. Utilisez l\'outil Note pour commenter le document.</p>')
    + ours.map(({ a, i }) => `<button class="note-item" data-note="${a.id}"><b><span>${escHtml(a.author || '')}</span><span>p. ${i + 1}</span></b><span>${escHtml(a.text)}</span></button>`).join('')
    + (theirs.length ? `<p class="sidehead" style="margin:12px 0 6px">Déjà dans le PDF</p>` + theirs.map(({ i, an }) => `<button class="note-item" data-page="${i}"><b><span>${escHtml(an.titleObj?.str || an.subtype)}</span><span>p. ${i + 1}</span></b><span>${escHtml(an.contentsObj.str)}</span></button>`).join('') : '');
}
$('#comments').addEventListener('click', e => {
  const b = e.target.closest('.note-item'); if (!b) return;
  if (b.dataset.page) return scrollToPage(+b.dataset.page);
  const i = S.pages.findIndex(p => p.annots.some(a => a.id === b.dataset.note)); if (i < 0) return;
  scrollToPage(i);
  setTimeout(() => { const p = S.pages[i], v = V.get(p.id), a = p.annots.find(x => x.id === b.dataset.note); if (v && a) { setTool('select'); setSel(p.id, a.id); openNote(v, a); } }, 450);
});

/* ---------- Propriétés et protection ---------- */
async function openProps() {
  const m = S.meta, p = S.pages[S.cur], pg = p && await getPdfPage(p);
  const size = S.sources.reduce((s, x) => s + x.bytes.length, 0);
  const fmtDate = s => { try { const d = s && pdfjsLib.PDFDateString.toDateObject(s); return d ? d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—'; } catch { return '—'; } };
  const sec = S.sources[0]?.security;
  const d = await ask({
    title: 'Propriétés du document', ok: 'Enregistrer les propriétés', wide: true,
    html: `<div class="two"><label class="f">Titre<input name="title" value="${escHtml(m.title)}"></label><label class="f">Auteur<input name="author" value="${escHtml(m.author)}"></label></div>
      <div class="two"><label class="f">Sujet<input name="subject" value="${escHtml(m.subject)}"></label><label class="f">Mots-clés (séparés par des virgules)<input name="keywords" value="${escHtml(m.keywords)}"></label></div>
      <table>
        <tr><td>Fichier</td><td>${escHtml(S.fileName)}.pdf — ${(size / 1024 / 1024).toFixed(2)} Mo</td></tr>
        <tr><td>Pages</td><td>${S.pages.length}${pg ? ` — page courante : ${Math.round((pg.view[2] - pg.view[0]) * 25.4 / 72)} × ${Math.round((pg.view[3] - pg.view[1]) * 25.4 / 72)} mm` : ''}</td></tr>
        <tr><td>Créé le</td><td>${fmtDate(m.created)}</td></tr><tr><td>Modifié le</td><td>${fmtDate(m.modified)}</td></tr>
        <tr><td>Application d'origine</td><td>${escHtml(m.creator || '—')}</td></tr><tr><td>Producteur PDF</td><td>${escHtml(m.producer || '—')}</td></tr>
        <tr><td>Version PDF</td><td>${escHtml(m.version || '—')}</td></tr>
        <tr><td>Sécurité</td><td>${sec ? `chiffré à l'origine (révision ${sec.revision})` : 'aucune à l\'origine'}${S.protect ? ' — sera protégé par mot de passe' : ''}</td></tr>
        <tr><td>Signets</td><td>${S.sources.reduce((s, x) => s + (x.outline?.length || 0), 0) || 'aucun'}</td></tr>
      </table>`,
  });
  if (!d) return;
  Object.assign(S.meta, { title: d.title.trim(), author: d.author.trim(), subject: d.subject.trim(), keywords: d.keywords.trim() });
  S.metaEdited = true; S.dirty = true; updateUI(); toast('Propriétés mises à jour : elles seront écrites à l\'enregistrement.');
}
async function openProtect() {
  const p = S.protect || { user: '', owner: '', perms: {} }, deny = k => p.perms && p.perms[k] === false ? 'checked' : '';
  const d = await ask({
    title: 'Protéger par mot de passe', ok: 'Appliquer',
    html: `<label class="check"><input type="checkbox" name="on" ${S.protect ? 'checked' : ''}><span>Protéger le document à l'enregistrement<small>Chiffrement AES-256, comme Acrobat : sans le mot de passe, le contenu est illisible.</small></span></label>
      <div class="two"><label class="f">Mot de passe d'ouverture<input type="password" name="user" value="${escHtml(p.user)}" autocomplete="new-password"></label>
        <label class="f">Confirmation<input type="password" name="user2" value="${escHtml(p.user)}" autocomplete="new-password"></label></div>
      <fieldset><legend>Restrictions (facultatif)</legend>
        <label class="check"><input type="checkbox" name="noprint" ${deny('print')}> Interdire l'impression</label>
        <label class="check"><input type="checkbox" name="nocopy" ${deny('copy')}> Interdire la copie du texte et des images</label>
        <label class="check"><input type="checkbox" name="nomodify" ${deny('modify')}> Interdire la modification</label>
        <label class="check"><input type="checkbox" name="noannot" ${deny('annotate')}> Interdire les commentaires et le remplissage des formulaires</label>
        <label class="f">Mot de passe propriétaire (pour lever les restrictions)<input type="password" name="owner" value="${escHtml(p.owner)}" autocomplete="new-password"></label>
        <p class="small" style="margin:0">Les restrictions sont respectées par les lecteurs courants, mais ne protègent pas contre un outil déterminé : seul le mot de passe d'ouverture chiffre vraiment le contenu.</p>
      </fieldset>
      <p class="small" style="margin:0">Atelier PDF ne conserve pas ce mot de passe : s'il est perdu, le document ne pourra plus être ouvert.</p>`,
    validate: d => {
      if (!d.on) return;
      if (d.user !== d.user2) return 'Les deux mots de passe ne correspondent pas.';
      const restricted = d.noprint || d.nocopy || d.nomodify || d.noannot;
      if (!d.user && !restricted) return "Indiquez un mot de passe d'ouverture, ou au moins une restriction.";
      if (d.owner && d.owner === d.user) return 'Le mot de passe propriétaire doit être différent de celui d\'ouverture.';
    },
  });
  if (!d) return;
  S.protect = d.on ? { user: d.user, owner: d.owner, perms: { print: !d.noprint, copy: !d.nocopy, modify: !d.nomodify, annotate: !d.noannot } } : null;
  S.dirty = true; updateUI();
  toast(S.protect ? 'Le document sera protégé à l\'enregistrement.' : 'Le document sera enregistré sans protection.');
}

/* ---------- Export : images, texte, impression ---------- */
async function renderPdfPages(bytes, dpi, each) {
  const pdf = await openPdfjs(bytes);
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n), vp = pg.getViewport({ scale: dpi / 72 });
      const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: ctx, viewport: vp, annotationMode: pdfjsLib.AnnotationMode.ENABLE_STORAGE }).promise;
      await each(c, n, pdf.numPages, pg.getViewport({ scale: 1 }));
      c.width = c.height = 0;
    }
  } finally { pdf.loadingTask.destroy(); }
}
async function exportImages() {
  const d = await ask({
    title: 'Exporter les pages en images', ok: 'Choisir le dossier…',
    html: `<div class="three"><label class="f">Format<select name="fmt"><option value="png">PNG (net, plus lourd)</option><option value="jpeg">JPEG (photos, léger)</option></select></label>
      <label class="f">Résolution<select name="dpi"><option value="96">96 ppp (écran)</option><option value="150" selected>150 ppp</option><option value="300">300 ppp (impression)</option></select></label>
      <label class="f">Pages<input name="r" value="1-${S.pages.length}"></label></div>`,
    validate: d => parseRange(d.r, S.pages.length) ? null : `Pages entre 1 et ${S.pages.length}.`,
  });
  if (!d) return;
  const idx = parseRange(d.r, S.pages.length), f = await pickFolder(); if (!f) return;
  busy(true, 'Préparation…');
  try {
    const { bytes } = await producePdf(idx.map(i => S.pages[i]), { protect: null });
    const mime = d.fmt === 'png' ? 'image/png' : 'image/jpeg';
    await renderPdfPages(bytes, +d.dpi, async (c, n, total) => {
      $('#busyText').textContent = `Image ${n} sur ${total}…`;
      const blob = await new Promise(r => c.toBlob(r, mime, 0.9));
      await writeInFolder(f, `${S.fileName || 'document'}-page-${String(idx[n - 1] + 1).padStart(String(S.pages.length).length, '0')}.${d.fmt === 'png' ? 'png' : 'jpg'}`, new Uint8Array(await blob.arrayBuffer()), mime);
    });
    toast(`${idx.length} image${idx.length > 1 ? 's exportées' : ' exportée'}.`);
  } catch (e) { console.error(e); toast(`L'export a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}
async function exportText() {
  const o = await pickOutput(`${S.fileName || 'document'}.txt`, 'txt', 'Texte', 'text/plain'); if (!o) return;
  busy(true, 'Extraction du texte…');
  try {
    const { bytes } = await producePdf(S.pages, { protect: null }), pdf = await openPdfjs(bytes), pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const items = (await (await pdf.getPage(n)).getTextContent()).items;
      pages.push(items.map(it => it.str + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+\n/g, '\n').trim());
    }
    pdf.loadingTask.destroy();
    const txt = pages.map((t, i) => `—— Page ${i + 1} ——\n${t}`).join('\n\n') + '\n';
    await writeOutput(o, new TextEncoder().encode('﻿' + txt));
    toast(pages.some(Boolean) ? `Texte exporté : ${o.name}.` : 'Aucun texte trouvé : le document est peut-être scanné. Essayez Outils › Reconnaître le texte (OCR).', 6000);
  } catch (e) { console.error(e); toast(`L'export a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}
async function printDoc() {
  if (!S.pages.length) return;
  busy(true, "Préparation de l'impression…");
  try {
    const { bytes } = await producePdf(S.pages, { protect: null }), pages = [];
    await renderPdfPages(bytes, 200, async (c, n, total, vp) => {
      $('#busyText').textContent = `Page ${n} sur ${total}…`;
      pages.push({ src: c.toDataURL('image/jpeg', 0.92), w: vp.width, h: vp.height });
    });
    busy(false);
    if (window.desktop?.print) await window.desktop.print(pages);
    else {
      const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0'; document.body.append(fr);
      fr.contentDocument.write(`<style>@page{margin:0}body{margin:0}img{display:block;width:100%;page-break-after:always}</style>${pages.map(p => `<img src="${p.src}">`).join('')}`);
      fr.contentDocument.close(); await new Promise(r => setTimeout(r, 400)); fr.contentWindow.print(); setTimeout(() => fr.remove(), 2000);
    }
  } catch (e) { console.error(e); toast(`L'impression a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}

/* ---------- Comparer deux PDF ---------- */
// Mots de chaque page avec leur boîte ; comparaison mot à mot (plus longue sous-suite commune)
async function wordsOfPdfPage(pg) {
  return (await pageWords(pg)).map(w => ({ str: w.str, box: w.box, r: w.r, fs: w.fs, x: w.x, y: w.y, s0: w.s0, s1: w.s1 }));
}
function lcsMarks(a, b) {
  const n = a.length, m = b.length;
  if (n * m > 9e6) return null;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const inA = new Uint8Array(n), inB = new Uint8Array(m);
  for (let i = 0, j = 0; i < n && j < m;) { if (a[i] === b[j]) { inA[i++] = 1; inB[j++] = 1; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return { inA, inB };
}
async function compareWith(file) {
  busy(true, 'Comparaison…');
  try {
    const other = await openPdfjs(new Uint8Array(await file.arrayBuffer())), report = [];
    S.diff = [];
    const n = Math.max(S.pages.length, other.numPages);
    for (let i = 0; i < n; i++) {
      $('#busyText').textContent = `Comparaison de la page ${i + 1} sur ${n}…`;
      const p = S.pages[i], mine = p ? await wordsOfPdfPage(await getPdfPage(p)) : [], theirs = i < other.numPages ? await wordsOfPdfPage(await other.getPage(i + 1)) : [];
      const r = lcsMarks(mine.map(w => w.str), theirs.map(w => w.str));
      if (!r) { report.push({ i, note: 'page trop longue pour être comparée' }); continue; }
      const added = mine.filter((_, k) => !r.inA[k]), removed = theirs.filter((_, k) => !r.inB[k]);
      for (const w of added) { const o = add([w.x, w.y], rot([w.s0, -w.fs * 0.24], w.r)); S.diff.push({ pid: p.id, x: o[0], y: o[1], w: w.s1 - w.s0, h: w.fs * 1.2, r: w.r }); }
      if (added.length || removed.length) report.push({ i, added: added.map(w => w.str), removed: removed.map(w => w.str), missing: !p ? 'absente du document ouvert' : i >= other.numPages ? 'absente de l\'autre document' : '' });
    }
    other.loadingTask.destroy();
    busy(false); redrawAll();
    const cut = a => escHtml(a.join(' ').slice(0, 260)) + (a.join(' ').length > 260 ? '…' : '');
    await ask({
      title: `Comparaison avec « ${file.name} »`, ok: null, cancel: 'Fermer', wide: true,
      html: report.length ? `<div class="info">${report.length} page${report.length > 1 ? 's diffèrent' : ' diffère'}. Les mots présents seulement dans le document ouvert sont surlignés en vert sur les pages.</div>
        <div style="max-height:52vh;overflow:auto;display:grid;gap:8px">${report.map(r => `<div class="info"><b>Page ${r.i + 1}</b>${r.missing ? ` — ${r.missing}` : ''}${r.note ? ` — ${r.note}` : ''}
          ${r.added?.length ? `<div style="color:#1f8a4c">+ ${cut(r.added)}</div>` : ''}${r.removed?.length ? `<div style="color:#c62828">− ${cut(r.removed)}</div>` : ''}</div>`).join('')}</div>`
        : '<div class="info">Aucune différence de texte trouvée entre les deux documents.</div>',
    });
  } catch (e) { console.error(e); toast(`La comparaison a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}

/* ---------- OCR : rendre un document scanné cherchable ---------- */
async function openOcr() {
  const d = await ask({
    title: 'Reconnaître le texte (OCR)', ok: 'Lancer la reconnaissance',
    html: `<p class="small" style="margin:0">Pour les documents scannés : le texte reconnu est ajouté de façon invisible sous l'image. Le document devient cherchable et copiable. Tout se fait sur cet ordinateur.</p>
      <div class="two"><label class="f">Langue du document<select name="lang"><option value="fra">Français</option><option value="eng">Anglais</option><option value="fra+eng">Français et anglais</option></select></label>
        <label class="f">Pages<select name="which"><option value="empty">Pages sans texte</option><option value="all">Toutes les pages</option><option value="cur">Page courante (${S.cur + 1})</option></select></label></div>`,
  });
  if (!d) return;
  const list = [];
  for (const [i, p] of S.pages.entries()) {
    if (d.which === 'cur' && i !== S.cur) continue;
    if (d.which === 'empty') { const tc = await (await getPdfPage(p)).getTextContent(); if (tc.items.filter(it => it.str.trim()).length > 8 || p.ocr?.length) continue; }
    list.push(i);
  }
  if (!list.length) return toast('Toutes les pages contiennent déjà du texte. Choisissez « Toutes les pages » pour les traiter quand même.', 6000);
  const snap = serialize(); let words = 0;
  busy(true, 'Chargement du moteur OCR…');
  try {
    for (const [k, i] of list.entries()) {
      const p = S.pages[i], pg = await getPdfPage(p), R = ((pg.rotate || 0) + p.rot) % 360;
      const base = pg.getViewport({ scale: 1, rotation: R }), scale = Math.min(300 / 72, Math.sqrt(30e6 / (base.width * base.height)));
      const vp = pg.getViewport({ scale, rotation: R }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: ctx, viewport: vp, annotationMode: pdfjsLib.AnnotationMode.ENABLE }).promise;
      const found = await AtelierOCR.recognize(c, d.lang, pr => { $('#busyText').textContent = `Reconnaissance de la page ${i + 1} (${k + 1} sur ${list.length}) : ${Math.round(pr * 100)} %`; });
      c.width = c.height = 0;
      p.ocr = found.filter(w => w.text.trim() && w.conf > 25).map(w => {
        const a = vp.convertToPdfPoint(w.x0, w.base0), b = vp.convertToPdfPoint(w.x1, w.base1);
        return { str: w.text.trim(), x: r2(a[0]), y: r2(a[1]), r: r2(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI), w: r2(Math.hypot(b[0] - a[0], b[1] - a[1])), fs: r2(Math.max(4, (w.y1 - w.y0) / scale * 0.95)) };
      });
      words += p.ocr.length;
      const v = V.get(p.id); if (v) { v.text = null; v.textLoading = false; }
    }
    pushSnap(snap);
    toast(`${words} mots reconnus sur ${list.length} page${list.length > 1 ? 's' : ''}. Le texte est maintenant cherchable (Ctrl+F) et sera intégré à l'enregistrement.`, 7000);
  } catch (e) { console.error(e); toast(`La reconnaissance a échoué : ${e.message}`, 8000); }
  finally { busy(false); }
}

/* ---------- Analyse et nettoyage ---------- */
async function openClean() {
  busy(true, 'Analyse du document…');
  let f;
  try {
    // L'analyse porte sur les fichiers d'origine (ce qu'ils contiennent réellement)
    const res = [];
    for (const s of S.sources) res.push(AtelierSanitize.analyze(await PDFLib.PDFDocument.load(s.bytes, { ignoreEncryption: true, updateMetadata: false }), s.bytes));
    f = res.reduce((a, b) => ({
      js: [...a.js, ...b.js], launch: [...a.launch, ...b.launch], submit: [...a.submit, ...b.submit], uri: new Set([...a.uri, ...b.uri]), remote: [...a.remote, ...b.remote],
      files: [...a.files, ...b.files], media: a.media + b.media, openAction: a.openAction || b.openAction, fields: a.fields + b.fields, xfa: a.xfa || b.xfa, sigs: a.sigs + b.sigs,
      info: [...a.info, ...b.info], xmp: a.xmp || b.xmp, outlines: a.outlines + b.outlines, thumbs: a.thumbs + b.thumbs, piece: a.piece + b.piece, layers: a.layers + b.layers,
      hidden: a.hidden + b.hidden, revisions: a.revisions + b.revisions, risk: [a.risk, b.risk].includes('élevé') ? 'élevé' : [a.risk, b.risk].includes('moyen') ? 'moyen' : 'faible',
      annots: Object.fromEntries([...new Set([...Object.keys(a.annots), ...Object.keys(b.annots)])].map(k => [k, (a.annots[k] || 0) + (b.annots[k] || 0)])),
    }));
  } catch (e) { busy(false); console.error(e); return toast(`Analyse impossible : ${e.message}`, 6000); }
  busy(false);
  const comments = Object.entries(f.annots).filter(([k]) => !['Link', 'Widget', 'Popup'].includes(k)).reduce((s, [, n]) => s + n, 0);
  const links = f.annots.Link || 0, c = S.clean || {};
  const risk = { élevé: ['var(--danger)', 'Risque élevé : ce document contient du code ou des fichiers actifs. Ne l\'ouvrez pas dans d\'autres logiciels sans le nettoyer.'],
    moyen: ['#b86e00', 'Risque moyen : le document contient des actions ou des fichiers joints à vérifier.'], faible: ['var(--accent)', 'Risque faible : aucun élément actif détecté.'] }[f.risk];
  const li = (cond, t) => cond ? `<li>${t}</li>` : '';
  const list = (a, n = 4) => a.slice(0, n).map(x => `<code>${escHtml(String(x).slice(0, 120))}</code>`).join(', ') + (a.length > n ? '…' : '');
  const box = (name, on, label, hint, present) => `<label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span>${label}${present ? '' : ' <span class="small">(rien trouvé)</span>'}<small>${hint}</small></span></label>`;
  const d = await ask({
    title: 'Analyser et nettoyer le document', ok: 'Appliquer à l\'enregistrement', wide: true,
    html: `<div class="info" style="border-left:4px solid ${risk[0]}"><b>${risk[1]}</b></div>
      <div class="info"><ul style="margin:0;padding-left:18px">
        ${li(f.js.length, `<b>${f.js.length} script${f.js.length > 1 ? 's' : ''} JavaScript</b> : ${list(f.js, 2)}`)}
        ${li(f.launch.length, `<b>Lancement de programme</b> : ${list(f.launch)}`)}
        ${li(f.openAction, `Action automatique à l'ouverture : ${escHtml(f.openAction)}`)}
        ${li(f.submit.length, `Envoi de formulaire vers : ${list(f.submit)}`)}
        ${li(f.remote.length, `Liens vers d'autres fichiers : ${list(f.remote)}`)}
        ${li(f.files.length, `<b>${f.files.length} fichier${f.files.length > 1 ? 's' : ''} joint${f.files.length > 1 ? 's' : ''}</b> : ${f.files.slice(0, 5).map(x => `<code${x.risky ? ' style="color:var(--danger)"' : ''}>${escHtml(x.name)}</code> (${Math.round(x.size / 1024)} Ko)`).join(', ')}`)}
        ${li(f.uri.size, `${links} lien${links > 1 ? 's' : ''} vers ${f.uri.size} site${f.uri.size > 1 ? 's' : ''} : ${list([...f.uri], 6)}`)}
        ${li(f.media, `${f.media} élément${f.media > 1 ? 's' : ''} multimédia ou action spéciale`)}
        ${li(f.info.length || f.xmp, `Métadonnées : ${f.info.map(([k, v]) => `${escHtml(k)} = « ${escHtml(v.slice(0, 50))} »`).slice(0, 6).join(' ; ')}${f.xmp ? ' ; fiche XMP' : ''}`)}
        ${li(comments, `${comments} commentaire${comments > 1 ? 's' : ''} ou annotation${comments > 1 ? 's' : ''}`)}
        ${li(f.fields, `${f.fields} champ${f.fields > 1 ? 's' : ''} de formulaire${f.xfa ? ' (formulaire XFA)' : ''}`)}
        ${li(f.sigs, `<b>${f.sigs} signature${f.sigs > 1 ? 's' : ''} numérique${f.sigs > 1 ? 's' : ''}</b> : toute modification la rendra invalide`)}
        ${li(f.layers, `${f.layers} calque${f.layers > 1 ? 's' : ''}${f.hidden ? `, dont ${f.hidden} masqué${f.hidden > 1 ? 's' : ''} (leur contenu reste dans le fichier)` : ''}`)}
        ${li(f.revisions, `${f.revisions} version${f.revisions > 1 ? 's' : ''} antérieure${f.revisions > 1 ? 's' : ''} conservée${f.revisions > 1 ? 's' : ''} dans le fichier : Atelier PDF les supprime toujours à l'enregistrement`)}
        ${li(f.piece || f.thumbs, 'Données privées d\'applications ou miniatures intégrées')}
        ${li(f.outlines, `${f.outlines} signet${f.outlines > 1 ? 's' : ''}`)}
      </ul></div>
      <fieldset><legend>À supprimer lors de l'enregistrement</legend>
        ${box('metadata', c.metadata ?? true, 'Métadonnées', 'Auteur, logiciel, dates, fiche XMP.', f.info.length || f.xmp)}
        ${box('javascript', c.javascript ?? true, 'JavaScript et actions automatiques', 'Scripts, lancements de programmes, envois de formulaires, actions à l\'ouverture.', f.js.length || f.launch.length || f.openAction || f.submit.length || f.media)}
        ${box('files', c.files ?? true, 'Fichiers joints', 'Pièces jointes intégrées au PDF.', f.files.length)}
        ${box('private', c.private ?? true, 'Données privées et miniatures', 'Informations laissées par les logiciels de création.', f.piece || f.thumbs)}
        ${box('comments', c.comments ?? false, 'Commentaires et annotations', 'Notes, surlignages et tampons du PDF d\'origine (les vôtres sont conservés).', comments)}
        ${box('links', c.links ?? false, 'Liens', 'Liens vers des sites web ou d\'autres pages.', links)}
        ${box('forms', c.forms ?? false, 'Champs de formulaire', 'Les champs sont figés avec leur contenu actuel.', f.fields)}
        ${box('outlines', c.outlines ?? false, 'Signets', 'Le sommaire latéral du document.', f.outlines)}
      </fieldset>`,
  });
  if (!d) return;
  const keys = ['metadata', 'javascript', 'files', 'private', 'comments', 'links', 'forms', 'outlines'];
  S.clean = keys.some(k => d[k]) ? Object.fromEntries(keys.map(k => [k, !!d[k]])) : null;
  S.dirty = true; updateUI();
  toast(S.clean ? 'Nettoyage programmé : il sera appliqué à chaque enregistrement de ce document.' : 'Aucun nettoyage ne sera appliqué.', 5000);
}

/* ---------- Compression ---------- */
async function openCompress() {
  const before = S.sources.reduce((s, x) => s + x.bytes.length, 0);
  const d = await ask({
    title: 'Réduire la taille du PDF', ok: 'Réduire et enregistrer…',
    html: `<p class="small" style="margin:0">Réduit la taille des images (le texte et les dessins restent nets) et supprime les doublons. Taille actuelle des fichiers d'origine : <b>${(before / 1024 / 1024).toFixed(2)} Mo</b>.</p>
      <label class="check"><input type="radio" name="q" value="haute"><span>Qualité élevée<small>Images à 200 ppp : pour l'impression.</small></span></label>
      <label class="check"><input type="radio" name="q" value="moyenne" checked><span>Qualité moyenne<small>Images à 150 ppp : bon compromis pour l'envoi par e-mail.</small></span></label>
      <label class="check"><input type="radio" name="q" value="faible"><span>Taille minimale<small>Images à 96 ppp : lecture à l'écran uniquement.</small></span></label>
      <label class="check"><input type="checkbox" name="strip" checked><span>Retirer aussi les données inutiles<small>Vignettes, fiche XMP et données privées laissées par d'autres logiciels. Sans effet sur l'affichage ni sur les éléments modifiables.</small></span></label>
      <p class="small" style="margin:0">Le texte, les dessins et les éléments ajoutés avec Atelier PDF restent nets et modifiables ; les flux non compressés sont compressés sans perte.</p>`,
  });
  if (!d) return;
  const o = await pickOutput(`${S.fileName || 'document'}-compressé.pdf`); if (!o) return;
  busy(true, 'Préparation…');
  try {
    const { bytes: raw, report } = await exportPdf(S.pages);
    const r = await AtelierCompress.compress(raw, d.q, (k, n) => { $('#busyText').textContent = `Compression des images : ${k} sur ${n}…`; }, { strip: d.strip });
    const bytes = await finalizePdf(r.bytes, S.pages, { redacted: !!report });
    await writeOutput(o, bytes);
    const pct = Math.round((1 - bytes.length / raw.length) * 100);
    toast(`Copie compressée enregistrée : ${(bytes.length / 1024 / 1024).toFixed(2)} Mo${pct > 0 ? ` (${pct} % de moins)` : ''} ; ${r.images} image${r.images > 1 ? 's réduites' : ' réduite'}${r.duplicates ? `, ${r.duplicates} doublon${r.duplicates > 1 ? 's' : ''} fusionné${r.duplicates > 1 ? 's' : ''}` : ''}.`, 8000);
  } catch (e) { console.error(e); toast(`La compression a échoué : ${e.message}`, 7000); }
  finally { busy(false); }
}

/* ---------- Menus ---------- */
let openMenu = null;
function showMenu(menu, anchor) {
  closeMenu();
  const r = anchor.getBoundingClientRect(); menu.hidden = false;
  menu.style.left = Math.min(r.left, innerWidth - menu.offsetWidth - 8) + 'px'; menu.style.top = r.bottom + 4 + 'px';
  openMenu = menu; menu.querySelector('button:not(:disabled)')?.focus();
}
function closeMenu() { if (openMenu) { openMenu.hidden = true; openMenu = null; } }
document.addEventListener('pointerdown', e => { if (openMenu && !openMenu.contains(e.target) && !e.target.closest('[data-menu],.caret')) closeMenu(); });
document.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', () => { const m = $('#' + b.dataset.menu); m.hidden ? showMenu(m, b) : closeMenu(); }));
document.querySelectorAll('.menu').forEach(m => m.addEventListener('click', e => { if (e.target.closest('button')) setTimeout(closeMenu, 0); }));
const ACTIONS = {
  btnInsert: () => $('#fileInsert').click(), btnBlank: insertBlank, btnDup: duplicatePage, btnExtract: openExtract, btnSplit: splitDoc,
  btnDelPages: deletePages, btnRotAll: rotateAll, btnCrop: () => { setTool('crop'); toast('Faites glisser sur la partie de la page à garder.'); },
  btnHeader: openHeaderFooter, btnWatermark: openWatermark, btnOcr: () => openOcr(), btnCompare: () => $('#fileCompare').click(),
  btnProtect: openProtect, btnClean: () => openClean(), btnCompress: () => openCompress(), btnProps: openProps,
  btnExportImg: exportImages, btnExportTxt: exportText, btnPrint: printDoc, btnFind: openFind,
};
for (const [id, fn] of Object.entries(ACTIONS)) $('#' + id)?.addEventListener('click', () => { if (!S.pages.length) return toast("Ouvrez d'abord un PDF."); commitEditor(); fn(); });
$('#fileInsert').addEventListener('change', e => { addFiles(e.target.files, false, null, S.cur + 1); e.target.value = ''; });
$('#fileCompare').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) compareWith(f); });
document.querySelectorAll('.sidetabs button').forEach(b => b.addEventListener('click', () => showPane(b.dataset.pane)));

// Recherche
$('#findInput').addEventListener('input', () => { clearTimeout(findTimer); findTimer = setTimeout(runFind, 250); });
$('#findInput').addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); if (S.find.q !== $('#findInput').value.trim()) runFind(); else gotoHit(S.find.cur + (e.shiftKey ? -1 : 1)); }
  if (e.key === 'Escape') closeFind();
});
['findCase', 'findWord'].forEach(id => $('#' + id).addEventListener('change', runFind));
$('#findNext').addEventListener('click', () => gotoHit(S.find.cur + 1));
$('#findPrev').addEventListener('click', () => gotoHit(S.find.cur - 1));
$('#findClose').addEventListener('click', closeFind);
$('#findHighlight').addEventListener('click', () => markAllHits('highlight'));
$('#findRedact').addEventListener('click', () => markAllHits('redact'));

/* ---------- Événements globaux ---------- */
$('#tools').addEventListener('click', e => {
  const caret = e.target.closest('.caret');
  if (caret) {
    const g = TOOLBAR[+caret.dataset.group], m = $('#mGroup');
    m.innerHTML = g.map(t => `<button role="menuitemradio" data-pick="${t}" aria-checked="${S.tool === t}">${icon(TOOLS[t][1])}${TOOLS[t][0]}</button>`).join('');
    m.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { if (S.pages.length) setTool(b.dataset.pick); else toast("Ouvrez d'abord un PDF."); }));
    return m.hidden ? showMenu(m, caret.parentElement) : closeMenu();
  }
  const b = e.target.closest('.tool'); if (!b) return;
  if (!S.pages.length) return toast("Ouvrez d'abord un PDF.");
  if (b.dataset.tool === S.tool && S.tool === 'signature') return openSig();
  setTool(b.dataset.tool);
});
$('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
$('#emptyOpen').addEventListener('click', () => $('#fileOpen').click());
$('#emptySample').addEventListener('click', async () => { if (!LIBS_OK) return toast('Les composants PDF ne sont pas chargés.'); addFiles([await sampleFile()], true); });
$('#btnAdd').addEventListener('click', () => $('#fileAdd').click());
$('#fileOpen').addEventListener('change', e => { addFiles(e.target.files, true); e.target.value = ''; });
$('#fileAdd').addEventListener('change', e => { addFiles(e.target.files, false); e.target.value = ''; });
$('#fileImage').addEventListener('change', async e => {
  const f = e.target.files[0], rep = S.replacing; e.target.value = ''; S.replacing = null;
  if (rep) {   // remplacer l'image sélectionnée, dans le même cadre
    if (!f) return;
    const p = S.pages.find(x => x.id === rep.pid), a = p?.annots.find(x => x.id === rep.aid); if (!a) return;
    try { await replaceImage(a, f); redraw(rep.pid); toast("Image remplacée : recadrée au centre pour garder le même cadre."); }
    catch { toast("Cette image n'a pas pu être lue."); }
    return;
  }
  if (!f) { if (S.tool === 'image' && !S.pendingImg) setTool('select'); return; }
  try { S.pendingImg = await normalizeImage(f); propsKey = ''; if (S.tool !== 'image') setTool('image'); else updateProps(true); toast("Cliquez sur la page pour placer l'image."); }
  catch { toast("Cette image n'a pas pu être lue."); }
});
$('#btnSave').addEventListener('click', save);
$('#btnUndo').addEventListener('click', undo);
$('#btnRedo').addEventListener('click', redo);
$('#btnZoomIn').addEventListener('click', () => zoomStep(1));
$('#btnZoomOut').addEventListener('click', () => zoomStep(-1));
$('#btnZoomFit').addEventListener('click', async () => { await fitZoom(); rebuild(); });
let scrollRaf = 0;
$('#workspace').addEventListener('scroll', () => { cancelAnimationFrame(scrollRaf); scrollRaf = requestAnimationFrame(trackPage); });
$('#workspace').addEventListener('wheel', e => { if (!e.ctrlKey || !S.pages.length) return; e.preventDefault(); zoomStep(e.deltaY < 0 ? 1 : -1); }, { passive: false });

const empty = $('#empty');
window.addEventListener('dragover', e => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); empty.classList.add('over'); } });
window.addEventListener('dragleave', e => { if (!e.relatedTarget) empty.classList.remove('over'); });
window.addEventListener('drop', e => {
  if (!e.dataTransfer?.files?.length) return; e.preventDefault(); empty.classList.remove('over');
  addFiles(e.dataTransfer.files, !S.pages.length);
});
const KEYS = Object.fromEntries(Object.entries(TOOLS).filter(([, d]) => d[2]).map(([t, d]) => [d[2], t]));
window.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName, typing = /INPUT|TEXTAREA|SELECT/.test(tag) || document.activeElement?.isContentEditable;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (CROP && (e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); exitCrop(); return; }
  if (mod && k === 's') { e.preventDefault(); save(); return; }
  if (mod && k === 'o') { e.preventDefault(); $('#fileOpen').click(); return; }
  if (mod && k === 'f') { e.preventDefault(); openFind(); return; }
  if (mod && k === 'p') { e.preventDefault(); printDoc(); return; }
  if (e.key === 'Escape' && openMenu) { closeMenu(); return; }
  if (typing || document.querySelector('dialog[open]')) return;
  if (e.key === 'F3') { e.preventDefault(); gotoHit(S.find.cur + (e.shiftKey ? -1 : 1)); return; }
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && (k === 'c' || k === 'x') && S.sel) { e.preventDefault(); copySel(k === 'x'); return; }
  if (mod && k === 'v' && S.clip) { e.preventDefault(); pasteClip(); return; }
  if (mod && k === 'd' && S.sel) { e.preventDefault(); copySel(); pasteClip(); return; }
  if (mod && k === 'a' && S.pages.length) { e.preventDefault(); selectAll(); return; }
  if (mod) return;
  const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
  if (arrow && S.sel) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; nudgeSel(arrow[0] * d, arrow[1] * d); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); deleteSel(); return; }
  if (e.key === 'Escape') { if (!$('#findbar').hidden) return closeFind(); S.sel ? setSel(null) : setTool('select'); return; }
  if (!S.pages.length) return;
  if (KEYS[k]) setTool(KEYS[k]);
});
window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

// Application Windows : PDF ouvert par double-clic dans l'Explorateur
window.desktop?.onOpenFile(f => addFiles([new File([f.bytes], f.name, { type: 'application/pdf' })], true, f.dir));

if (location.hash === '#test') window.__atelier = { S, sampleFile, addFiles, exportPdf, buildPdf, openPdfjs, rebuild, setTool, producePdf, runFind, markAllHits, makeStamp, safeUrl, openOcr, openClean, openHeaderFooter, openWatermark, openProps, openProtect, openCompress, splitDoc, deletePages, exportImages, copySel, pasteClip, nudgeSel, setSel, fontsReady, selectMany, selectAll, selAnnots, alignSel, distributeSel, deleteSel, annotBox: a => annotBox(a), V, replaceImage, enterCrop, exitCrop, setCropFit, bakeImage };   // tests automatiques

setTool('select'); updateUI();
fontsReady.then(() => { if (S.pages.length) redrawAll(); });
})();
