// Test du cadre de sélection sur les éléments d'origine du PDF, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-marquee.js electron .
// Le cadre prend ce qui est entièrement dedans (textes et blocs du PDF, ajouts), le groupe se déplace d'un bloc,
// et un mot déplacé seul ne décale pas la suite de sa ligne.
(async () => {
  const A = window.__atelier, { S, V } = A, L = PDFLib, R = {};
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const doc = await L.PDFDocument.create(), helv = await doc.embedFont(L.StandardFonts.Helvetica), bold = await doc.embedFont(L.StandardFonts.HelveticaBold);
  const W = s => helv.widthOfTextAtSize(s, 12);
  for (let k = 0; k < 2; k++) {
    const pg = doc.addPage([595, 842]);
    pg.drawRectangle({ x: 50, y: 700, width: 400, height: 60, color: L.rgb(0.1, 0.3, 0.6) });
    pg.drawText('Titre', { x: 60, y: 720, size: 24, font: bold, color: L.rgb(1, 1, 1) });
    const f = pg.node.newFontDictionary('Fx', helv.ref);
    // « Premier » puis « suite » sans repositionnement : la suite dépend de l'avance de « Premier »
    pg.pushOperators(L.beginText(), L.setFontAndSize(f, 12), L.moveText(60, 500), L.showText(helv.encodeText('Premier')), L.showText(helv.encodeText(' suite')),
      L.moveText(0, -20), L.showText(helv.encodeText('Deuxieme ligne')), L.endText());
  }
  await A.addFiles([new File([await doc.save()], 'cadre.pdf', { type: 'application/pdf' })], true);
  const v = V.get(S.pages[0].id);
  for (let k = 0; k < 60 && !(v.shapes && v.canvas.width); k++) await wait(100);
  await wait(400);
  R.items = v.shapes.map(s => s.kind || 'forme').join(',');

  let p = S.pages[0];
  p.annots.push({ id: 'ann1', type: 'shape', kind: 'rect', x: 350, y: 470, w: 60, h: 30, r: 0, stroke: '#d0312d', fill: '', width: 2 });
  A.setSel(null);
  // Position de la page relue à chaque fois : la barre de propriétés peut changer de hauteur avec la sélection
  const at = (x, y) => { const r = v.el.getBoundingClientRect(), [vx, vy] = v.vp.convertToViewportPoint(x, y); return { clientX: r.left + vx, clientY: r.top + vy }; };
  const fire = (el, type, pt, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, isPrimary: true, ...pt, ...extra }));
  const drag = (el, from, to) => { fire(el, 'pointerdown', at(...from)); fire(el, 'pointermove', at(from[0] + 2, from[1] + 2)); fire(el, 'pointermove', at(...to)); fire(el, 'pointerup', at(...to)); };

  // Cadre autour des deux lignes et du rectangle ajouté ; il ne touche que la moitié du bloc bleu
  drag(v.el, [40, 525], [430, 465]);
  R.marqueeTexts = S.vsel?.ords.length;
  R.marqueeAnnot = A.selAnnots().map(a => a.id).join(',');
  R.propsCount = document.querySelector('#props').textContent.match(/\d+ éléments/)?.[0];
  drag(v.el, [40, 755], [300, 650]);   // à cheval sur le bloc bleu : seul le titre est entièrement dedans
  R.partialBlockSkipped = S.vsel?.ords.length === 1 && v.shapes.find(s => String(s.ord) === S.vsel.ords[0])?.kind === 'text';

  // Le groupe se déplace d'un seul geste en saisissant l'un de ses textes
  drag(v.el, [40, 525], [430, 465]);
  drag(v.el, [70, 503], [120, 603]);   // +50, +100
  await wait(1500);
  p = S.pages[0];
  R.groupVedits = Object.values(p.vedits || {}).map(e => e.m?.slice(4).map(Math.round).join('/')).join(' ');
  const ann = p.annots.find(a => a.id === 'ann1');
  R.annotMoved = ann && Math.round(ann.x) === 400 && Math.round(ann.y) === 570;

  // Page 2 : seul « Premier » monte de 50 pt ; « suite » et la ligne suivante ne bougent pas
  const v2 = V.get(S.pages[1].id);
  v2.wrap.scrollIntoView(); for (let k = 0; k < 60 && !(v2.shapes && v2.canvas.width); k++) await wait(100);
  await wait(300);
  const r2 = v2.el.getBoundingClientRect(), at2 = (x, y) => { const [vx, vy] = v2.vp.convertToViewportPoint(x, y); return { clientX: r2.left + vx, clientY: r2.top + vy }; };
  fire(v2.el, 'pointerdown', at2(70, 503)); fire(v2.el, 'pointermove', at2(72, 505)); fire(v2.el, 'pointermove', at2(70, 553)); fire(v2.el, 'pointerup', at2(70, 553));
  await wait(1200);
  // Suppression d'un texte du PDF au clavier
  fire(v2.el, 'pointerdown', at2(70, 483)); fire(v2.el, 'pointerup', at2(70, 483));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  await wait(1200);

  // Relecture du PDF enregistré
  const out = (await A.producePdf(S.pages, { protect: null })).bytes, pdf = await A.openPdfjs(out);
  const pos = async n => (await (await pdf.getPage(n)).getTextContent()).items.filter(i => i.str.trim()).map(i => ({ s: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]) }));
  const t1 = await pos(1), t2 = await pos(2), find = (t, s) => t.find(i => i.s === s || i.s.startsWith(s));
  R.page1 = t1.map(i => `${i.s}@${i.x},${i.y}`).join(' | ');
  R.page2 = t2.map(i => `${i.s}@${i.x},${i.y}`).join(' | ');
  R.p1PremierMoved = find(t1, 'Premier')?.x === 110 && find(t1, 'Premier')?.y === 600;
  R.p1DeuxiemeMoved = find(t1, 'Deuxieme')?.x === 110 && find(t1, 'Deuxieme')?.y === 580;
  R.p1TitreStays = find(t1, 'Titre')?.y === 720;
  R.p2PremierUp = find(t2, 'Premier')?.y === 550 && find(t2, 'Premier')?.x === 60;
  R.p2SuiteStays = (() => { const s = find(t2, 'suite'); return s && s.y === 500 && Math.abs(s.x - Math.round(60 + W('Premier') + W(' ') )) <= 1; })();
  R.p2DeuxiemeDeleted = !find(t2, 'Deuxieme');
  pdf.loadingTask.destroy();

  S.dirty = false;
  return R;
})()
