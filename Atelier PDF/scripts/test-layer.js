// Test du calque modifiable et des polices intégrées, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-layer.js electron .
// Enregistre des ajouts, rouvre le fichier, vérifie qu'ils redeviennent des objets modifiables sans doublon.
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const textOf = async bytes => {
    const pdf = await A.openPdfjs(bytes), out = [];
    for (let n = 1; n <= pdf.numPages; n++) out.push((await (await pdf.getPage(n)).getTextContent()).items.map(i => i.str).join(' '));
    pdf.loadingTask.destroy(); return out;
  };
  const count = (s, w) => s.split(w).length - 1;
  const layerJson = async bytes => {
    const doc = await L.PDFDocument.load(bytes), out = [];
    for (const [, o] of doc.context.enumerateIndirectObjects())
      if (o instanceof L.PDFRawStream && o.dict.lookup(L.PDFName.of('Type'))?.decodeText?.() === 'AtelierLayer') out.push(new TextDecoder().decode(L.decodePDFRawStream(o).decode()));
    return out.join('\n');
  };

  // Document d'origine : un texte à caviarder
  const src = await L.PDFDocument.create(), helv = await src.embedFont(L.StandardFonts.Helvetica);
  src.addPage([595, 842]).drawText('Texte original avec CONFIDENTIEL dedans', { x: 60, y: 780, size: 14, font: helv });
  src.addPage([595, 842]);
  await A.addFiles([new File([await src.save()], 'calque.pdf', { type: 'application/pdf' })], true);

  const id = () => Math.random().toString(36).slice(2), p1 = S.pages[0];
  p1.annots.push(
    { id: id(), type: 'text', x: 60, y: 700, r: 0, text: 'Le traiteur', size: 40, font: 'InstrumentSerif', bold: false, italic: false, color: '#141a19', link: { kind: 'page', page: S.pages[1].id } },
    { id: id(), type: 'text', x: 60, y: 650, r: 0, text: 'de la Baie', size: 40, font: 'InstrumentSerif', italic: true, color: '#2b5853' },
    { id: id(), type: 'text', x: 60, y: 600, r: 0, text: 'Pièces froides\nHuîtres n°3 de nos côtes', size: 11, font: 'ManropeLight', bold: true, lh: 1.6, color: '#141a19' },
    { id: id(), type: 'text', x: 60, y: 540, r: 0, text: 'CARTE 2027', size: 8, font: 'FiraCode', ls: 0.14, color: '#2b5853', link: { kind: 'url', url: 'https://la-baie.eu/la-baie-traiteur/' } },
    { id: id(), type: 'shape', kind: 'rect', x: 50, y: 400, w: 120, h: 60, r: 0, stroke: '', fill: '#ffe08a', width: 0, rx: 8 },
    { id: id(), type: 'line', x1: 60, y1: 380, x2: 300, y2: 350, arrow: true, stroke: '#111111', width: 2 },
    { id: id(), type: 'ink', strokes: [[[60, 300], [80, 320], [100, 300]]], color: '#1a3fb8', width: 2 },
    { id: id(), type: 'rect', kind: 'highlight', x: 55, y: 695, w: 150, h: 40, r: 0, color: '#ffd84d' },
    { id: id(), type: 'note', x: 400, y: 700, text: 'Note native', author: 'Test', date: new Date().toISOString(), color: '#ffd84d' },
    // Texte de l'utilisateur recouvert ensuite par une zone noire : ne doit apparaître nulle part, calque compris
    { id: id(), type: 'text', x: 300, y: 500, r: 0, text: 'SECRETCACHE', size: 12, font: 'Helvetica', color: '#000000' },
    { id: id(), type: 'rect', kind: 'redact', x: 290, y: 490, w: 120, h: 30, r: 0, color: '#000000' },
    { id: id(), type: 'rect', kind: 'redact', x: 150, y: 772, w: 110, h: 22, r: 0, color: '#000000' },
  );
  const stamp = A.makeStamp({ text: 'APPROUVÉ', color: '#1f8a4c', date: false });
  S.pages[1].annots.push({ id: id(), type: 'image', x: 100, y: 500, w: stamp.w, h: stamp.h, r: 0, src: stamp.src });
  // Photo JPEG (dégradé de couleurs) : réutilisée telle quelle à la réouverture
  const jc = document.createElement('canvas'); jc.width = 1600; jc.height = 1000;
  const jg = jc.getContext('2d'), grad = jg.createLinearGradient(0, 0, 1600, 1000); grad.addColorStop(0, '#2b5853'); grad.addColorStop(1, '#e48a55');
  jg.fillStyle = grad; jg.fillRect(0, 0, 1600, 1000); for (let k = 0; k < 3000; k++) { jg.fillStyle = `hsl(${k % 360} 60% 60%)`; jg.fillRect(Math.random() * 1600, Math.random() * 1000, 12, 12); }
  const photo = { id: id(), type: 'image', x: 100, y: 100, w: 300, h: 180, r: 0, src: jc.toDataURL('image/jpeg', 0.95) };
  S.pages[1].annots.push(photo);
  const layerCount = 10;   // 4 textes, forme, ligne, dessin, surlignage (page 1) + 2 images (page 2)

  let { bytes } = await A.producePdf(S.pages);
  let txt = await textOf(bytes);
  // pdf.js insère des espaces dans un texte espacé (CARTE 2027) : on compare sans les espaces
  R.textVisible = ['Le traiteur', 'de la Baie', 'Huîtres n°3 de nos côtes', 'CARTE 2027'].every(t => txt[0].replace(/\s+/g, '').includes(t.replace(/\s+/g, ''))) || txt[0];
  R.secretGone = !txt.join(' ').includes('SECRETCACHE') && !txt.join(' ').includes('CONFIDENTIEL');
  const json = await layerJson(bytes);
  R.secretNotInLayer = !json.includes('SECRETCACHE') && !json.includes('CONFIDENTIEL');
  const fontsUsed = new Set();
  for (const [, o] of (await L.PDFDocument.load(bytes)).context.enumerateIndirectObjects())
    if (o instanceof L.PDFDict && o.lookup(L.PDFName.of('Type'))?.decodeText?.() === 'Font') fontsUsed.add(o.lookup(L.PDFName.of('BaseFont'))?.decodeText?.().replace(/^[A-Z]{6}\+/, ''));
  R.fontsEmbedded = [...fontsUsed].sort().join(', ');
  R.hasLayer = AtelierLayer.hasLayer(bytes);
  R.imagesNotCopied = !json.includes('data:image');
  const linksOf = async b => { const pdf = await A.openPdfjs(b), an = (await (await pdf.getPage(1)).getAnnotations()).filter(x => x.subtype === 'Link'); pdf.loadingTask.destroy(); return an; };
  let links = await linksOf(bytes);
  R.textLinks = links.some(l => l.url === 'https://la-baie.eu/la-baie-traiteur/') && links.some(l => l.dest) || JSON.stringify(links.map(l => l.url || l.dest));

  // Réouverture : les ajouts redeviennent des objets, la page ne les dessine plus
  S.dirty = false; await A.addFiles([new File([bytes], 'calque-modifié.pdf', { type: 'application/pdf' })], true);
  const back = S.pages.flatMap(p => p.annots);
  R.reopenedCount = `${back.length}/${layerCount}`;
  const t1 = back.find(a => a.type === 'text' && a.text === 'de la Baie'), t2 = back.find(a => a.text?.startsWith('Pièces'));
  R.styleKept = !!(t1 && t1.font === 'InstrumentSerif' && t1.italic && t2 && t2.lh === 1.6 && t2.bold && back.some(a => a.ls === 0.14));
  R.imageBack = S.pages[1].annots.some(a => a.type === 'image' && a.src.startsWith('data:image/png'));
  R.jpegBack = S.pages[1].annots.some(a => a.type === 'image' && a.src.startsWith('data:image/jpeg') && a.w === 300);
  const lk = back.filter(a => a.link);
  R.linksBack = lk.some(a => a.link.kind === 'url' && a.link.url === 'https://la-baie.eu/la-baie-traiteur/') && lk.some(a => a.link.kind === 'page' && a.link.page === S.pages[1].id);
  R.roundedNoBorder = back.some(a => a.type === 'shape' && a.rx === 8 && a.stroke === '' && a.width === 0 && a.fill === '#ffe08a');
  const stripped = await textOf(S.sources[0].bytes);
  R.pageWithoutLayer = !stripped[0].includes('traiteur') && !stripped[0].includes('Huîtres');
  R.noteStillNative = !back.some(a => a.type === 'note');

  // Modification, copier-coller, nouvel enregistrement : un seul exemplaire de chaque texte
  t1.text = 'de la Baie, Regnéville';
  A.setSel(S.pages[0].id, t2.id); A.copySel(); A.pasteClip();
  R.pasted = S.pages[0].annots.filter(a => a.text === t2.text).length === 2;
  A.nudgeSel(10, -5);
  ({ bytes } = await A.producePdf(S.pages));
  txt = await textOf(bytes);
  const flat = txt[0].replace(/\s+/g, ' ');
  R.noDuplicate = count(flat, 'Le traiteur') === 1 && count(flat, 'Regnéville') === 1 && count(flat, 'Huîtres') === 2;
  links = await linksOf(bytes);
  R.linksNotDoubled = links.length === 2 || `${links.length} liens`;
  S.dirty = false; await A.addFiles([new File([bytes], 'calque-2.pdf', { type: 'application/pdf' })], true);
  // Remplacer une image : même cadre, nouvelle image recadrée
  const ph = S.pages[1].annots.find(a => a.type === 'image' && a.w === 300), rc = document.createElement('canvas'); rc.width = 400; rc.height = 100;
  rc.getContext('2d').fillStyle = '#d0312d'; rc.getContext('2d').fillRect(0, 0, 400, 100);
  const blob = await new Promise(r => rc.toBlob(r, 'image/png')), before = ph.src;
  await A.replaceImage(ph, new File([blob], 'rouge.png', { type: 'image/png' }));
  const ri = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = ph.src; });
  R.replaceImage = ph.src !== before && ph.w === 300 && ph.h === 180 && Math.abs(ri.naturalWidth / ri.naturalHeight - 300 / 180) < 0.02 || `${ri.naturalWidth}x${ri.naturalHeight}`;

  // Cadrage : image large (moitié gauche verte, moitié droite bleue) déplacée vers la gauche dans son cadre
  const wc = document.createElement('canvas'); wc.width = 1200; wc.height = 300;
  const wg = wc.getContext('2d'); wg.fillStyle = '#00a000'; wg.fillRect(0, 0, 600, 300); wg.fillStyle = '#0000c0'; wg.fillRect(600, 0, 600, 300);
  await A.replaceImage(ph, new File([await new Promise(r => wc.toBlob(r, 'image/png'))], 'large.png', { type: 'image/png' }));
  const colorAt = async src => { const i = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = src; }); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(c.width / 2, c.height / 2, 1, 1).data; return d[1] > d[2] ? 'vert' : 'bleu'; };
  const v2 = A.V.get(S.pages[1].id);
  await A.enterCrop(v2, ph);
  A.setCropFit({ cx: 0.1 });            // vers la partie gauche (verte)
  A.exitCrop(); await new Promise(r => setTimeout(r, 300));
  R.cropMoved = ph.fit.cx < 0.5 && (await colorAt(ph.src)) === 'vert' || `cx=${ph.fit.cx}`;
  await A.enterCrop(v2, ph); A.setCropFit({ zoom: 3, cx: 0.9 }); A.exitCrop(); await new Promise(r => setTimeout(r, 300));
  R.cropZoom = ph.fit.zoom === 3 && (await colorAt(ph.src)) === 'bleu' || JSON.stringify(ph.fit);
  R.secondReopen = S.pages.flatMap(p => p.annots).length === layerCount + 1;

  // Le cadrage survit à l'enregistrement : image complète et réglages relus, rien n'est recopié en texte
  ({ bytes } = await A.producePdf(S.pages));
  R.cropNotCopied = !(await layerJson(bytes)).includes('data:image');
  S.dirty = false; await A.addFiles([new File([bytes], 'cadrage.pdf', { type: 'application/pdf' })], true);
  const ph2 = S.pages[1].annots.find(a => a.type === 'image' && a.w === 300);
  const oi = ph2?.orig && await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = ph2.orig; });
  R.cropSaved = !!(ph2 && ph2.fit?.zoom === 3 && oi.naturalWidth === 1200 && oi.naturalHeight === 300) || JSON.stringify(ph2?.fit);

  // Compression d'un PDF modifiable : la photo réduite reste celle qu'on retrouve à la réouverture
  ({ bytes } = await A.producePdf(S.pages));
  const small = await AtelierCompress.compress(bytes, 'faible', null, { strip: true });
  const lay2 = await AtelierLayer.read(small.bytes), imgs = [...lay2.layers.values()].flat().filter(a => a.type === 'image');
  R.compressLayer = `${Math.round(bytes.length / 1024)} Ko -> ${Math.round(small.bytes.length / 1024)} Ko, images relues ${imgs.length}/2`;
  // Document protégé : le calque survit au chiffrement
  S.protect = { user: 'motdepasse', owner: '', perms: { print: true, copy: true, modify: true, annotate: true } };
  ({ bytes } = await A.producePdf(S.pages));
  S.protect = null;
  const dec = await AtelierCrypt.decrypt(bytes, 'motdepasse'), lay = await AtelierLayer.read(dec.bytes);
  R.encrypted = !!lay && [...lay.layers.values()].flat().length === layerCount + 1;

  // Nettoyage « données privées » : le calque disparaît, le dessin reste
  S.clean = { private: true };
  ({ bytes } = await A.producePdf(S.pages));
  S.clean = null;
  R.cleanRemovesLayer = !AtelierLayer.hasLayer(bytes) && (await textOf(bytes))[0].includes('traiteur');

  // Calque piégé : types inconnus, image non PNG/JPEG, valeurs absurdes sont ignorés
  R.sanitize = [
    AtelierLayer.sanitize({ type: 'script', x: 1, y: 1 }) === null,
    AtelierLayer.sanitize({ type: 'image', x: 1, y: 1, w: 9, h: 9, src: 'data:image/svg+xml;base64,PHN2Zz4=' }) === null,
    AtelierLayer.sanitize({ type: 'text', x: 1e9, y: 1, text: 'x', size: 10, color: '#000000' }) === null,
    AtelierLayer.sanitize({ type: 'text', x: 1, y: 1, text: 'x', size: 10, color: 'red;background:url(x)' }) === null,
    AtelierLayer.sanitize({ type: 'text', x: 1, y: 1, text: 'ok', size: 10, color: '#112233', font: 'Inconnue', evil: 1 })?.evil === undefined,
  ].every(Boolean);

  S.dirty = false;
  return R;
})()
