// Calque modifiable : les ajouts d'Atelier PDF (textes, images, formes, dessins) restent modifiables après
// enregistrement. Ils sont dessinés dans un flux de contenu à part, visible dans tous les lecteurs, et leur
// description est rangée dans un flux /AtelierLayer relié à la page. À la réouverture, ce flux de contenu est
// retiré de la page et les éléments redeviennent des objets qu'on peut déplacer, copier ou réécrire.
// Les images ne sont pas recopiées dans la description : elle désigne les images déjà présentes dans la page
// (liste /Images du flux), ce qui évite de les stocker deux fois et laisse la compression les réduire.
// Le fichier est une donnée non fiable : tout ce qui est relu est vérifié champ par champ.
window.AtelierLayer = (() => {
const { PDFName, PDFArray, PDFRef, PDFRawStream, PDFNumber, decodePDFRawStream } = PDFLib;
const N = PDFName.of, KEY = 'AtelierPDF', TYPE = 'AtelierLayer', VERSION = 2, LINK = 'atelier-text-link';
const MARK = new TextEncoder().encode('/' + TYPE);   // le dictionnaire d'un flux n'est jamais compressé

// Éléments qu'on sait redessiner à l'identique et rendre à nouveau modifiables
const RECT_KINDS = new Set(['highlight', 'underline', 'strike', 'mask']);
const keep = a => ['text', 'image', 'shape', 'line', 'ink'].includes(a.type) || (a.type === 'rect' && RECT_KINDS.has(a.kind) && !a.erase);

// Enregistre la description des éléments d'une page et la liste des flux qui les dessinent.
// opts.images : image source -> référence de l'image dessinée ; opts.pageIndex : id de page -> position dans le fichier
function write(doc, page, annots, contentRefs, opts = {}) {
  if (!annots.length || !contentRefs.length) return;
  const ctx = doc.context, imgRefs = [], slot = new Map();
  const list = annots.map(a => {
    const o = { ...a };
    const use = src => { if (!slot.has(src)) { slot.set(src, imgRefs.length); imgRefs.push(opts.images.get(src)); } return slot.get(src); };
    if (a.type === 'image' && opts.images?.get(a.src)) { delete o.src; o.img = use(a.src); }
    if (a.type === 'image' && a.orig && opts.images?.get(a.orig)) { delete o.orig; o.origImg = use(a.orig); }   // image complète (cadrage)
    if (a.link?.kind === 'page') {   // un lien interne désigne une page par sa position, retrouvée à l'ouverture
      const k = opts.pageIndex?.get(a.link.page);
      if (k == null) delete o.link; else o.link = { kind: 'page', index: k };
    }
    return o;
  });
  const json = JSON.stringify({ v: VERSION, annots: list });
  const dict = { Type: TYPE, V: VERSION, Contents: contentRefs };
  if (imgRefs.length) dict.Images = imgRefs;
  page.node.set(N(KEY), ctx.register(ctx.flateStream(new TextEncoder().encode(json), dict)));
}
const linkMark = () => LINK;   // /NM des liens posés sur les textes, retirés à l'ouverture (le texte les recrée)

function hasLayer(bytes) {
  const n = MARK.length;
  outer: for (let i = 0, end = bytes.length - n; i <= end; i++) {
    if (bytes[i] !== 47) continue;
    for (let k = 1; k < n; k++) if (bytes[i + k] !== MARK[k]) continue outer;
    return true;
  }
  return false;
}

// Lit et retire les calques : renvoie { bytes, layers: Map(index de page -> éléments) } ou null s'il n'y en a pas
async function read(bytes) {
  if (!hasLayer(bytes)) return null;
  const doc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const ctx = doc.context, layers = new Map();
  for (const [i, page] of doc.getPages().entries()) {
    const ref = page.node.get(N(KEY));
    const st = ref instanceof PDFRef ? ctx.lookup(ref) : null;
    page.node.delete(N(KEY));
    if (!(st instanceof PDFRawStream) || st.dict.lookup(N('Type'))?.decodeText?.() !== TYPE) continue;
    let data;
    try { data = JSON.parse(new TextDecoder().decode(decodePDFRawStream(st).decode())); } catch (e) { console.warn('Calque illisible', e); continue; }
    const own = st.dict.lookup(N('Contents'));
    const drop = new Set(own instanceof PDFArray ? own.asArray().filter(r => r instanceof PDFRef).map(r => r.tag) : []);
    const contents = page.node.get(N('Contents'));
    const arr = contents instanceof PDFRef ? ctx.lookup(contents) : contents;
    if (!drop.size || !(arr instanceof PDFArray)) continue;
    const left = arr.asArray().filter(r => !(r instanceof PDFRef && drop.has(r.tag)));
    if (left.length === arr.size()) continue;   // flux introuvables : le calque ne correspond plus à la page
    // Images désignées par la description, relues avant de retirer quoi que ce soit
    const imgs = st.dict.lookup(N('Images')), srcs = [];
    if (imgs instanceof PDFArray) for (const r of imgs.asArray()) srcs.push(r instanceof PDFRef ? await imageUrl(ctx, r).catch(e => (console.warn('Image du calque illisible', e), null)) : null);
    page.node.set(N('Contents'), ctx.obj(left));
    ctx.delete(ref); drop.forEach(tag => { const r = arr.asArray().find(x => x instanceof PDFRef && x.tag === tag); if (r) ctx.delete(r); });
    // Liens que nos textes avaient posés : le texte les recréera à l'enregistrement
    const an = page.node.lookup(N('Annots'));
    if (an instanceof PDFArray) page.node.set(N('Annots'), ctx.obj(an.asArray().filter(r => ctx.lookup(r)?.lookup?.(N('NM'))?.decodeText?.() !== LINK)));
    const annots = (Array.isArray(data?.annots) ? data.annots : [])
      .map(a => a && a.type === 'image' ? { ...a, ...(Number.isInteger(a.img) ? { src: srcs[a.img] } : {}), ...(Number.isInteger(a.origImg) ? { orig: srcs[a.origImg] } : {}) } : a)
      .map(sanitize).filter(Boolean);
    if (annots.length) layers.set(i, annots);
  }
  if (!layers.size) return null;
  return { bytes: await doc.save({ useObjectStreams: false }), layers };
}

/* ---------- Image du PDF -> data: URL (JPEG tel quel, sinon PNG avec sa transparence) ---------- */
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
const nval = o => o instanceof PDFNumber ? o.asNumber() : undefined;
function filters(d) { const f = d.lookup(N('Filter')); return f instanceof PDFArray ? f.asArray().map(x => x.decodeText()) : f ? [f.decodeText()] : []; }
function channelsOf(ctx, cs) {
  cs = ctx.lookup(cs) ?? cs;
  if (cs instanceof PDFName) return { DeviceGray: 1, DeviceRGB: 3 }[cs.decodeText()] || 0;
  if (cs instanceof PDFArray && cs.get(0)?.decodeText?.() === 'ICCBased') { const n = nval(ctx.lookup(cs.get(1))?.dict?.lookup(N('N'))); return n === 1 || n === 3 ? n : 0; }
  return 0;
}
// Pixels RVBA d'une image (8 bits, sans prédicteur) ou d'un masque de transparence
async function rgbaOf(ctx, s, W, H) {
  const d = s.dict, f = filters(d);
  if (f.length === 1 && f[0] === 'DCTDecode') {
    const bmp = await createImageBitmap(new Blob([s.contents], { type: 'image/jpeg' }));
    const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bmp, 0, 0, W, H);
    return g.getImageData(0, 0, W, H).data;
  }
  if (f.length !== 1 || f[0] !== 'FlateDecode' || (nval(d.lookup(N('BitsPerComponent'))) ?? 8) !== 8 || d.has(N('DecodeParms'))) throw new Error('format d\'image non pris en charge');
  const n = channelsOf(ctx, d.lookup(N('ColorSpace'))) || 1, raw = decodePDFRawStream(s).decode();
  if (raw.length < W * H * n) throw new Error('image tronquée');
  const px = new Uint8ClampedArray(W * H * 4);
  for (let k = 0, j = 0; k < W * H; k++, j += n) { px[k * 4] = raw[j]; px[k * 4 + 1] = raw[j + (n === 3 ? 1 : 0)]; px[k * 4 + 2] = raw[j + (n === 3 ? 2 : 0)]; px[k * 4 + 3] = 255; }
  return px;
}
async function imageUrl(ctx, ref) {
  const s = ctx.lookup(ref);
  if (!(s instanceof PDFRawStream) || s.dict.lookup(N('Subtype'))?.decodeText?.() !== 'Image') throw new Error('pas une image');
  const W = nval(s.dict.lookup(N('Width'))), H = nval(s.dict.lookup(N('Height'))), mask = s.dict.lookup(N('SMask'));
  if (!(W > 0 && H > 0) || W * H > 40e6) throw new Error('taille d\'image invalide');
  if (!mask && filters(s.dict).join() === 'DCTDecode') return 'data:image/jpeg;base64,' + b64(s.contents);
  const px = await rgbaOf(ctx, s, W, H);
  if (mask instanceof PDFRawStream) {
    const MW = nval(mask.dict.lookup(N('Width'))), MH = nval(mask.dict.lookup(N('Height')));
    if (MW === W && MH === H) { const m = await rgbaOf(ctx, mask, W, H); for (let k = 0; k < W * H; k++) px[k * 4 + 3] = m[k * 4]; }
  }
  const c = new OffscreenCanvas(W, H); c.getContext('2d').putImageData(new ImageData(px, W, H), 0, 0);
  return 'data:image/png;base64,' + b64(new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer()));
}

/* ---------- Vérification des éléments relus ---------- */
const num = (v, lo = -1e5, hi = 1e5) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
const color = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const str = (v, max) => typeof v === 'string' && v.length <= max;
const pt = p => Array.isArray(p) && p.length === 2 && num(p[0]) && num(p[1]);
const IMG = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;
// Lien d'un texte : adresse web, e-mail ou téléphone, ou position d'une page du fichier
function link(l) {
  if (l?.kind === 'url' && str(l.url, 2000) && /^(https?:\/\/|mailto:|tel:)[^\s<>"]+$/i.test(l.url)) return { kind: 'url', url: l.url };
  if (l?.kind === 'page' && Number.isInteger(l.index) && l.index >= 0 && l.index < 100000) return { kind: 'page', index: l.index };
  return null;
}
function sanitize(a) {
  if (!a || typeof a !== 'object') return null;
  const o = { id: Math.random().toString(36).slice(2, 10), type: a.type };
  const pos = () => num(a.x) && num(a.y) && (a.r == null || num(a.r, -360, 360)) && Object.assign(o, { x: a.x, y: a.y, r: a.r || 0 });
  const box = () => pos() && num(a.w, 0) && num(a.h, 0) && Object.assign(o, { w: a.w, h: a.h });
  switch (a.type) {
    case 'text': {
      if (!pos() || !str(a.text, 20000) || !num(a.size, 1, 500) || !color(a.color)) return null;
      Object.assign(o, { text: a.text, size: a.size, font: str(a.font, 40) ? a.font : 'Helvetica', bold: !!a.bold, italic: !!a.italic, color: a.color });
      if (num(a.lh, 0.5, 5)) o.lh = a.lh;
      if (num(a.ls, -0.5, 2)) o.ls = a.ls;
      if (num(a.opacity, 0, 1)) o.opacity = a.opacity;
      const l = link(a.link); if (l) o.link = l;
      return o;
    }
    case 'image': {
      if (!box() || typeof a.src !== 'string' || a.src.length >= 60e6 || !IMG.test(a.src)) return null;
      o.src = a.src;
      // Image complète et cadrage (centre en proportion, zoom) : seulement s'ils sont valides
      if (typeof a.orig === 'string' && a.orig.length < 60e6 && IMG.test(a.orig) && a.fit && num(a.fit.cx, 0, 1) && num(a.fit.cy, 0, 1) && num(a.fit.zoom, 1, 8))
        Object.assign(o, { orig: a.orig, fit: { cx: a.fit.cx, cy: a.fit.cy, zoom: a.fit.zoom } });
      return o;
    }
    case 'shape':
      if (!box() || !['rect', 'ellipse'].includes(a.kind) || !(a.stroke === '' || color(a.stroke)) || !num(a.width, 0, 100) || !(a.fill === '' || a.fill == null || color(a.fill))) return null;
      Object.assign(o, { kind: a.kind, stroke: a.stroke, fill: a.fill || '', width: a.width });
      if (num(a.rx, 0, 1000)) o.rx = a.rx;   // coins arrondis
      return o;
    case 'rect':
      if (!box() || !RECT_KINDS.has(a.kind) || !color(a.color)) return null;
      return Object.assign(o, { kind: a.kind, color: a.color });
    case 'line':
      if (![a.x1, a.y1, a.x2, a.y2].every(v => num(v)) || !color(a.stroke) || !num(a.width, 0, 100)) return null;
      return { id: o.id, type: 'line', x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2, arrow: !!a.arrow, stroke: a.stroke, width: a.width };
    case 'ink':
      if (!Array.isArray(a.strokes) || a.strokes.length > 5000 || !color(a.color) || !num(a.width, 0, 100)) return null;
      if (!a.strokes.every(s => Array.isArray(s) && s.length && s.length <= 20000 && s.every(pt))) return null;
      return { id: o.id, type: 'ink', strokes: a.strokes.map(s => s.map(p => [p[0], p[1]])), color: a.color, width: a.width };
  }
  return null;
}

return { keep, write, read, hasLayer, sanitize, linkMark, KEY };
})();
