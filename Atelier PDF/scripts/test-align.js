// Test de la sélection multiple, de l'alignement, de la répartition et de l'aimantation, exécuté dans la page :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-align.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const doc = await L.PDFDocument.create(); doc.addPage([595, 842]);
  await A.addFiles([new File([await doc.save()], 'aligner.pdf', { type: 'application/pdf' })], true);
  await new Promise(r => setTimeout(r, 300));
  const p = S.pages[0], id = () => Math.random().toString(36).slice(2);
  const T = (x, y, text, size = 12) => ({ id: id(), type: 'text', x, y, r: 0, text, size, font: 'ManropeLight', color: '#111111' });
  const a = T(100, 700, 'Bodegas'), b = T(130, 650, 'Clubs et pièces', 16), c = T(90, 600, 'Pièces sucrées', 10);
  const sh = { id: id(), type: 'shape', kind: 'rect', x: 300, y: 300, w: 80, h: 40, r: 0, stroke: '#d0312d', fill: '', width: 2 };
  p.annots.push(a, b, c, sh);
  const box = x => A.annotBox(x), near = (u, v) => Math.abs(u - v) < 0.02;

  A.selectMany(p.id, [a.id, b.id, c.id]);
  R.selected = A.selAnnots().length === 3;
  R.alignBar = !!document.querySelector('[data-align=left]') && !!document.querySelector('[data-dist=h]') && !!document.querySelector('[data-align=baseline]');

  A.alignSel('left');
  R.left = near(box(a).x0, box(b).x0) && near(box(b).x0, box(c).x0) && near(box(a).x0, 90 - 2);
  A.alignSel('right');
  R.right = near(box(a).x1, box(b).x1) && near(box(b).x1, box(c).x1);
  A.alignSel('hcenter');
  R.hcenter = near(box(a).x0 + box(a).x1, box(c).x0 + box(c).x1);
  A.alignSel('top');
  R.top = near(box(a).y1, box(b).y1) && near(box(b).y1, box(c).y1);
  // Lignes de base : sur le dernier élément choisi (c)
  A.selectMany(p.id, [a.id, b.id, c.id], c.id);
  A.alignSel('baseline');
  R.baseline = a.y === c.y && b.y === c.y;

  // Répartition verticale : écarts égaux, extrêmes immobiles
  Object.assign(a, { y: 700 }); Object.assign(b, { y: 690 }); Object.assign(c, { y: 500 });
  const lo = box(c).y0, hi = box(a).y1;
  A.distributeSel('v');
  const bs = [c, b, a].map(box), g1 = bs[1].y0 - bs[0].y1, g2 = bs[2].y0 - bs[1].y1;
  R.distribute = near(g1, g2) && near(box(c).y0, lo) && near(box(a).y1, hi);

  // Un seul élément : centré sur la page
  A.selectMany(p.id, [sh.id]);
  A.alignSel('hcenter');
  R.pageCenter = near(box(sh).x0 + box(sh).x1, 595);

  // Copier-coller et suppression d'un groupe ; Ctrl+A
  A.selectMany(p.id, [a.id, b.id]); A.copySel(); A.pasteClip();
  R.pasteGroup = p.annots.length === 6 && A.selAnnots().length === 2 && !A.selAnnots().includes(a);
  A.deleteSel();
  R.deleteGroup = p.annots.length === 4;
  A.selectAll();
  R.selectAll = A.selAnnots().length === 4;

  // Cadre tiré à la souris dans le vide : sélectionne ce qu'il touche
  A.setSel(null);
  const v = A.V.get(p.id), r = v.svg.getBoundingClientRect();
  const at = (x, y) => { const [vx, vy] = v.vp.convertToViewportPoint(x, y); return { clientX: r.left + vx, clientY: r.top + vy }; };
  const fire = (el, type, pt, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, isPrimary: true, ...pt, ...extra }));
  fire(v.el, 'pointerdown', at(250, 400)); fire(v.el, 'pointermove', at(420, 250)); fire(v.el, 'pointerup', at(420, 250));
  R.marquee = A.selAnnots().length === 1 && A.selAnnots()[0] === sh;

  // Glisser un texte près de la ligne de base d'un autre : il s'y aimante et un repère apparaît
  Object.assign(a, { x: 100, y: 700 }); Object.assign(b, { x: 300, y: 500 });
  A.setSel(null); A.V.forEach(x => x.guides = null);
  const node = v.g.querySelector(`[data-aid="${b.id}"]`) || (await new Promise(r => setTimeout(r, 50)), v.g.querySelector(`[data-aid="${b.id}"]`));
  A.selectMany(p.id, [b.id]);
  const nodeB = v.g.querySelector(`[data-aid="${b.id}"] rect`) || node;
  fire(nodeB, 'pointerdown', at(305, 503));
  fire(v.svg, 'pointermove', at(305, 600));
  fire(v.svg, 'pointermove', at(305, 703.5 + 3 / v.vp.scale * 0.3));   // presque sur la ligne de base de a
  R.guideShown = (v.guides || []).length > 0;
  fire(v.svg, 'pointerup', at(305, 703.5));
  R.snappedBaseline = b.y === a.y || `${b.y} vs ${a.y}`;
  R.guidesCleared = !v.guides;

  // Espacement égal dans une colonne : C vient sous B à la même distance que B sous A, deux écarts sont montrés
  const box2 = (y, h) => ({ id: id(), type: 'shape', kind: 'rect', x: 100, y, w: 100, h, r: 0, stroke: '#111111', fill: '', width: 1 });
  p.annots.length = 0;
  const sA = box2(600, 40), sB = box2(560, 30), sC = box2(300, 20);
  p.annots.push(sA, sB, sC); A.setSel(null);
  await new Promise(r => setTimeout(r, 50));
  const nodeC = v.g.querySelector(`[data-aid="${sC.id}"] rect`);
  fire(nodeC, 'pointerdown', at(150, 310));
  fire(v.svg, 'pointermove', at(150, 400));
  fire(v.svg, 'pointermove', at(150, 311.5 + 230));   // C monterait à 531,5 : l'écart égal (10) le met à 530
  R.gapMarks = (v.guides || []).filter(g => g.gap).length === 2;
  fire(v.svg, 'pointerup', at(150, 541.5));
  R.gapSnapped = sC.y === 530 || `y=${sC.y}`;

  // Alt + glisser : une copie part, l'original reste
  A.selectMany(p.id, [sA.id]);
  const nodeA = v.g.querySelector(`[data-aid="${sA.id}"] rect`);
  fire(nodeA, 'pointerdown', at(150, 620), { altKey: true });
  fire(v.svg, 'pointermove', at(350, 620), { altKey: true });
  fire(v.svg, 'pointerup', at(350, 620), { altKey: true });
  const copy = A.selAnnots()[0];
  // (la copie peut s'aimanter : son bord gauche tombe près du centre de la page)
  R.altDuplicate = p.annots.length === 4 && sA.x === 100 && copy !== sA && Math.abs(copy.x - 300) < 3 || `n=${p.annots.length} x=${copy.x}`;

  // Ctrl pendant le déplacement : pas d'aimant, le déplacement est exactement celui de la souris
  const x0 = copy.x;
  fire(v.g.querySelector(`[data-aid="${copy.id}"] rect`), 'pointerdown', at(350, 620));
  fire(v.svg, 'pointermove', at(351.2, 620), { ctrlKey: true });
  fire(v.svg, 'pointerup', at(351.2, 620), { ctrlKey: true });
  R.ctrlFree = Math.abs(copy.x - x0 - 1.2) < 0.02 || `x=${copy.x}`;

  // Cadrage d'une image à la souris : double-clic, glisser dans le cadre, Entrée
  const wc = document.createElement('canvas'); wc.width = 1200; wc.height = 300;
  const wg = wc.getContext('2d'); wg.fillStyle = '#00a000'; wg.fillRect(0, 0, 600, 300); wg.fillStyle = '#0000c0'; wg.fillRect(600, 0, 600, 300);
  const im = { id: id(), type: 'image', x: 100, y: 100, w: 150, h: 150, r: 0, src: wc.toDataURL('image/png') };
  p.annots.push(im); A.setSel(null); await new Promise(r => setTimeout(r, 50));
  await A.replaceImage(im, new File([await new Promise(r => wc.toBlob(r, 'image/png'))], 'large.png', { type: 'image/png' }));
  const imgNode = () => v.g.querySelector(`[data-aid="${im.id}"] rect, [data-aid="${im.id}"] image`);
  await new Promise(r => setTimeout(r, 50));
  const nodeI = imgNode() || v.g.querySelector(`[data-aid="${im.id}"]`);
  nodeI.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, ...at(175, 175) }));
  await new Promise(r => setTimeout(r, 200));
  R.cropModeOpen = !!document.querySelector('#props [data-cropzoom]');
  const target = v.g.querySelector(`[data-aid="${im.id}"] rect`);
  fire(target, 'pointerdown', at(175, 175)); fire(v.svg, 'pointermove', at(225, 175)); fire(v.svg, 'pointerup', at(225, 175));   // glisse vers la droite : on voit plus à gauche
  const cx = im.fit.cx;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  R.cropDrag = cx < 0.5 && !document.querySelector('#props [data-cropzoom]') || `cx=${cx}`;

  S.dirty = false;
  return R;
})()
