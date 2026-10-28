// Test des fonctions d'édition, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-features.js electron .
// Chaque vérification renvoie true/false (ou un détail) ; le PDF produit est relu avec pdf.js.
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  const read = async bytes => {
    const pdf = await A.openPdfjs(bytes), pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n);
      pages.push({ text: (await pg.getTextContent()).items.map(i => i.str).join(' ').replace(/\s+/g, ' '), annots: await pg.getAnnotations(), view: pg.view });
    }
    const outline = await pdf.getOutline(), info = (await pdf.getMetadata()).info;
    pdf.loadingTask.destroy();
    return { pages, outline, info };
  };

  // Document de test : 3 pages avec des signets
  const src = await L.PDFDocument.create(), font = await src.embedFont(L.StandardFonts.Helvetica);
  for (const t of ['Chapitre un : introduction', 'Chapitre deux : le budget secret', 'Chapitre trois : conclusion'])
    src.addPage([595, 842]).drawText(t, { x: 60, y: 760, size: 18, font });
  const ctx = src.context, pages = src.getPages(), root = ctx.nextRef(), refs = pages.map(() => ctx.nextRef());
  pages.forEach((p, i) => ctx.assign(refs[i], ctx.obj({ Title: L.PDFHexString.fromText(`Signet ${i + 1}`), Parent: root, Dest: [p.ref, 'XYZ', null, null, null],
    ...(i ? { Prev: refs[i - 1] } : {}), ...(i < 2 ? { Next: refs[i + 1] } : {}) })));
  ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[2], Count: 3 }));
  src.catalog.set(L.PDFName.of('Outlines'), root);
  await A.addFiles([new File([await src.save()], 'chapitres.pdf', { type: 'application/pdf' })], true);
  R.outlineRead = S.sources[0].outline.map(o => `${o.title}->${o.idx}`).join(', ');

  // Ajouts sur la page 1
  const p1 = S.pages[0], id = () => Math.random().toString(36).slice(2);
  p1.annots.push(
    { id: id(), type: 'note', x: 300, y: 700, text: 'Relire ce paragraphe', author: 'Testeur', date: new Date().toISOString(), color: '#ffd84d' },
    { id: id(), type: 'shape', kind: 'rect', x: 50, y: 600, w: 120, h: 60, r: 0, stroke: '#d0312d', fill: '', width: 2 },
    { id: id(), type: 'shape', kind: 'ellipse', x: 200, y: 600, w: 120, h: 60, r: 0, stroke: '#1a3fb8', fill: '#ffe08a', width: 2 },
    { id: id(), type: 'line', x1: 60, y1: 550, x2: 300, y2: 500, arrow: true, stroke: '#111111', width: 2 },
    { id: id(), type: 'rect', kind: 'underline', x: 60, y: 755, w: 200, h: 20, r: 0, color: '#1f8a4c' },
    { id: id(), type: 'field', kind: 'text', name: 'Nom du client', x: 60, y: 400, w: 200, h: 22, r: 0, multiline: false },
    { id: id(), type: 'field', kind: 'check', name: 'Accord', x: 60, y: 360, w: 14, h: 14, r: 0 },
  );
  p1.annots.push(
    { id: id(), type: 'link', x: 60, y: 250, w: 100, h: 16, r: 0, target: { kind: 'url', url: 'https://exemple.fr/tarifs' } },
    { id: id(), type: 'link', x: 60, y: 220, w: 100, h: 16, r: 0, target: { kind: 'page', page: S.pages[2].id } },
  );
  const st = A.makeStamp({ text: 'APPROUVÉ', color: '#1f8a4c', date: true });
  p1.annots.push({ id: id(), type: 'image', x: 350, y: 400, w: st.w, h: st.h, r: 0, src: st.src });
  p1.ocr = [{ str: 'MotReconnuOCR', x: 60, y: 300, r: 0, w: 120, fs: 12 }];
  S.pages[1].crop = { x0: 40, y0: 400, x1: 555, y1: 820 };
  S.decor = { hf: { fc: 'Page {n} sur {N}', hr: '{fichier}', size: 9, color: '#333333', margin: 10, from: 1, to: 0, start: 1 }, wm: { text: 'BROUILLON', size: 60, color: '#c62828', opacity: 0.2, angle: 45 } };
  S.meta.title = 'Titre de test'; S.meta.author = 'Atelier'; S.metaEdited = true;
  S.pages.reverse();   // ordre inversé : signets à reconstruire sur les nouvelles positions

  let { bytes } = await A.producePdf(S.pages);
  let out = await read(bytes);
  const last = out.pages[2];   // l'ancienne page 1
  R.note = last.annots.some(a => a.subtype === 'Text' && a.contentsObj?.str === 'Relire ce paragraphe');
  R.fields = ['Nom du client', 'Accord'].every(n => last.annots.some(a => a.subtype === 'Widget' && a.fieldName === n));
  R.safeUrl = ['exemple.fr/a b', 'javascript:alert(1)', 'file:///C:/Windows', 'mailto:nom@exemple.fr', 'https://café.fr', 'data:text/html,x']
    .map(u => `${u} -> ${A.safeUrl(u)}`).join(' | ');
  const links = last.annots.filter(a => a.subtype === 'Link');
  R.links = links.map(l => l.url || `dest:${JSON.stringify(l.dest?.[0])}`).join(' | ');
  R.header = out.pages.map(p => (p.text.match(/Page \d sur \d/) || [''])[0]).join(' | ');
  R.watermark = out.pages.every(p => p.text.includes('BROUILLON'));
  R.ocrText = last.text.includes('MotReconnuOCR');
  R.crop = out.pages[1].view.join(',');
  R.outline = out.outline?.map(o => o.title).join(', ');
  R.title = out.info.Title;
  R.size = bytes.length;

  // Recherche puis caviardage de toutes les occurrences
  document.querySelector('#findInput').value = 'secret';
  await A.runFind();
  R.findHits = S.find.n;
  A.markAllHits('redact');
  ({ bytes } = await A.producePdf(S.pages));
  out = await read(bytes);
  R.secretGone = !out.pages.some(p => /secret/i.test(p.text));
  R.budgetKept = out.pages.some(p => p.text.includes('budget'));

  // Protection par mot de passe
  S.protect = { user: 'motdepasse', owner: '', perms: { print: true, copy: false, modify: true, annotate: true } };
  ({ bytes } = await A.producePdf(S.pages));
  try { await A.openPdfjs(bytes); R.locked = false; } catch (e) { R.locked = e.name === 'PasswordException'; }
  try { const pdf = await A.openPdfjs(bytes, 'motdepasse'); R.unlock = pdf.numPages === 3; pdf.loadingTask.destroy(); } catch { R.unlock = false; }
  S.protect = null;

  // Analyse et nettoyage : JavaScript à l'ouverture, pièce jointe, métadonnées
  const bad = await L.PDFDocument.create(); bad.addPage([300, 300]).drawText('piege', { x: 20, y: 150, size: 20, font: await bad.embedFont(L.StandardFonts.Helvetica) });
  bad.setAuthor('Auteur secret'); await bad.attach(new TextEncoder().encode('echo pwned'), 'facture.bat', { mimeType: 'text/plain' });
  bad.catalog.set(L.PDFName.of('OpenAction'), bad.context.obj({ S: 'JavaScript', JS: L.PDFHexString.fromText('app.alert("bonjour")') }));
  const badBytes = await bad.save();
  const f0 = AtelierSanitize.analyze(await L.PDFDocument.load(badBytes), badBytes);
  R.analyzeBefore = `risque ${f0.risk}, js ${f0.js.length}, fichiers ${f0.files.map(x => x.name)}, auteur ${f0.info.some(([k]) => k === 'Author')}`;
  await A.addFiles([new File([badBytes], 'piege.pdf', { type: 'application/pdf' })], false);
  S.clean = { metadata: true, javascript: true, files: true, private: true };
  ({ bytes } = await A.producePdf(S.pages));
  const f1 = AtelierSanitize.analyze(await L.PDFDocument.load(bytes, { updateMetadata: false }), bytes);
  R.analyzeAfter = `risque ${f1.risk}, js ${f1.js.length}, fichiers ${f1.files.length}, métadonnées ${f1.info.map(([k]) => k)}`;
  S.clean = null;

  // Compression d'une grosse image
  const big = await L.PDFDocument.create(), c = document.createElement('canvas'); c.width = 2400; c.height = 2400;
  const g = c.getContext('2d'); for (let k = 0; k < 4000; k++) { g.fillStyle = `hsl(${k % 360} 70% 50%)`; g.fillRect(Math.random() * 2400, Math.random() * 2400, 60, 60); }
  big.addPage([595, 842]).drawImage(await big.embedJpg(c.toDataURL('image/jpeg', 0.95)), { x: 0, y: 200, width: 595, height: 595 });
  const bigBytes = await big.save(), small = await AtelierCompress.compress(bigBytes, 'moyenne');
  R.compress = `${Math.round(bigBytes.length / 1024)} Ko -> ${Math.round(small.bytes.length / 1024)} Ko, images ${small.images}`;

  // OCR réel sur une image de texte
  const oc = document.createElement('canvas'); oc.width = 1400; oc.height = 300;
  const og = oc.getContext('2d'); og.fillStyle = '#fff'; og.fillRect(0, 0, 1400, 300); og.fillStyle = '#000'; og.font = '64px Arial'; og.fillText('Facture numéro 4521 du mardi', 40, 170);
  const t0 = performance.now();
  try { const w = await AtelierOCR.recognize(oc, 'fra'); R.ocr = w.map(x => x.text).join(' '); } catch (e) { R.ocr = 'ERREUR ' + e.message; }
  R.ocrMs = Math.round(performance.now() - t0);
  await AtelierOCR.terminate();

  S.dirty = false;
  return R;
})()
