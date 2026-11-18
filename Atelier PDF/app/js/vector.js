// Blocs de couleur du PDF : repère les formes pleines du flux de contenu (rectangles, formes arrondies, tracés)
// et les modifie à leur place (déplacement, taille, couleur, suppression). Une forme modifiée reste au même
// rang dans le dessin : le texte posé dessus reste au-dessus.
// Chaque forme pleine reçoit un numéro d'ordre (ord) dans l'ordre du dessin, formulaires (XObject) compris :
// scan() et apply() parcourent le contenu exactement de la même façon.
// edits : { [ord]: { m: [a, b, c, d, e, f] (transformation dans l'espace de la page), fill: '#rrggbb', del: true } }
window.AtelierVector = (() => {
'use strict';
const L = PDFLib;
const { PDFName, PDFDict, PDFArray, PDFStream } = L;
const N = n => PDFName.of(n);
const ID = [1, 0, 0, 1, 0, 0];
const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function inv(m) {
  const d = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(d) < 1e-12) return null;
  return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d];
}
const FILL = new Set(['f', 'F', 'f*', 'B', 'B*', 'b', 'b*']);
const PAINT = new Set([...FILL, 'S', 's', 'n']);
const PATH = new Set(['m', 'l', 'c', 'v', 'y', 'h', 're']);
const look = (d, k) => d instanceof PDFDict ? d.lookup(N(k)) : undefined;
const enc = s => Uint8Array.from(s, ch => ch.charCodeAt(0) & 255);
const NL = enc('\n');
const fmt = n => (Math.abs(n) < 1e-9 ? 0 : +n.toFixed(6)).toString();

/* ---------- Couleurs ---------- */
function csKind(res, name, depth = 0) {
  if (['DeviceRGB', 'RGB', 'CalRGB'].includes(name)) return 'RGB';
  if (['DeviceGray', 'G', 'CalGray'].includes(name)) return 'G';
  if (['DeviceCMYK', 'CMYK'].includes(name)) return 'CMYK';
  if (depth > 3) return null;
  const d = look(res, 'ColorSpace'), o = d instanceof PDFDict ? d.lookup(N(name)) : null;
  if (o instanceof PDFName) return csKind(res, o.decodeText(), depth + 1);
  if (o instanceof PDFArray) {
    const t = o.lookup(0), tn = t instanceof PDFName ? t.decodeText() : '';
    if (tn === 'ICCBased') { const n = o.lookup(1)?.dict?.lookup(N('N'))?.asNumber?.(); return n === 1 ? 'G' : n === 3 ? 'RGB' : n === 4 ? 'CMYK' : null; }
    if (tn === 'CalRGB') return 'RGB';
    if (tn === 'CalGray') return 'G';
  }
  return null;   // motif, dégradé, ton direct… : la forme se déplace mais sa couleur n'est pas modifiable
}
const DEFAULT = { G: [0], RGB: [0, 0, 0], CMYK: [0, 0, 0, 1] };
function hexOf(f) {
  const v = f?.v; if (!f?.cs || !v || v.some(x => typeof x !== 'number')) return null;
  const c = x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0');
  if (f.cs === 'G') return '#' + c(v[0]).repeat(3);
  if (f.cs === 'RGB' && v.length >= 3) return '#' + c(v[0]) + c(v[1]) + c(v[2]);
  if (f.cs === 'CMYK' && v.length >= 4) { const [C, M, Y, K] = v; return '#' + c((1 - C) * (1 - K)) + c((1 - M) * (1 - K)) + c((1 - Y) * (1 - K)); }
  return null;
}
const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

/* ---------- Contenu ---------- */
function streamBytes(s) { return s instanceof L.PDFContentStream ? s.getUnencodedContents() : L.decodePDFRawStream(s).decode(); }
function pageContent(doc, node) {
  const c = node.lookup(N('Contents'));
  const list = c instanceof PDFArray ? c.asArray().map(r => doc.context.lookup(r)) : c ? [c] : [];
  const parts = list.filter(s => s instanceof PDFStream).map(streamBytes);
  let len = 0; parts.forEach(p => len += p.length + 1);
  const all = new Uint8Array(len); let at = 0; for (const p of parts) { all.set(p, at); at += p.length; all[at++] = 10; }
  return all;
}
function concat(chunks) {
  let len = 0; for (const c of chunks) len += c.length;
  const all = new Uint8Array(len); let at = 0; for (const c of chunks) { all.set(c, at); at += c.length; }
  return all;
}

const SHOW = new Set(['Tj', 'TJ', "'", '"']);
const TS0 = { font: null, fs: 0, tc: 0, tw: 0, th: 1, tl: 0, rise: 0, tr: 0 };

// Parcours commun : ctx.scan → relève les formes et les textes ; sinon applique ctx.edits et renvoie le nouveau contenu.
// Un texte déplacé est écrit dans son propre objet texte, sous une transformation, à la même place dans le dessin ;
// la suite du texte d'origine reprend exactement où elle en était (matrice de ligne et avance rétablies).
function run(doc, bytes, res, ctm0, gs0, ctx, depth = 0) {
  const ops = AtelierRedact.tokenize(bytes), out = [];
  let gs = { ctm: ctm0, fill: gs0.fill, ts: gs0.ts }, changed = false, newRes = null, uid = 0;
  const stack = [];
  let pathOps = [], segs = [], clip = false, cur = null, start = null;
  let tm = ID, tlm = ID, k = 0, lost = false;   // matrices de texte ; k : avance depuis le début de ligne ; lost : position inconnue
  const setTs = ch => { gs = { ...gs, ts: { ...gs.ts, ...ch } }; };
  const raw = o => { if (!ctx.scan) out.push(bytes.subarray(o.s, o.e), NL); };
  const resD = () => newRes || res;
  const addX = ref => {   // nouveau formulaire modifié, sous un nom libre des ressources (copiées)
    if (!newRes) newRes = res instanceof PDFDict ? res.clone(doc.context) : doc.context.obj({});
    const curX = look(newRes, 'XObject'), x = curX instanceof PDFDict ? curX.clone(doc.context) : doc.context.obj({});
    newRes.set(N('XObject'), x);
    let k; do k = `AVf${++uid}`; while (x.get(N(k))); x.set(N(k), ref); return k;
  };
  for (const o of ops) {
    const a = o.args, n = a.map(x => x?.v);
    if (PATH.has(o.op)) {
      const P = (x, y) => ap(gs.ctm, x, y);
      if (o.op === 'm') { cur = start = P(n[0], n[1]); segs.push(['M', cur]); }
      else if (o.op === 'l') { cur = P(n[0], n[1]); segs.push(['L', cur]); }
      else if (o.op === 'c') { const p3 = P(n[4], n[5]); segs.push(['C', P(n[0], n[1]), P(n[2], n[3]), p3]); cur = p3; }
      else if (o.op === 'v') { const p3 = P(n[2], n[3]); segs.push(['C', cur || p3, P(n[0], n[1]), p3]); cur = p3; }
      else if (o.op === 'y') { const p3 = P(n[2], n[3]); segs.push(['C', P(n[0], n[1]), p3, p3]); cur = p3; }
      else if (o.op === 'h') { segs.push(['Z']); cur = start; }
      else if (o.op === 're') {
        const [x, y, w, h] = n;
        segs.push(['M', P(x, y)], ['L', P(x + w, y)], ['L', P(x + w, y + h)], ['L', P(x, y + h)], ['Z']);
        cur = start = P(x, y);
      }
      if (n.some(v => typeof v !== 'number')) segs = [['bad']];
      pathOps.push(o); continue;
    }
    if (o.op === 'W' || o.op === 'W*') { clip = true; pathOps.push(o); continue; }
    if (PAINT.has(o.op)) {
      const shape = FILL.has(o.op) && !clip && segs.length && segs[0][0] !== 'bad';
      if (shape) {
        const ord = ctx.ord++;
        if (ctx.scan) ctx.shapes.push({ ord, segs, evenodd: o.op.endsWith('*'), fill: hexOf(gs.fill), stroked: /^[Bb]/.test(o.op) });
        else {
          const ed = ctx.edits[ord];
          // Forme placée sous une transformation et/ou dans une autre couleur, à la même place dans le dessin
          const wrapped = e => {
            let pre = 'q\n';
            if (e.m) { const X = mul(mul(gs.ctm, e.m), inv(gs.ctm) || ID); pre += X.map(fmt).join(' ') + ' cm\n'; }
            if (e.fill && /^#[0-9a-f]{6}$/i.test(e.fill)) pre += rgbOf(e.fill).map(fmt).join(' ') + ' rg\n';
            out.push(enc(pre)); pathOps.forEach(raw); raw(o); out.push(enc('Q\n'));
          };
          if (!ed) { pathOps.forEach(raw); raw(o); }
          else {
            if (ed.del) changed = true;
            else if (ed.m || ed.fill) { changed = true; wrapped(ed); }
            else { pathOps.forEach(raw); raw(o); }
            for (const c of ed.copies || []) { changed = true; wrapped(c); }   // copies (Alt + glisser), juste après l'original
          }
        }
      } else { pathOps.forEach(raw); raw(o); }
      pathOps = []; segs = []; clip = false; continue;
    }
    if (pathOps.length) { pathOps.forEach(raw); pathOps = []; segs = []; clip = false; }
    if (SHOW.has(o.op)) {
      let pre = '';
      if (o.op === '"') { setTs({ tw: n[0], tc: n[1] }); pre = `${fmt(n[0])} Tw ${fmt(n[1])} Tc `; }
      if (o.op === "'" || o.op === '"') { tlm = tm = mul([1, 0, 0, 1, 0, -gs.ts.tl], tlm); k = 0; lost = false; pre += 'T* '; }
      const ts = gs.ts, items = o.op === 'TJ' ? (a[0]?.v || []) : [a[a.length - 1]];
      let fi = null;
      try { const fd = look(resD(), 'Font'), f = fd instanceof PDFDict ? fd.lookup(N(ts.font)) : null; fi = AtelierRedact.fontInfo(doc, f); } catch {}
      const tm0 = tm, k0 = k, pts = [];
      let total = 0, ink = false;
      if (fi) for (const it of items) {
        if (it?.t === 'num') { const d = -it.v / 1000 * ts.fs * ts.th; tm = mul([1, 0, 0, 1, d, 0], tm); total += d; continue; }
        if (it?.t !== 'str') continue;
        for (const g of fi.split(it.v)) {
          const trm = mul([ts.fs * ts.th, 0, 0, ts.fs, 0, ts.rise], mul(tm, gs.ctm)), w = Math.max(g.w0, 0.05);
          if (!g.space) { ink = true; pts.push(ap(trm, 0, fi.desc), ap(trm, w, fi.desc), ap(trm, w, fi.asc), ap(trm, 0, fi.asc)); }
          const adv = (g.w0 * ts.fs + ts.tc + (g.space ? ts.tw : 0)) * ts.th;
          tm = mul([1, 0, 0, 1, adv, 0], tm); total += adv;
        }
      } else lost = true;
      k += total;
      // Déplaçable si la position est sûre et que le texte ne sert pas de masque (modes de rendu 4 à 7)
      const ok = !!fi && !lost && !!ts.fs && !!ts.th && ts.tr < 4 && !!inv(gs.ctm);
      const ord = ctx.ord++;
      if (ctx.scan) { if (ok && ink) ctx.shapes.push({ ord, kind: 'text', pts }); }
      else {
        const ed = ctx.edits[ord], adv = t => `[${fmt(-t * 1000 / (ts.fs * ts.th))}] TJ`;
        // Texte écrit à part sous la transformation m ; ensuite la ligne d'origine reprend là où elle en était
        const placed = (m, head = '') => {
          const X = mul(mul(gs.ctm, m), inv(gs.ctm));
          out.push(enc(`${head}ET q ${X.map(fmt).join(' ')} cm BT ${tm0.map(fmt).join(' ')} Tm\n`));
          if (o.op === 'Tj' || o.op === 'TJ') raw(o); else out.push(enc(AtelierRedact.ser(a[a.length - 1]) + ' Tj'), NL);
          out.push(enc(`ET Q BT ${tlm.map(fmt).join(' ')} Tm ${adv(k0 + total)}`), NL);
        };
        if (!ed || !ok) raw(o);
        else {
          if (ed.del) { changed = true; out.push(enc(pre + adv(total)), NL); }
          else if (ed.m) { changed = true; placed(ed.m, pre); }
          else raw(o);
          for (const c of ed.copies || []) if (c.m) { changed = true; placed(c.m); }   // copies (Alt + glisser)
        }
      }
      continue;
    }
    switch (o.op) {
      case 'BT': tm = tlm = ID; k = 0; lost = false; break;
      case 'Tf': setTs({ font: a[0]?.v, fs: n[1] }); break;
      case 'Tc': setTs({ tc: n[0] }); break;
      case 'Tw': setTs({ tw: n[0] }); break;
      case 'Tz': setTs({ th: n[0] / 100 }); break;
      case 'TL': setTs({ tl: n[0] }); break;
      case 'Ts': setTs({ rise: n[0] }); break;
      case 'Tr': setTs({ tr: n[0] }); break;
      case 'Td': tlm = tm = mul([1, 0, 0, 1, n[0], n[1]], tlm); k = 0; lost = false; break;
      case 'TD': setTs({ tl: -n[1] }); tlm = tm = mul([1, 0, 0, 1, n[0], n[1]], tlm); k = 0; lost = false; break;
      case 'Tm': if (n.length === 6 && n.every(v => typeof v === 'number')) { tlm = tm = n; k = 0; lost = false; } break;
      case 'T*': tlm = tm = mul([1, 0, 0, 1, 0, -gs.ts.tl], tlm); k = 0; lost = false; break;
    }
    switch (o.op) {
      case 'q': stack.push(gs); break;
      case 'Q': if (stack.length) gs = stack.pop(); break;
      case 'cm': if (n.length === 6 && n.every(v => typeof v === 'number')) gs = { ...gs, ctm: mul(n, gs.ctm) }; break;
      case 'g': gs = { ...gs, fill: { cs: 'G', v: [n[0]] } }; break;
      case 'rg': gs = { ...gs, fill: { cs: 'RGB', v: n.slice(0, 3) } }; break;
      case 'k': gs = { ...gs, fill: { cs: 'CMYK', v: n.slice(0, 4) } }; break;
      case 'cs': { const k = a[0]?.t === 'name' ? csKind(resD(), a[0].v) : null; gs = { ...gs, fill: { cs: k, v: k ? DEFAULT[k] : null } }; break; }
      case 'sc': case 'scn': gs = { ...gs, fill: { cs: gs.fill.cs, v: n.every(v => typeof v === 'number') ? n : null } }; break;
    }
    if (o.op === 'Do' && a[0]?.t === 'name' && depth < 6) {
      const xd = look(resD(), 'XObject'), x = xd instanceof PDFDict ? xd.lookup(N(a[0].v)) : null;
      if (x instanceof PDFStream && x.dict.lookup(N('Subtype'))?.asString() === '/Form') {
        const mt = x.dict.lookup(N('Matrix')), m = mt instanceof PDFArray ? mt.asArray().map(v => v.asNumber?.() ?? 0) : ID;
        const fres = x.dict.lookup(N('Resources')) || resD();
        let r;
        try { r = run(doc, streamBytes(x), fres, mul(m.length === 6 ? m : ID, gs.ctm), { fill: gs.fill, ts: gs.ts }, ctx, depth + 1); }
        catch (e) { console.warn('Formulaire ignoré', e); raw(o); continue; }
        if (!ctx.scan && r.changed) {
          const ns = doc.context.flateStream(r.bytes, {});
          for (const [k, v] of x.dict.entries()) if (!['Filter', 'DecodeParms', 'Length', 'Resources'].includes(k.decodeText())) ns.dict.set(k, v);
          ns.dict.set(N('Resources'), r.res);
          out.push(enc(`/${addX(doc.context.register(ns))} Do`), NL);
          changed = true;
        } else raw(o);
        continue;
      }
    }
    raw(o);
  }
  if (pathOps.length) pathOps.forEach(raw);
  return ctx.scan ? null : { bytes: concat(out), res: newRes || res, changed };
}

/* ---------- Géométrie pour l'interface ---------- */
// Contours aplatis (courbes en segments) pour savoir si un point est dans la forme
function polysOf(segs) {
  const polys = []; let poly = null;
  for (const s of segs) {
    if (s[0] === 'M') { poly = [s[1]]; polys.push(poly); }
    else if (s[0] === 'L') poly?.push(s[1]);
    else if (s[0] === 'C' && poly) {
      const p0 = poly[poly.length - 1], [, p1, p2, p3] = s;
      for (let k = 1; k <= 8; k++) {
        const t = k / 8, u = 1 - t;
        poly.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
                   u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
      }
    }
  }
  return polys.filter(p => p.length > 2);
}
function inside(polys, [x, y], evenodd) {
  let wind = 0, cross = 0;
  for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) { cross++; wind += yj > yi ? 1 : -1; }
  }
  return evenodd ? cross % 2 === 1 : wind !== 0;
}

function scan(doc, page) {
  const ctx = { scan: true, ord: 0, shapes: [] };
  run(doc, pageContent(doc, page.node), page.node.Resources() || doc.context.obj({}), ID, { fill: { cs: 'G', v: [0] }, ts: TS0 }, ctx);
  return ctx.shapes.map(s => {
    if (s.kind === 'text') {   // texte : sa boîte suffit pour le désigner
      const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
      const box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
      return { ord: s.ord, kind: 'text', box, polys: [[[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]]], evenodd: false };
    }
    const polys = polysOf(s.segs), pts = polys.flat();
    if (!pts.length) return null;
    const box = { x0: Math.min(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), x1: Math.max(...pts.map(p => p[0])), y1: Math.max(...pts.map(p => p[1])) };
    return { ...s, polys, box };
  }).filter(s => s && s.box.x1 - s.box.x0 > 0.5 && s.box.y1 - s.box.y0 > 0.5);
}

// Réécrit le contenu de la page avec les modifications ; ne touche à rien s'il n'y a rien à changer
function apply(doc, page, edits) {
  if (!edits || !Object.keys(edits).length) return false;
  const node = page.node, res = node.Resources() || doc.context.obj({});
  const r = run(doc, pageContent(doc, node), res, ID, { fill: { cs: 'G', v: [0] }, ts: TS0 }, { scan: false, ord: 0, edits });
  if (!r.changed) return false;
  node.set(N('Contents'), doc.context.obj([doc.context.register(doc.context.flateStream(r.bytes))]));
  if (r.res !== res) node.set(N('Resources'), r.res);
  return true;
}

// Chemin SVG (espace de la page) d'une forme passée par la transformation m
function svgPath(segs, m = ID) {
  return segs.map(s => s[0] === 'Z' ? 'Z' : s[0] + s.slice(1).map(p => ap(m, p[0], p[1]).map(v => +v.toFixed(2)).join(' ')).join(' ')).join('');
}

return { scan, apply, inside, svgPath, mul, inv, ap };
})();
