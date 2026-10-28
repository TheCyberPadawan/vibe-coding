// Caviardage vectoriel : retire du flux de contenu d'une page tout ce qui se trouve sous les zones
// (lettres, images, dessins), sans convertir la page en image. Tout ce qui n'est pas compris avec certitude
// lève Unsupported : l'appelant bascule alors cette page en caviardage par image.
// Les zones sont des boîtes { x0, y0, x1, y1, pts } dans l'espace utilisateur de la page.
window.AtelierRedact = (() => {
'use strict';
const L = PDFLib;
const { PDFName, PDFDict, PDFArray, PDFRef, PDFNumber, PDFRawStream, PDFStream, PDFHexString, PDFString } = L;
const N = n => PDFName.of(n);

class Unsupported extends Error {}
const unsupported = msg => { throw new Unsupported(msg); };

/* ---------- Lecture du flux de contenu ---------- */
const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);
const isReg = c => !WS.has(c) && !DELIM.has(c);
const latin1 = new TextDecoder('latin1');
const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)$/;

function tokenize(b) {
  let i = 0;
  const ops = [];
  let args = [], start = 0;
  const skip = () => {
    while (i < b.length) {
      if (WS.has(b[i])) i++;
      else if (b[i] === 37) { while (i < b.length && b[i] !== 10 && b[i] !== 13) i++; }
      else break;
    }
  };
  function value() {
    skip();
    const c = b[i];
    if (c === 47) {                                  // nom
      let j = ++i; while (i < b.length && isReg(b[i])) i++;
      return { t: 'name', v: latin1.decode(b.subarray(j, i)).replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) };
    }
    if (c === 40) {                                  // chaîne littérale
      i++; let depth = 1; const out = [];
      while (i < b.length) {
        const ch = b[i++];
        if (ch === 92) {
          const n = b[i++];
          const map = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12, 40: 40, 41: 41, 92: 92 };
          if (n in map) out.push(map[n]);
          else if (n >= 48 && n <= 55) { let v = n - 48; for (let k = 0; k < 2 && b[i] >= 48 && b[i] <= 55; k++) v = v * 8 + b[i++] - 48; out.push(v & 255); }
          else if (n === 13) { if (b[i] === 10) i++; }
          else if (n !== 10) out.push(n);
        } else if (ch === 40) { depth++; out.push(ch); }
        else if (ch === 41) { if (--depth === 0) break; out.push(ch); }
        else out.push(ch);
      }
      return { t: 'str', v: Uint8Array.from(out) };
    }
    if (c === 60 && b[i + 1] === 60) {               // dictionnaire
      i += 2; const d = {};
      for (;;) {
        skip();
        if (b[i] === 62 && b[i + 1] === 62) { i += 2; break; }
        if (i >= b.length) unsupported('dictionnaire non fermé');
        const k = value(); if (k.t !== 'name') unsupported('clé de dictionnaire invalide');
        d[k.v] = value();
      }
      return { t: 'dict', v: d };
    }
    if (c === 60) {                                  // chaîne hexadécimale
      let j = ++i; while (i < b.length && b[i] !== 62) i++;
      let h = latin1.decode(b.subarray(j, i)).replace(/\s+/g, ''); i++;
      if (h.length % 2) h += '0';
      const out = new Uint8Array(h.length / 2);
      for (let k = 0; k < out.length; k++) out[k] = parseInt(h.substr(k * 2, 2), 16);
      return { t: 'str', v: out, hex: true };
    }
    if (c === 91) {                                  // tableau
      i++; const a = [];
      for (;;) { skip(); if (b[i] === 93) { i++; break; } if (i >= b.length) unsupported('tableau non fermé'); a.push(value()); }
      return { t: 'arr', v: a };
    }
    let j = i; while (i < b.length && isReg(b[i])) i++;
    if (i === j) { i++; return { t: 'kw', v: String.fromCharCode(c) }; }
    const s = latin1.decode(b.subarray(j, i));
    if (NUM_RE.test(s)) return { t: 'num', v: parseFloat(s) };
    if (s === 'true' || s === 'false') return { t: 'bool', v: s === 'true' };
    if (s === 'null') return { t: 'null' };
    return { t: 'kw', v: s };
  }
  for (;;) {
    skip();
    if (i >= b.length) break;
    if (!args.length) start = i;
    const v = value();
    if (v.t !== 'kw') { args.push(v); continue; }
    if (v.v === 'BI') {                              // image en ligne : données binaires jusqu'à EI
      const d = {};
      for (;;) { skip(); const k = value(); if (k.t === 'kw' && k.v === 'ID') break; if (k.t !== 'name') unsupported('image en ligne illisible'); d[k.v] = value(); }
      i++;
      let e = i;
      while (e < b.length - 1 && !(b[e] === 69 && b[e + 1] === 73 && WS.has(b[e - 1]) && (e + 2 >= b.length || WS.has(b[e + 2]) || DELIM.has(b[e + 2])))) e++;
      i = e + 2;
      ops.push({ op: 'BI', args: [{ t: 'dict', v: d }], s: start, e: i });
    } else ops.push({ op: v.v, args, s: start, e: i });
    args = [];
  }
  return ops;
}

function ser(o) {
  switch (o.t) {
    case 'num': return Number.isInteger(o.v) ? String(o.v) : (Math.round(o.v * 10000) / 10000).toString();
    case 'name': return '/' + o.v.replace(/[^!-~]|[#()<>[\]{}/%]/g, ch => '#' + ch.charCodeAt(0).toString(16).padStart(2, '0'));
    case 'str': return '<' + [...o.v].map(x => x.toString(16).padStart(2, '0')).join('') + '>';
    case 'arr': return '[' + o.v.map(ser).join(' ') + ']';
    case 'dict': return '<<' + Object.entries(o.v).map(([k, v]) => ser({ t: 'name', v: k }) + ' ' + ser(v)).join(' ') + '>>';
    case 'bool': return String(o.v);
    case 'null': return 'null';
    default: return o.v;
  }
}

/* ---------- Géométrie ---------- */
const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const inv = m => { const d = m[0] * m[3] - m[1] * m[2]; if (Math.abs(d) < 1e-12) return null; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; };
const ID = [1, 0, 0, 1, 0, 0];
const boxOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), x1: Math.max(...pts.map(p => p[0])), y1: Math.max(...pts.map(p => p[1])) });
const rectPts = (m, x0, y0, x1, y1) => [ap(m, x0, y0), ap(m, x1, y0), ap(m, x1, y1), ap(m, x0, y1)];
const overlap = (a, z) => [Math.min(a.x1, z.x1) - Math.max(a.x0, z.x0), Math.min(a.y1, z.y1) - Math.max(a.y0, z.y0)];
const touches = (a, zones) => zones.some(z => { const [w, h] = overlap(a, z); return w > 0 && h > 0; });
// Une lettre est retirée si au moins un quart de sa largeur et un tiers de sa hauteur passent sous la zone (ou 1 pt)
function glyphHit(g, zones) {
  const gw = g.x1 - g.x0, gh = g.y1 - g.y0;
  return zones.some(z => { const [w, h] = overlap(g, z); return w > Math.min(gw * 0.25, 1) && h > Math.min(gh * 0.33, 1); });
}

/* ---------- Polices : découpage des codes et chasses ---------- */
const look = (d, k) => d instanceof PDFDict ? d.lookup(N(k)) : undefined;
const num = o => o instanceof PDFNumber ? o.asNumber() : undefined;
const nums = a => a instanceof PDFArray ? a.asArray().map(x => num(a.context.lookup(x))) : null;
const cp1252 = new TextDecoder('windows-1252');
const STD = { Helvetica: 'Helvetica', 'Helvetica-Bold': 'HelveticaBold', 'Helvetica-Oblique': 'HelveticaOblique', 'Helvetica-BoldOblique': 'HelveticaBoldOblique',
  'Times-Roman': 'TimesRoman', 'Times-Bold': 'TimesRomanBold', 'Times-Italic': 'TimesRomanItalic', 'Times-BoldItalic': 'TimesRomanBoldItalic',
  Courier: 'Courier', 'Courier-Bold': 'CourierBold', 'Courier-Oblique': 'CourierOblique', 'Courier-BoldOblique': 'CourierBoldOblique', Symbol: 'Symbol', ZapfDingbats: 'ZapfDingbats' };

function parseCMap(bytes) {
  const s = latin1.decode(bytes), ranges = [], cids = [];
  const hex = h => parseInt(h, 16);
  for (const blk of s.matchAll(/begincodespacerange([\s\S]*?)endcodespacerange/g))
    for (const m of blk[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) ranges.push({ n: m[1].length / 2, lo: hex(m[1]), hi: hex(m[2]) });
  for (const blk of s.matchAll(/begincidrange([\s\S]*?)endcidrange/g))
    for (const m of blk[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(\d+)/g)) cids.push([hex(m[1]), hex(m[2]), +m[3]]);
  for (const blk of s.matchAll(/begincidchar([\s\S]*?)endcidchar/g))
    for (const m of blk[1].matchAll(/<([0-9a-fA-F]+)>\s*(\d+)/g)) cids.push([hex(m[1]), hex(m[1]), +m[2]]);
  if (!ranges.length) unsupported('CMap sans plage de codes');
  if (/\/WMode\s+1/.test(s)) unsupported('écriture verticale');
  return { ranges, cid: c => { for (const [a, b, d] of cids) if (c >= a && c <= b) return d + c - a; return 0; } };
}

const fontCache = new WeakMap();
function fontInfo(doc, fdict) {
  if (!(fdict instanceof PDFDict)) unsupported('police introuvable');
  if (fontCache.has(fdict)) return fontCache.get(fdict);
  const ctx = doc.context, sub = look(fdict, 'Subtype')?.asString?.().slice(1);
  const desc0 = look(fdict, 'FontDescriptor');
  let info;
  if (sub === 'Type0') {
    const df = look(fdict, 'DescendantFonts'), d = df instanceof PDFArray ? ctx.lookup(df.get(0)) : null;
    const enc = fdict.lookup(N('Encoding'));
    let cmap;
    if (enc instanceof PDFName) {
      const e = enc.asString().slice(1);
      if (e === 'Identity-H') cmap = { ranges: [{ n: 2, lo: 0, hi: 0xffff }], cid: c => c };
      else unsupported('encodage CJK prédéfini ' + e);
    } else if (enc instanceof PDFStream) cmap = parseCMap(L.decodePDFRawStream(enc).decode());
    else unsupported('encodage de police inconnu');
    const dw = num(look(d, 'DW')) ?? 1000, W = look(d, 'W'), widths = new Map();
    if (W instanceof PDFArray) {
      const a = W.asArray().map(x => ctx.lookup(x) ?? x);
      for (let k = 0; k < a.length;) {
        const c0 = num(a[k]);
        if (a[k + 1] instanceof PDFArray) { a[k + 1].asArray().forEach((w, j) => widths.set(c0 + j, num(ctx.lookup(w) ?? w))); k += 2; }
        else { const c1 = num(a[k + 1]), w = num(a[k + 2]); for (let c = c0; c <= c1 && c - c0 < 65536; c++) widths.set(c, w); k += 3; }
      }
    }
    const desc = look(d, 'FontDescriptor');
    info = {
      split(bytes) {
        const out = [];
        for (let i = 0; i < bytes.length;) {
          let r = null;
          for (const g of cmap.ranges) {
            if (i + g.n > bytes.length) continue;
            let c = 0; for (let k = 0; k < g.n; k++) c = c * 256 + bytes[i + k];
            if (c >= g.lo && c <= g.hi) { r = { code: c, n: g.n }; break; }
          }
          if (!r) r = { code: bytes[i], n: 1 };
          const cid = cmap.cid(r.code);
          out.push({ bytes: bytes.subarray(i, i + r.n), w0: (widths.get(cid) ?? dw) / 1000, space: r.n === 1 && r.code === 32 });
          i += r.n;
        }
        return out;
      },
      ...metrics(desc, 0.001),
    };
  } else if (sub === 'Type3') {
    const fm = nums(look(fdict, 'FontMatrix')) || [0.001, 0, 0, 0.001, 0, 0];
    if (Math.abs(fm[1]) > 1e-9 || Math.abs(fm[2]) > 1e-9) unsupported('police Type3 inclinée');
    const first = num(look(fdict, 'FirstChar')) ?? 0, ws = nums(look(fdict, 'Widths')) || [];
    const bb = nums(look(fdict, 'FontBBox')) || [0, 0, 1000, 1000];
    info = { split: b => [...b].map((c, k) => ({ bytes: b.subarray(k, k + 1), w0: (ws[c - first] ?? 0) * fm[0], space: c === 32 })),
      asc: Math.max(bb[3] * fm[3], 0.6), desc: Math.min(bb[1] * fm[3], -0.1) };
  } else {
    const first = num(look(fdict, 'FirstChar')) ?? 0, ws = nums(look(fdict, 'Widths'));
    const missing = num(look(desc0, 'MissingWidth')) ?? 0;
    let width;
    if (ws && ws.length) width = c => (ws[c - first] ?? missing) / 1000;
    else {
      const base = (look(fdict, 'BaseFont')?.asString?.() || '/Helvetica').slice(1).replace(/^[A-Z]{6}\+/, '');
      const std = STD[base] || (/courier|mono/i.test(base) ? 'Courier' : /times|serif/i.test(base) ? 'TimesRoman' : 'Helvetica');
      const emb = L.StandardFontEmbedder.for(L.StandardFonts[std] || std);
      width = c => { try { return emb.widthOfTextAtSize(cp1252.decode(Uint8Array.of(c)), 1); } catch { return 0.5; } };
    }
    info = { split: b => [...b].map((c, k) => ({ bytes: b.subarray(k, k + 1), w0: width(c), space: c === 32 })), ...metrics(desc0, 0.001) };
  }
  fontCache.set(fdict, info);
  return info;
}
function metrics(desc, k) {
  const a = num(look(desc, 'Ascent')), d = num(look(desc, 'Descent'));
  return { asc: a ? Math.max(a * k, 0.6) : 0.85, desc: d ? Math.min(d * k, -0.1) : -0.22 };
}

/* ---------- Images : décodage, effacement des pixels, réencodage ---------- */
function filters(dict) {
  const f = dict.lookup(N('Filter')), p = dict.lookup(N('DecodeParms'));
  const names = f instanceof PDFArray ? f.asArray().map(x => x.asString().slice(1)) : f ? [f.asString().slice(1)] : [];
  const parms = p instanceof PDFArray ? p.asArray().map(x => dict.context.lookup(x)) : [p];
  return names.map((n, k) => ({ n, p: parms[k] instanceof PDFDict ? parms[k] : null }));
}
function unpredict(data, p, colors, bpc, cols) {
  const pred = num(look(p, 'Predictor')) ?? 1;
  if (pred === 1) return data;
  colors = num(look(p, 'Colors')) ?? colors; bpc = num(look(p, 'BitsPerComponent')) ?? bpc; cols = num(look(p, 'Columns')) ?? cols;
  if (pred === 2) unsupported('prédicteur TIFF');
  const bpp = Math.max(1, Math.ceil(colors * bpc / 8)), row = Math.ceil(colors * bpc * cols / 8);
  const rows = Math.floor(data.length / (row + 1)), out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y++) {
    const t = data[y * (row + 1)], src = y * (row + 1) + 1, dst = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, up = y ? out[dst - row + x] : 0, ul = y && x >= bpp ? out[dst - row + x - bpp] : 0, v = data[src + x];
      let r;
      if (t === 0) r = v; else if (t === 1) r = v + a; else if (t === 2) r = v + up; else if (t === 3) r = v + ((a + up) >> 1);
      else if (t === 4) { const pa = Math.abs(up - ul), pb = Math.abs(a - ul), pc = Math.abs(a + up - 2 * ul); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : ul); }
      else unsupported('ligne PNG invalide');
      out[dst + x] = r & 255;
    }
  }
  return out;
}
function components(doc, cs) {
  cs = doc.context.lookup(cs) ?? cs;
  if (cs instanceof PDFName) return { DeviceGray: 1, CalGray: 1, DeviceRGB: 3, CalRGB: 3, DeviceCMYK: 4, Lab: 3 }[cs.asString().slice(1)] ?? unsupported('espace couleur');
  if (cs instanceof PDFArray) {
    const k = cs.get(0).asString().slice(1);
    if (k === 'Indexed' || k === 'Separation') return 1;
    if (k === 'ICCBased') return num(look(doc.context.lookup(cs.get(1)), 'N')) ?? 3;
    if (k === 'DeviceN') return doc.context.lookup(cs.get(1)).size();
    return components(doc, cs.get(0));
  }
  unsupported('espace couleur');
}
// Coche les pixels de l'image recouverts par une zone (zones ramenées dans le carré unité de l'image)
function pixelMask(W, H, ctm, zones) {
  const im = inv(ctm); if (!im) unsupported('image dégénérée');
  const polys = zones.map(z => z.pts.map(p => { const [u, v] = ap(im, p[0], p[1]); return [u * W, (1 - v) * H]; }));
  const mask = new Uint8Array(W * H); let any = false;
  for (const pl of polys) {
    const b = boxOf(pl), x0 = Math.max(0, Math.floor(b.x0) - 1), x1 = Math.min(W - 1, Math.ceil(b.x1) + 1), y0 = Math.max(0, Math.floor(b.y0) - 1), y1 = Math.min(H - 1, Math.ceil(b.y1) + 1);
    let area = 0; for (let k = 0; k < pl.length; k++) { const [a, c] = [pl[k], pl[(k + 1) % pl.length]]; area += a[0] * c[1] - c[0] * a[1]; }
    const sgn = Math.sign(area) || 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let inside = true;
      for (let k = 0; k < pl.length && inside; k++) {
        const [a, c] = [pl[k], pl[(k + 1) % pl.length]], ex = c[0] - a[0], ey = c[1] - a[1], len = Math.hypot(ex, ey) || 1;
        if (sgn * (ex * (y + 0.5 - a[1]) - ey * (x + 0.5 - a[0])) / len < -1) inside = false;   // 1 pixel de marge
      }
      if (inside) { mask[y * W + x] = 1; any = true; }
    }
  }
  return any ? mask : null;
}
async function editImage(doc, stream, ctm, zones, fill) {
  const d = stream.dict, W = num(d.lookup(N('Width'))), H = num(d.lookup(N('Height')));
  if (!W || !H || W * H > 60e6) unsupported('image trop grande');
  if (d.lookup(N('Decode'))) unsupported('image avec tableau Decode');
  const mask = pixelMask(W, H, ctm, zones);
  if (!mask) return null;
  const fl = filters(d), isMask = d.lookup(N('ImageMask'))?.asBoolean?.() === true;
  const bpc = isMask ? 1 : num(d.lookup(N('BitsPerComponent'))) ?? 8;
  let nd;
  if (fl.length && fl[fl.length - 1].n === 'DCTDecode') {
    if (fl.length > 1 || isMask) unsupported('JPEG combiné');
    const n = components(doc, d.lookup(N('ColorSpace')));
    const bmp = await createImageBitmap(new Blob([stream.contents], { type: 'image/jpeg' }));
    const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bmp, 0, 0, W, H);
    const px = g.getImageData(0, 0, W, H);
    for (let k = 0; k < mask.length; k++) if (mask[k]) { px.data[k * 4] = px.data[k * 4 + 1] = px.data[k * 4 + 2] = fill; }
    g.putImageData(px, 0, 0);
    const jpg = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 })).arrayBuffer());
    if (n === 1) {   // le navigateur rend du RVB : on repasse en niveaux de gris
      const gray = new Uint8Array(W * H); for (let k = 0; k < gray.length; k++) gray[k] = px.data[k * 4];
      return finish(doc, d, doc.context.flateStream(gray, { Type: 'XObject', Subtype: 'Image', Width: W, Height: H, BitsPerComponent: 8, ColorSpace: 'DeviceGray' }), ctm, zones);
    }
    nd = doc.context.obj({ Type: 'XObject', Subtype: 'Image', Width: W, Height: H, BitsPerComponent: 8, ColorSpace: 'DeviceRGB', Filter: 'DCTDecode' });
    return finish(doc, d, PDFRawStream.of(nd, jpg), ctm, zones);
  }
  let data = stream.contents;
  for (const f of fl) {
    if (!['FlateDecode', 'LZWDecode', 'ASCII85Decode', 'ASCIIHexDecode', 'RunLengthDecode'].includes(f.n)) unsupported('filtre d\'image ' + f.n);
    const tmp = PDFRawStream.of(doc.context.obj({ Filter: f.n }), data);
    data = L.decodePDFRawStream(tmp).decode();
    if (f.p) data = unpredict(data, f.p, isMask ? 1 : components(doc, d.lookup(N('ColorSpace'))), bpc, W);
  }
  const n = isMask ? 1 : components(doc, d.lookup(N('ColorSpace')));
  if (bpc === 8) {
    if (data.length < W * H * n) unsupported('image tronquée');
    const out = data.slice(0, W * H * n);
    for (let k = 0; k < mask.length; k++) if (mask[k]) out.fill(fill, k * n, k * n + n);
    data = out;
  } else if (bpc === 1 && n === 1) {
    const row = Math.ceil(W / 8); if (data.length < row * H) unsupported('masque tronqué');
    data = data.slice(0, row * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) {
      const bit = 0x80 >> (x & 7), at = y * row + (x >> 3);
      data[at] = isMask ? data[at] | bit : (fill ? data[at] | bit : data[at] & ~bit);
    }
  } else unsupported('profondeur d\'image ' + bpc);
  const ns = doc.context.flateStream(data, {});   // mêmes entrées que l'original, données recompressées
  for (const [k, v] of d.entries()) if (!['Filter', 'DecodeParms', 'Length'].includes(k.asString().slice(1))) ns.dict.set(k, v);
  return finish(doc, d, ns, ctm, zones);
}
async function finish(doc, d, ns, ctm, zones) {
  const sm = d.lookup(N('SMask'));
  if (sm instanceof PDFStream) {
    const e = await editImage(doc, sm, ctm, zones, 255);
    if (e) ns.dict.set(N('SMask'), e);
  }
  ns.dict.set(N('ARd'), L.PDFBool.True);   // marque « image caviardée », relue par la vérification
  return doc.context.register(ns);
}

/* ---------- Interprétation et réécriture d'un flux de contenu ---------- */
const PAINT = new Set(['S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'n']);
const PATH = new Set(['m', 'l', 'c', 'v', 'y', 'h', 're']);
const enc = new TextEncoder();
const bytesOf = s => Uint8Array.from(s, ch => ch.charCodeAt(0) & 255);

// audit : ne réécrit rien, signale ce qui subsiste sous une zone
async function processContent(doc, bytes, res, ctm0, zones, opts, depth = 0) {
  if (depth > 6) unsupported('formulaires imbriqués trop profonds');
  const ops = tokenize(bytes), out = [], problems = [];
  let gs = { ctm: ctm0, font: null, fs: 0, tc: 0, tw: 0, th: 1, tl: 0, rise: 0 };
  const stack = [];
  let tm = ID, tlm = ID, path = [], pathOps = [], clip = false, newRes = null;
  const emitRaw = o => out.push(bytes.subarray(o.s, o.e), bytesOf('\n'));
  const emit = s => out.push(bytesOf(s + '\n'));
  const resDict = () => newRes || res;
  const sub = (name, kind) => { const d = look(resDict(), kind); return d instanceof PDFDict ? d.lookup(N(name)) : undefined; };
  const cloneRes = kind => {
    if (!newRes) newRes = res instanceof PDFDict ? res.clone(doc.context) : doc.context.obj({});
    const cur = look(newRes, kind), copy = cur instanceof PDFDict ? cur.clone(doc.context) : doc.context.obj({});
    newRes.set(N(kind), copy); return copy;
  };
  let uid = 0;
  const addX = ref => { const x = cloneRes('XObject'); let k; do k = `ARd${++uid}`; while (x.get(N(k))); x.set(N(k), ref); return k; };

  for (const o of ops) {
    const a = o.args, an = k => a[k]?.v;
    if (PATH.has(o.op)) {
      const pts = [];
      if (o.op === 're') { const [x, y, w, h] = a.map(v => v.v); pts.push(...rectPts(gs.ctm, x, y, x + w, y + h)); }
      else for (let k = 0; k + 1 < a.length; k += 2) pts.push(ap(gs.ctm, a[k].v, a[k + 1].v));
      path.push(...pts); pathOps.push(o); continue;
    }
    if (o.op === 'W' || o.op === 'W*') { clip = true; pathOps.push(o); continue; }
    if (PAINT.has(o.op)) {
      let drop = false;
      if (path.length && !clip) {
        const b = boxOf(path);
        const inside = zones.some(z => b.x0 >= z.x0 - 0.5 && b.x1 <= z.x1 + 0.5 && b.y0 >= z.y0 - 0.5 && b.y1 <= z.y1 + 0.5);
        if (inside) drop = true;
        else if (pathOps.length > 30 && zones.some(z => { const [w, h] = overlap(b, z); return w > 0 && h > 0 && w * h > 0.4 * (b.x1 - b.x0) * (b.y1 - b.y0); }))
          unsupported('tracé complexe sous une zone (texte vectorisé ?)');
      }
      if (opts.audit) { if (drop) problems.push('un dessin subsiste sous une zone'); }
      else if (!drop) { pathOps.forEach(emitRaw); emitRaw(o); }
      path = []; pathOps = []; clip = false; continue;
    }
    if (pathOps.length) { pathOps.forEach(emitRaw); path = []; pathOps = []; clip = false; }

    switch (o.op) {
      case 'q': stack.push({ ...gs }); break;
      case 'Q': if (stack.length) gs = stack.pop(); break;
      case 'cm': gs.ctm = mul(a.map(v => v.v), gs.ctm); break;
      case 'BT': tm = tlm = ID; break;
      case 'Tf': gs.font = an(0); gs.fs = an(1); break;
      case 'Tc': gs.tc = an(0); break;
      case 'Tw': gs.tw = an(0); break;
      case 'Tz': gs.th = an(0) / 100; break;
      case 'TL': gs.tl = an(0); break;
      case 'Ts': gs.rise = an(0); break;
      case 'Td': tlm = tm = mul([1, 0, 0, 1, an(0), an(1)], tlm); break;
      case 'TD': gs.tl = -an(1); tlm = tm = mul([1, 0, 0, 1, an(0), an(1)], tlm); break;
      case 'Tm': tlm = tm = a.map(v => v.v); break;
      case 'T*': tlm = tm = mul([1, 0, 0, 1, 0, -gs.tl], tlm); break;
    }
    if (o.op === 'Tj' || o.op === 'TJ' || o.op === "'" || o.op === '"') {
      let prefix = '';
      if (o.op === "'" || o.op === '"') {
        if (o.op === '"') { gs.tw = an(0); gs.tc = an(1); prefix = `${ser(a[0])} Tw ${ser(a[1])} Tc `; }
        tlm = tm = mul([1, 0, 0, 1, 0, -gs.tl], tlm); prefix += 'T* ';
      }
      const fd = sub(gs.font, 'Font');
      const fi = fontInfo(doc, fd instanceof PDFRef ? doc.context.lookup(fd) : fd);
      const items = o.op === 'TJ' ? a[0].v : [a[a.length - 1]];
      const fs = gs.fs, th = gs.th;
      let removed = false; const arr = []; let pend = 0;
      const flushStr = buf => { if (buf.length) { if (pend) { arr.push({ t: 'num', v: pend }); pend = 0; } arr.push({ t: 'str', v: Uint8Array.from(buf) }); } };
      for (const it of items) {
        if (it.t === 'num') { tm = mul([1, 0, 0, 1, -it.v / 1000 * fs * th, 0], tm); pend += it.v; continue; }
        if (it.t !== 'str') continue;
        let buf = [];
        for (const g of fi.split(it.v)) {
          const trm = mul([fs * th, 0, 0, fs, 0, gs.rise], mul(tm, gs.ctm));
          const box = boxOf(rectPts(trm, 0, fi.desc, Math.max(g.w0, 0.05), fi.asc));
          const adv = (g.w0 * fs + gs.tc + (g.space ? gs.tw : 0)) * th;
          tm = mul([1, 0, 0, 1, adv, 0], tm);
          if (glyphHit(box, zones)) {
            removed = true;
            if (opts.audit) { problems.push('du texte subsiste sous une zone'); continue; }
            if (!fs) unsupported('taille de police nulle');
            flushStr(buf); buf = [];
            pend += -(g.w0 * fs + gs.tc + (g.space ? gs.tw : 0)) * 1000 / fs;
          } else buf.push(...g.bytes);
        }
        flushStr(buf);
      }
      if (opts.audit) continue;
      if (!removed) { emitRaw(o); continue; }
      if (pend) arr.push({ t: 'num', v: pend });
      emit(prefix + ser({ t: 'arr', v: arr }) + ' TJ');
      continue;
    }
    if (o.op === 'BI') {
      if (touches(boxOf(rectPts(gs.ctm, 0, 0, 1, 1)), zones)) {
        if (opts.audit) problems.push('une image en ligne subsiste sous une zone'); else unsupported('image en ligne sous une zone');
      }
      if (!opts.audit) emitRaw(o);
      continue;
    }
    if (o.op === 'Do') {
      const ref = sub(an(0), 'XObject'), x = doc.context.lookup(ref);
      if (!(x instanceof PDFStream)) { if (!opts.audit) emitRaw(o); continue; }
      const st = x.dict.lookup(N('Subtype'))?.asString();
      if (st === '/Image') {
        const hit = touches(boxOf(rectPts(gs.ctm, 0, 0, 1, 1)), zones);
        if (opts.audit) { if (hit && pixelMask(num(x.dict.lookup(N('Width'))), num(x.dict.lookup(N('Height'))), gs.ctm, zones) && !x.dict.get(N('ARd'))) problems.push('une image subsiste sous une zone'); continue; }
        if (!hit) { emitRaw(o); continue; }
        const nref = await editImage(doc, x, gs.ctm, zones, 0);
        if (!nref) { emitRaw(o); continue; }
        emit(`${ser({ t: 'name', v: addX(nref) })} Do`);
        continue;
      }
      if (st === '/Form') {
        const m = nums(x.dict.lookup(N('Matrix'))) || ID, bb = nums(x.dict.lookup(N('BBox'))) || [0, 0, 0, 0];
        const fctm = mul(m, gs.ctm);
        if (!touches(boxOf(rectPts(fctm, bb[0], bb[1], bb[2], bb[3])), zones)) { if (!opts.audit) emitRaw(o); continue; }
        const fres = x.dict.lookup(N('Resources')) || resDict();
        const r = await processContent(doc, L.decodePDFRawStream(x).decode(), fres, fctm, zones, opts, depth + 1);
        if (opts.audit) { problems.push(...r.problems); continue; }
        const nd = doc.context.obj({});
        for (const [k, v] of x.dict.entries()) if (!['Filter', 'DecodeParms', 'Length', 'Resources'].includes(k.asString().slice(1))) nd.set(k, v);
        nd.set(N('Resources'), r.res);
        const ns = doc.context.flateStream(r.bytes, {}); for (const [k, v] of nd.entries()) ns.dict.set(k, v);
        emit(`${ser({ t: 'name', v: addX(doc.context.register(ns)) })} Do`);
        continue;
      }
      if (!opts.audit) emitRaw(o);
      continue;
    }
    if ((o.op === 'BDC' || o.op === 'DP') && a[1]?.t === 'dict' && ['ActualText', 'Alt', 'E'].some(k => k in a[1].v)) {
      if (opts.audit) { problems.push('un texte de remplacement (ActualText) subsiste'); continue; }
      const d = { ...a[1].v }; delete d.ActualText; delete d.Alt; delete d.E;
      emit(`${ser(a[0])} ${ser({ t: 'dict', v: d })} ${o.op}`);
      continue;
    }
    if (!opts.audit) emitRaw(o);
  }
  if (pathOps.length && !opts.audit) pathOps.forEach(emitRaw);
  if (opts.audit) return { problems };
  let len = 0; for (const c of out) len += c.length;
  const all = new Uint8Array(len); let at = 0; for (const c of out) { all.set(c, at); at += c.length; }
  // Un dessin remplacé par sa version nettoyée ne doit pas rester dans les ressources : il contient l'original
  if (newRes) {
    const used = usedXObjects(all), x = look(newRes, 'XObject');
    if (x instanceof PDFDict) for (const [k] of x.entries()) if (!used.has(k.decodeText())) x.delete(k);
  }
  return { bytes: all, res: newRes || res };
}
function usedXObjects(bytes) {
  const s = new Set();
  for (const o of tokenize(bytes)) if (o.op === 'Do' && o.args[0]?.t === 'name') s.add(o.args[0].v);
  return s;
}

/* ---------- Page ---------- */
function pageContent(doc, node) {
  const c = node.lookup(N('Contents'));
  const list = c instanceof PDFArray ? c.asArray().map(r => doc.context.lookup(r)) : c ? [c] : [];
  const parts = list.map(s => s instanceof L.PDFContentStream ? s.getUnencodedContents() : L.decodePDFRawStream(s).decode());
  let len = 0; parts.forEach(p => len += p.length + 1);
  const all = new Uint8Array(len); let at = 0; for (const p of parts) { all.set(p, at); at += p.length; all[at++] = 10; }
  return all;
}
const annotRect = (doc, a) => { const r = nums(doc.context.lookup(a)?.lookup?.(N('Rect'))); return r && { x0: Math.min(r[0], r[2]), y0: Math.min(r[1], r[3]), x1: Math.max(r[0], r[2]), y1: Math.max(r[1], r[3]) }; };

// Nettoie la page en place : nouveau flux de contenu, ressources réécrites, annotations sous les zones retirées
async function cleanPage(doc, page, zones) {
  const node = page.node, res = node.Resources() || doc.context.obj({});
  const r = await processContent(doc, pageContent(doc, node), res, ID, zones, {});
  node.set(N('Contents'), doc.context.obj([doc.context.register(doc.context.flateStream(r.bytes))]));
  const nres = r.res.clone(doc.context);
  for (const k of ['Font', 'XObject', 'ExtGState']) nres.set(N(k), look(nres, k) instanceof PDFDict ? look(nres, k).clone(doc.context) : doc.context.obj({}));
  const used = usedXObjects(r.bytes), xo = look(nres, 'XObject');
  for (const [k] of xo.entries()) if (!used.has(k.decodeText())) xo.delete(k);
  node.set(N('Resources'), nres);
  const annots = node.lookup(N('Annots'));
  if (annots instanceof PDFArray) {
    const keep = annots.asArray().filter(a => { const b = annotRect(doc, a); return !(b && touches(b, zones)); });
    node.set(N('Annots'), doc.context.obj(keep));
  }
  for (const k of ['Thumb', 'PieceInfo', 'B']) node.delete(N(k));
}

// Relit la page produite : renvoie la liste de ce qui subsiste sous les zones (vide si tout est propre)
async function auditPage(doc, page, zones) {
  const node = page.node, c = node.lookup(N('Contents'));
  const first = c instanceof PDFArray ? doc.context.lookup(c.get(0)) : c;
  if (!first) return [];
  const bytes = first instanceof L.PDFContentStream ? first.getUnencodedContents() : L.decodePDFRawStream(first).decode();
  const res = node.Resources() || doc.context.obj({});
  const r = await processContent(doc, bytes, res, ID, zones, { audit: true });
  // Toute ressource de dessin non utilisée par la page est suspecte (elle pourrait contenir l'original)
  const used = new Set(), list = c instanceof PDFArray ? c.asArray().map(x => doc.context.lookup(x)) : [first];
  for (const s of list) usedXObjects(s instanceof L.PDFContentStream ? s.getUnencodedContents() : L.decodePDFRawStream(s).decode()).forEach(n => used.add(n));
  const xo = look(res, 'XObject');
  if (xo instanceof PDFDict && xo.entries().some(([k]) => !used.has(k.decodeText()))) r.problems.push('une ressource inutilisée subsiste');
  const annots = node.lookup(N('Annots'));
  if (annots instanceof PDFArray && annots.asArray().some(a => { const b = annotRect(doc, a); return b && touches(b, zones); })) r.problems.push('une annotation subsiste sous une zone');
  return [...new Set(r.problems)];
}

return { cleanPage, auditPage, Unsupported, tokenize };
})();
