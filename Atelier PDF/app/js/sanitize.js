// Analyse d'un PDF (ce qu'il contient de caché ou d'actif) et nettoyage avant diffusion.
window.AtelierSanitize = (() => {
'use strict';
const L = PDFLib;
const { PDFName, PDFDict, PDFArray, PDFStream, PDFString, PDFHexString, PDFRef } = L;
const N = n => PDFName.of(n);
const text = o => o instanceof PDFString || o instanceof PDFHexString ? o.decodeText() : o instanceof PDFName ? o.decodeText() : '';
const RISKY = /\.(exe|com|scr|pif|bat|cmd|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|hta|msi|msp|jar|dll|cpl|lnk|reg|scf|iso|img|vhd|docm|dotm|xlsm|xltm|pptm|one|zip|rar|7z|cab)$/i;
const ACTIVE = new Set(['JavaScript', 'Launch', 'SubmitForm', 'ImportData', 'GoToR', 'GoToE', 'Rendition', 'Movie', 'Sound', 'RichMediaExecute']);

// Visite chaque dictionnaire du document une seule fois (objets indirects et dictionnaires imbriqués)
function eachDict(doc, fn) {
  const seen = new Set();
  const walk = (o, owner) => {
    if (o instanceof PDFStream) o = o.dict;
    if (o instanceof PDFDict) {
      if (seen.has(o)) return; seen.add(o);
      fn(o, owner);
      for (const [, v] of o.entries()) if (!(v instanceof PDFRef)) walk(v, o);
    } else if (o instanceof PDFArray) for (let i = 0; i < o.size(); i++) { const v = o.get(i); if (!(v instanceof PDFRef)) walk(v, owner); }
  };
  for (const [, o] of doc.context.enumerateIndirectObjects()) walk(o, null);
}
const jsOf = (doc, d) => {
  const js = d.lookup(N('JS'));
  if (js instanceof PDFStream) { try { return new TextDecoder('latin1').decode(L.decodePDFRawStream(js).decode()); } catch { return '(script compressé)'; } }
  return text(js);
};

function analyze(doc, bytes) {
  const f = { js: [], launch: [], submit: [], uri: new Set(), remote: [], files: [], media: 0, openAction: null, annots: {}, fields: 0,
    xfa: false, sigs: 0, info: [], xmp: false, outlines: 0, thumbs: 0, piece: 0, layers: 0, hidden: 0, revisions: 0 };
  const cat = doc.catalog;
  eachDict(doc, d => {
    const s = d.lookup(N('S'));
    if (s instanceof PDFName) {
      const k = s.decodeText();
      if (k === 'JavaScript') f.js.push(jsOf(doc, d).trim().slice(0, 300));
      else if (k === 'Launch') f.launch.push(text(d.lookup(N('F'))?.lookup?.(N('F')) || d.lookup(N('F'))) || text(d.lookup(N('Win'))?.lookup?.(N('F'))) || 'programme externe');
      else if (k === 'SubmitForm' || k === 'ImportData') f.submit.push(text(d.lookup(N('F'))?.lookup?.(N('F')) || d.lookup(N('F'))) || 'adresse inconnue');
      else if (k === 'URI') { const u = text(d.lookup(N('URI'))); try { f.uri.add(new URL(u).host || u); } catch { if (u) f.uri.add(u.slice(0, 60)); } }
      else if (k === 'GoToR' || k === 'GoToE') f.remote.push(text(d.lookup(N('F'))?.lookup?.(N('F')) || d.lookup(N('F'))) || 'autre fichier');
      else if (ACTIVE.has(k)) f.media++;
    }
    const type = d.lookup(N('Type'))?.decodeText?.();
    if ((type === 'Filespec' || d.has(N('EF'))) && d.lookup(N('EF')) instanceof PDFDict) {
      const name = text(d.lookup(N('UF'))) || text(d.lookup(N('F'))) || 'sans nom', ef = d.lookup(N('EF')).lookup(N('F'));
      const size = ef instanceof PDFStream ? (ef.dict.lookup(N('Params'))?.lookup?.(N('Size'))?.asNumber?.() ?? ef.contents?.length ?? 0) : 0;
      if (!f.files.some(x => x.name === name)) f.files.push({ name, size, risky: RISKY.test(name) });
    }
    if (d.lookup(N('FT'))?.decodeText?.() === 'Sig' && d.has(N('V'))) f.sigs++;
    if (d.has(N('PieceInfo'))) f.piece++;
  });
  doc.getPages().forEach(p => {
    if (p.node.has(N('Thumb'))) f.thumbs++;
    const a = p.node.lookup(N('Annots'));
    if (a instanceof PDFArray) for (const r of a.asArray()) { const st = doc.context.lookup(r)?.lookup?.(N('Subtype'))?.decodeText?.(); if (st) f.annots[st] = (f.annots[st] || 0) + 1; }
  });
  const oa = cat.lookup(N('OpenAction'));
  if (oa instanceof PDFDict) f.openAction = oa.lookup(N('S'))?.decodeText?.() || 'action';
  const form = cat.lookup(N('AcroForm'));
  if (form instanceof PDFDict) { const fl = form.lookup(N('Fields')); f.fields = fl instanceof PDFArray ? fl.size() : 0; f.xfa = form.has(N('XFA')); }
  const info = doc.context.lookup(doc.context.trailerInfo.Info);
  if (info instanceof PDFDict) for (const [k, v] of info.entries()) { const t = text(v); if (t) f.info.push([k.decodeText(), t]); }
  f.xmp = cat.has(N('Metadata'));
  const ol = cat.lookup(N('Outlines')); f.outlines = ol instanceof PDFDict ? Math.abs(ol.lookup(N('Count'))?.asNumber?.() || 0) || (ol.has(N('First')) ? 1 : 0) : 0;
  const oc = cat.lookup(N('OCProperties'));
  if (oc instanceof PDFDict) {
    const ocgs = oc.lookup(N('OCGs')), off = oc.lookup(N('D'))?.lookup?.(N('OFF'));
    f.layers = ocgs instanceof PDFArray ? ocgs.size() : 0; f.hidden = off instanceof PDFArray ? off.size() : 0;
  }
  if (bytes) { const s = new TextDecoder('latin1').decode(bytes); f.revisions = Math.max(0, (s.match(/%%EOF/g) || []).length - 1); }
  const dangerous = f.js.length || f.launch.length || f.files.some(x => x.risky);
  f.risk = dangerous ? 'élevé' : (f.openAction && f.openAction !== 'GoTo') || f.submit.length || f.remote.length || f.files.length || f.media ? 'moyen' : 'faible';
  return f;
}

// opts : { metadata, javascript, files, comments, links, forms, outlines, private }
function clean(doc, opts) {
  const ctx = doc.context, cat = doc.catalog;
  if (opts.forms) { try { doc.getForm().flatten(); } catch (e) { console.warn('Aplatissement des champs impossible', e); } }
  if (opts.metadata) {
    ctx.trailerInfo.Info = ctx.register(ctx.obj({ Producer: PDFHexString.fromText('Atelier PDF') }));
    cat.delete(N('Metadata'));
    eachDict(doc, d => { if (d !== cat && d.lookup(N('Type'))?.decodeText?.() !== 'Metadata') d.delete(N('Metadata')); });
  }
  if (opts.javascript) {
    cat.delete(N('OpenAction')); cat.delete(N('AA'));
    const names = cat.lookup(N('Names')); if (names instanceof PDFDict) names.delete(N('JavaScript'));
    const form = cat.lookup(N('AcroForm')); if (form instanceof PDFDict) form.delete(N('XFA'));
    eachDict(doc, d => {
      d.delete(N('AA'));
      for (const k of ['A', 'Next']) {
        const a = d.lookup(N(k));
        if (a instanceof PDFDict && ACTIVE.has(a.lookup(N('S'))?.decodeText?.())) d.delete(N(k));
      }
    });
  }
  if (opts.files) {
    const names = cat.lookup(N('Names')); if (names instanceof PDFDict) names.delete(N('EmbeddedFiles'));
    cat.delete(N('AF'));
    eachDict(doc, d => { d.delete(N('AF')); if (d.has(N('EF'))) d.delete(N('EF')); });
  }
  const dropAnnots = pred => doc.getPages().forEach(p => {
    const a = p.node.lookup(N('Annots')); if (!(a instanceof PDFArray)) return;
    const keep = a.asArray().filter(r => !pred(ctx.lookup(r)?.lookup?.(N('Subtype'))?.decodeText?.() || ''));
    p.node.set(N('Annots'), ctx.obj(keep));
  });
  if (opts.comments) dropAnnots(st => !['Link', 'Widget'].includes(st));
  else if (opts.files) dropAnnots(st => st === 'FileAttachment');
  if (opts.links) dropAnnots(st => st === 'Link');
  if (opts.outlines) { cat.delete(N('Outlines')); if (cat.lookup(N('PageMode'))?.decodeText?.() === 'UseOutlines') cat.delete(N('PageMode')); }
  if (opts.private) {
    eachDict(doc, d => { d.delete(N('PieceInfo')); d.delete(N('LastModified')); });
    doc.getPages().forEach(p => p.node.delete(N('Thumb')));
    cat.delete(N('SpiderInfo'));
  }
}

return { analyze, clean };
})();
