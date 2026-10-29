// Compression d'un PDF : images réduites à la résolution utile et réencodées, flux identiques fusionnés.
// Le texte et les dessins vectoriels ne sont pas touchés.
window.AtelierCompress = (() => {
'use strict';
const L = PDFLib;
const { PDFName, PDFDict, PDFArray, PDFRawStream, PDFStream, PDFNumber, PDFRef } = L;
const N = n => PDFName.of(n);
const num = o => o instanceof PDFNumber ? o.asNumber() : undefined;

const PRESETS = { haute: { dpi: 200, q: 0.85, jpegFlate: false }, moyenne: { dpi: 150, q: 0.72, jpegFlate: true }, faible: { dpi: 96, q: 0.55, jpegFlate: true } };

function channels(doc, cs) {
  cs = doc.context.lookup(cs) ?? cs;
  if (cs instanceof PDFName) return { DeviceGray: 1, CalGray: 1, DeviceRGB: 3, CalRGB: 3 }[cs.decodeText()] || 0;
  if (cs instanceof PDFArray && cs.get(0)?.decodeText?.() === 'ICCBased') { const n = num(doc.context.lookup(cs.get(1))?.dict?.lookup(N('N'))); return n === 1 || n === 3 ? n : 0; }
  return 0;
}
function unpredict(data, p, colors, cols) {
  const pred = num(p?.lookup?.(N('Predictor'))) ?? 1;
  if (pred < 10) return pred === 1 ? data : null;
  const row = colors * cols, rows = Math.floor(data.length / (row + 1)), out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y++) {
    const t = data[y * (row + 1)], s = y * (row + 1) + 1, d = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= colors ? out[d + x - colors] : 0, up = y ? out[d - row + x] : 0, ul = y && x >= colors ? out[d - row + x - colors] : 0, v = data[s + x];
      let r = v;
      if (t === 1) r = v + a; else if (t === 2) r = v + up; else if (t === 3) r = v + ((a + up) >> 1);
      else if (t === 4) { const pa = Math.abs(up - ul), pb = Math.abs(a - ul), pc = Math.abs(a + up - 2 * ul); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : ul); }
      out[d + x] = r & 255;
    }
  }
  return out;
}
// Pixels RVBA d'une image du PDF, ou null si son format n'est pas pris en charge
async function pixels(doc, s) {
  const d = s.dict, W = num(d.lookup(N('Width'))), H = num(d.lookup(N('Height')));
  if (!W || !H || W * H > 50e6 || d.lookup(N('ImageMask'))?.asBoolean?.() || d.has(N('Decode')) || d.has(N('Mask'))) return null;
  const f = d.lookup(N('Filter')), fl = f instanceof PDFArray ? f.asArray().map(x => x.decodeText()) : f ? [f.decodeText()] : [];
  if (fl.length === 1 && fl[0] === 'DCTDecode') {
    try {
      const bmp = await createImageBitmap(new Blob([s.contents], { type: 'image/jpeg' }));
      const c = new OffscreenCanvas(W, H); c.getContext('2d').drawImage(bmp, 0, 0, W, H);
      return { W, H, kind: 'jpeg', img: c, gray: channels(doc, d.lookup(N('ColorSpace'))) === 1 };
    } catch { return null; }
  }
  if (fl.length !== 1 || fl[0] !== 'FlateDecode' || (num(d.lookup(N('BitsPerComponent'))) ?? 8) !== 8) return null;
  const n = channels(doc, d.lookup(N('ColorSpace'))); if (!n) return null;
  let raw = L.decodePDFRawStream(s).decode();
  raw = unpredict(raw, d.lookup(N('DecodeParms')), n, W); if (!raw || raw.length < W * H * n) return null;
  const id = new ImageData(W, H), px = id.data;
  for (let k = 0, j = 0; k < W * H; k++, j += n) { px[k * 4] = raw[j]; px[k * 4 + 1] = raw[j + (n === 3 ? 1 : 0)]; px[k * 4 + 2] = raw[j + (n === 3 ? 2 : 0)]; px[k * 4 + 3] = 255; }
  const c = new OffscreenCanvas(W, H); c.getContext('2d').putImageData(id, 0, 0);
  return { W, H, kind: 'flate', img: c, n, photo: W * H > 250000 };
}

// opts.strip : retire aussi vignettes, fiche XMP et données privées d'autres logiciels (sans effet sur l'affichage)
async function compress(bytes, level = 'moyenne', onProgress, opts = {}) {
  const P = PRESETS[level] || PRESETS.moyenne;
  const doc = await L.PDFDocument.load(bytes, { updateMetadata: false }), ctx = doc.context;
  if (opts.strip) {
    doc.getPages().forEach(p => p.node.delete(N('Thumb')));
    doc.catalog.delete(N('Metadata'));
    for (const [, o] of ctx.enumerateIndirectObjects()) { const d = o instanceof PDFDict ? o : o instanceof PDFStream ? o.dict : null; d?.delete(N('PieceInfo')); }
  }
  const maxIn = Math.max(...doc.getPages().map(p => { const { width, height } = p.getSize(); return Math.max(width, height) / 72; }));
  const limit = Math.ceil(maxIn * P.dpi);
  const images = ctx.enumerateIndirectObjects().filter(([, o]) => o instanceof PDFRawStream && o.dict.lookup(N('Subtype'))?.decodeText?.() === 'Image');
  let saved = 0, touched = 0;
  for (const [k, [ref, s]] of images.entries()) {
    onProgress?.(k + 1, images.length);
    const px = await pixels(doc, s); if (!px) continue;
    const scale = Math.min(1, limit / Math.max(px.W, px.H)), W = Math.max(1, Math.round(px.W * scale)), H = Math.max(1, Math.round(px.H * scale));
    const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(px.img, 0, 0, W, H);
    let ns;
    const keep = new Map(); for (const [kk, v] of s.dict.entries()) if (!['Filter', 'DecodeParms', 'Length', 'Width', 'Height', 'BitsPerComponent', 'ColorSpace'].includes(kk.decodeText())) keep.set(kk, v);
    if (px.kind === 'jpeg' || (P.jpegFlate && px.photo)) {
      const jpg = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: P.q })).arrayBuffer());
      ns = PDFRawStream.of(ctx.obj({ Type: 'XObject', Subtype: 'Image', Width: W, Height: H, BitsPerComponent: 8, ColorSpace: 'DeviceRGB', Filter: 'DCTDecode' }), jpg);
    } else {
      if (scale > 0.98) continue;   // image sans perte déjà à la bonne taille
      const rgba = g.getImageData(0, 0, W, H).data, n = px.n, out = new Uint8Array(W * H * n);
      for (let i = 0, j = 0; i < W * H; i++, j += n) { out[j] = rgba[i * 4]; if (n === 3) { out[j + 1] = rgba[i * 4 + 1]; out[j + 2] = rgba[i * 4 + 2]; } }
      ns = ctx.flateStream(out, { Type: 'XObject', Subtype: 'Image', Width: W, Height: H, BitsPerComponent: 8 });
      ns.dict.set(N('ColorSpace'), s.dict.get(N('ColorSpace')));
    }
    for (const [kk, v] of keep) ns.dict.set(kk, v);
    const newLen = ns instanceof PDFRawStream ? ns.contents.length : ns.getContents().length;
    if (newLen < s.contents.length * 0.9) { ctx.assign(ref, ns); saved += s.contents.length - newLen; touched++; }
  }
  // Flux laissés sans compression (contenu des pages, polices…) : compressés sans perte
  let deflated = 0;
  for (const [ref, o] of ctx.enumerateIndirectObjects()) {
    if (!(o instanceof PDFRawStream) || o.dict.has(N('Filter')) || o.contents.length < 256) continue;
    const type = o.dict.lookup(N('Type'))?.decodeText?.();
    if (type === 'Metadata' || type === 'XRef') continue;   // la fiche XMP doit rester lisible
    const ns = ctx.flateStream(o.contents);
    for (const [k, v] of o.dict.entries()) if (!['Length', 'Filter', 'DecodeParms'].includes(k.decodeText())) ns.dict.set(k, v);
    if (ns.getContents().length < o.contents.length * 0.9) { saved += o.contents.length - ns.getContents().length; ctx.assign(ref, ns); deflated++; }
  }
  // Flux identiques (logos répétés, polices en double après une fusion) : une seule copie
  const byKey = new Map(), alias = new Map();
  const hash = async b => new Uint8Array(await crypto.subtle.digest('SHA-256', b)).slice(0, 12).join(',');
  for (const [ref, o] of ctx.enumerateIndirectObjects()) {
    if (!(o instanceof PDFRawStream) || o.dict.lookup(N('Type'))?.decodeText?.() === 'Page') continue;
    const key = (await hash(o.contents)) + '|' + o.dict.toString();
    if (byKey.has(key)) alias.set(ref.tag, byKey.get(key)); else byKey.set(key, ref);
  }
  if (alias.size) {
    const fix = o => {
      if (o instanceof PDFDict) { for (const [k, v] of o.entries()) { if (v instanceof PDFRef && alias.has(v.tag)) o.set(k, alias.get(v.tag)); else fix(v); } }
      else if (o instanceof PDFArray) { for (let i = 0; i < o.size(); i++) { const v = o.get(i); if (v instanceof PDFRef && alias.has(v.tag)) o.set(i, alias.get(v.tag)); else fix(v); } }
      else if (o instanceof PDFStream) fix(o.dict);
    };
    for (const [, o] of ctx.enumerateIndirectObjects()) fix(o);
  }
  return { bytes: await doc.save({ useObjectStreams: true }), images: touched, saved, duplicates: alias.size, deflated };
}

return { compress, PRESETS };
})();
