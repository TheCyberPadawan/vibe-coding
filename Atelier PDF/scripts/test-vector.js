// Test des blocs de couleur et du texte remplacé, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-vector.js electron .
(async () => {
  const A = window.__atelier, { S, V } = A, L = PDFLib, VEC = AtelierVector, R = {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const near = (h, t, tol = 12) => { const a = parseInt(h.slice(1), 16), b = parseInt(t.slice(1), 16); return [16, 8, 0].every(s => Math.abs((a >> s & 255) - (b >> s & 255)) <= tol); };

  // Page : bloc bleu (re) avec un titre blanc en Manrope gras intégré, forme verte arrondie (courbes),
  // bloc rouge dans un sous-dessin (XObject), texte noir Helvetica
  const doc = await L.PDFDocument.create(); doc.registerFontkit(window.fontkit);
  const manrope = await doc.embedFont(await A.appBytes('fonts/Manrope-Bold.ttf'), { subset: true });
  const helv = await doc.embedFont(L.StandardFonts.Helvetica);
  const pg = doc.addPage([595, 842]);
  pg.drawRectangle({ x: 50, y: 700, width: 400, height: 60, color: L.rgb(0.1, 0.3, 0.6) });
  pg.drawText('Titre blanc 2026', { x: 60, y: 720, size: 24, font: manrope, color: L.rgb(1, 1, 1) });
  pg.drawSvgPath('M 20 0 L 180 0 Q 200 0 200 20 L 200 80 Q 200 100 180 100 L 20 100 Q 0 100 0 80 L 0 20 Q 0 0 20 0 Z', { x: 50, y: 600, color: L.rgb(0.2, 0.7, 0.3) });
  pg.drawText('Texte noir', { x: 60, y: 400, size: 14, font: helv, color: L.rgb(0, 0, 0) });
  const form = doc.context.formXObject([L.pushGraphicsState(), L.setFillingRgbColor(0.9, 0.1, 0.1), L.rectangle(0, 0, 80, 40), L.fill(), L.popGraphicsState()], { BBox: [0, 0, 80, 40], Matrix: [1, 0, 0, 1, 0, 0] });
  const fref = doc.context.register(form);
  pg.node.setXObject(L.PDFName.of('Rouge'), fref);
  pg.pushOperators(L.pushGraphicsState(), L.concatTransformationMatrix(1, 0, 0, 1, 300, 300), L.drawObject('Rouge'), L.popGraphicsState());
  await A.addFiles([new File([await doc.save()], 'blocs.pdf', { type: 'application/pdf' })], true);

  const v = V.get(S.pages[0].id); let p = S.pages[0];
  for (let k = 0; k < 60 && !(v.shapes && v.canvas.width); k++) await wait(100);
  await wait(500);
  R.shapes = v.shapes.map(s => `${s.ord}:${s.kind || s.fill}:${Math.round(s.box.x0)},${Math.round(s.box.y0)},${Math.round(s.box.x1)},${Math.round(s.box.y1)}`).join(' ');
  const blue = A.vHit(v, [250, 705]), green = A.vHit(v, [150, 550]), red = A.vHit(v, [340, 320]);
  R.hits = [blue, green, red].map(s => s?.kind || s?.fill).join(',');
  R.hitBlue = !!blue?.fill && near(blue.fill, '#1a4d99');
  R.hitGreenCurved = !!green?.fill && near(green.fill, '#33b34d');
  R.hitRedInXObject = !!red?.fill && near(red.fill, '#e61a1a');
  if (!R.hitBlue || !R.hitGreenCurved || !R.hitRedInXObject) return R;
  R.missEmpty = A.vHit(v, [500, 100]) === null;
  if (!blue || !green || !red) { R.boxes = v.shapes.map(s => JSON.stringify(s.box)); return R; }

  // Sélection, couleur, déplacement, suppression
  A.setVsel(v, blue); A.vChange({ fill: '#ff8800' });
  R.propsShowsBlock = /Bloc du PDF/.test(document.querySelector('#props').textContent);
  p.vedits = { ...p.vedits, [green.ord]: { m: [1, 0, 0, 1, 200, -100] } };
  A.setVsel(v, red); A.vDelete();
  await wait(1500);
  R.greenMovedHit = A.vHit(v, [350, 450])?.ord === green.ord && A.vHit(v, [150, 550]) === null;
  R.redGone = A.vHit(v, [340, 320]) === null;

  // Rendu à l'écran : le bloc devenu orange, le titre blanc toujours visible au-dessus
  const px = (x, y) => { const [a, b] = v.vp.convertToViewportPoint(x, y), k = v.canvas.width / v.vp.width; return [...v.canvas.getContext('2d').getImageData(Math.round(a * k), Math.round(b * k), 1, 1).data.slice(0, 3)]; };
  R.screenOrange = (([r, g, b]) => r > 230 && g > 110 && g < 160 && b < 40)(px(400, 705));
  let white = 0; for (let x = 60; x < 250; x += 1) { const c = px(x, 728); if (c[0] > 235 && c[1] > 235 && c[2] > 235) white++; }
  R.screenWhiteTextOnTop = white > 10;

  // Enregistrement : relu, les blocs sont modifiés à leur place
  const out = (await A.producePdf(S.pages, { protect: null })).bytes;
  const od = await L.PDFDocument.load(out), os = VEC.scan(od, od.getPage(0)).filter(s => s.kind !== 'text');
  R.savedShapes = os.map(s => `${s.fill}@${Math.round(s.box.x0)},${Math.round(s.box.y0)}`).join(' ');
  R.savedOrange = os.some(s => near(s.fill, '#ff8800') && Math.round(s.box.x0) === 50);
  R.savedGreenMoved = os.some(s => near(s.fill, '#33b34d') && Math.round(s.box.x0) === 250 && Math.round(s.box.y0) === 400);
  R.savedRedGone = !os.some(s => near(s.fill, '#e61a1a'));
  const opdf = await A.openPdfjs(out), opg = await opdf.getPage(1);
  R.savedText = (await opg.getTextContent()).items.map(i => i.str).join('|');
  const c = document.createElement('canvas'), ovp = opg.getViewport({ scale: 2 }); c.width = ovp.width; c.height = ovp.height;
  await opg.render({ canvasContext: c.getContext('2d'), viewport: ovp }).promise;
  let w2 = 0; for (let x = 60; x < 250; x++) { const [a, b] = ovp.convertToViewportPoint(x, 728); const d = c.getContext('2d').getImageData(Math.round(a), Math.round(b), 1, 1).data; if (d[0] > 235 && d[1] > 235 && d[2] > 235) w2++; }
  R.savedWhiteTextOnTop = w2 > 10;
  opdf.loadingTask.destroy();

  // Annuler : la suppression du bloc rouge est défaite
  A.undo(); await wait(1200);
  R.undoRestoresRed = !A.S.pages[0].vedits?.[red.ord];

  // Modifier le texte blanc : couleur et police d'origine conservées (annuler a remplacé l'objet page)
  p = S.pages[0];
  await A.replaceTextAt(v, [100, 728]);
  await wait(300);
  const txt = p.annots.find(a => a.type === 'text'), mask = p.annots.find(a => a.type === 'rect' && a.erase);
  R.textColor = txt?.color; R.textWhite = txt && near(txt.color, '#ffffff', 20);
  R.maskColor = mask?.color;   // couleur du bloc à l'écran à ce moment (orange)
  R.textPsName = txt?.psName; R.textFontDyn = !!A.fontOf(txt).dyn;
  document.querySelector('textarea.editor')?.blur(); await wait(100);
  txt.text = 'Titre blanc 2027';   // le 7 n'est pas dans la police intégrée (sous-ensemble)
  R.missingGlyphFallback = !A.fontOf(txt).dyn && A.fontOf(txt).css.includes('Helvetica');
  txt.text = 'Titre ancre 2026';
  R.coveredUsesOriginal = !!A.fontOf(txt).dyn;
  const out2 = (await A.producePdf(S.pages, { protect: null })).bytes, d2 = await L.PDFDocument.load(out2);
  const baseFonts = d2.context.enumerateIndirectObjects().map(([, o]) => o instanceof L.PDFDict && o.lookup(L.PDFName.of('Type'))?.asString() === '/Font' ? o.lookup(L.PDFName.of('BaseFont'))?.asString() : null).filter(Boolean);
  R.savedFonts = baseFonts.join(' ');
  R.savedUsesManrope = baseFonts.filter(f => /Manrope/.test(f)).length >= 1;
  const p2 = await (await A.openPdfjs(out2)).getPage(1);
  R.savedTextAll = (await p2.getTextContent()).items.map(i => i.str).join('|');
  R.savedNewText = R.savedTextAll.split('|').join('').includes('Titre ancre 2026');

  // Double-clic avec l'outil Sélection sur un texte du PDF : passe en modification
  A.setTool('select');
  const before = p.annots.filter(a => a.type === 'text').length;
  const r = v.el.getBoundingClientRect(), [qx, qy] = v.vp.convertToViewportPoint(80, 404);
  v.canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + qx, clientY: r.top + qy }));
  await wait(800);
  R.dblclickEdits = p.annots.filter(a => a.type === 'text').length === before + 1 && !!document.querySelector('textarea.editor');
  document.querySelector('textarea.editor')?.blur();

  // Polices de Windows trouvées par leur nom PostScript
  if (window.desktop?.findFont) for (const n of ['ArialMT', 'Arial-BoldMT', 'TimesNewRomanPS-BoldMT', 'Calibri,Bold', 'PoliceQuiNExistePas'])
    R['font_' + n] = (await window.desktop.findFont(n))?.ps || null;

  S.dirty = false;
  return R;
})()
