// Test de Alt (copie) et Maj (axe horizontal ou vertical) sur les éléments du PDF et les ajouts, mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-copy.js electron .
(async () => {
  const A = window.__atelier, { S, V } = A, L = PDFLib, VEC = AtelierVector, R = {};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const doc = await L.PDFDocument.create(), bold = await doc.embedFont(L.StandardFonts.HelveticaBold);
  const pg = doc.addPage([595, 842]);
  pg.drawRectangle({ x: 50, y: 700, width: 400, height: 60, color: L.rgb(0.1, 0.3, 0.6) });
  pg.drawText('Titre', { x: 60, y: 720, size: 24, font: bold, color: L.rgb(1, 1, 1) });
  await A.addFiles([new File([await doc.save()], 'copie.pdf', { type: 'application/pdf' })], true);
  const v = V.get(S.pages[0].id);
  for (let k = 0; k < 60 && !(v.shapes && v.canvas.width); k++) await wait(100);
  await wait(400);
  const rr = () => v.el.getBoundingClientRect();
  const at = (x, y) => { const [vx, vy] = v.vp.convertToViewportPoint(x, y), r = rr(); return { clientX: r.left + vx, clientY: r.top + vy }; };
  const fire = (el, type, pt, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, isPrimary: true, ...pt, ...extra }));
  const drag = (el, from, to, mods = {}) => { fire(el, 'pointerdown', at(...from), mods); fire(el, 'pointermove', at(from[0] + 3, from[1] + 1), mods); fire(el, 'pointermove', at(...to), mods); fire(el, 'pointerup', at(...to), mods); };
  const p = () => S.pages[0];
  const blueOrd = v.shapes.find(s => s.kind !== 'text').ord, textOrd = v.shapes.find(s => s.kind === 'text').ord;

  // Alt + glisser le bloc bleu : une copie part, l'original reste
  drag(v.el, [400, 705], [430, 505], { altKey: true });
  await wait(1200);
  const ed = p().vedits?.[blueOrd];
  R.copyMade = ed?.copies?.length === 1 && !ed.m;
  R.copyOffset = ed?.copies?.[0]?.m.slice(4).map(Math.round).join('/');
  R.copySelected = S.vsel?.ords.length === 1 && S.vsel.ords[0].includes(':');
  R.originalStillHit = A.vHit(v, [400, 705])?.ord === blueOrd && !A.vHit(v, [400, 705]).copyId;
  R.copyHit = !!A.vHit(v, [430, 505])?.copyId;

  // Maj + glisser la copie en biais : elle ne bouge qu'à l'horizontale
  drag(v.el, [430, 505], [530, 525], { shiftKey: true });
  await wait(1200);
  R.shiftLockedCopy = p().vedits[blueOrd].copies[0].m.slice(4).map(Math.round).join('/');   // attendu 130/-200

  // Couleur de la copie seule
  A.setVsel(v, A.vHit(v, [560, 505]) || A.vHit(v, [500, 505]));
  A.vChange({ fill: '#22aa44' });
  await wait(1000);
  R.copyRecolored = p().vedits[blueOrd].copies[0].fill === '#22aa44' && !p().vedits[blueOrd].fill;

  // Alt + glisser le titre blanc : le texte du PDF est copié, l'original reste
  drag(v.el, [80, 728], [80, 428], { altKey: true });
  await wait(1200);
  R.textCopied = p().vedits?.[textOrd]?.copies?.length === 1;

  // Ajout de l'utilisateur : Maj bloque l'axe, Alt copie
  p().annots.push({ id: 'ann1', type: 'shape', kind: 'rect', x: 100, y: 200, w: 60, h: 30, r: 0, stroke: '#d0312d', fill: '#ffe08a', width: 2 });
  A.setSel(p().id, 'ann1');
  const node = () => v.g.querySelector('[data-aid="ann1"] rect');
  fire(node(), 'pointerdown', at(130, 215)); fire(v.svg, 'pointermove', at(133, 216), { shiftKey: true }); fire(v.svg, 'pointermove', at(210, 235), { shiftKey: true }); fire(v.svg, 'pointerup', at(210, 235), { shiftKey: true });
  const a1 = p().annots.find(a => a.id === 'ann1');
  R.annotShiftLocked = Math.round(a1.x) === 180 && Math.round(a1.y) === 200;
  fire(node(), 'pointerdown', at(210, 215), { altKey: true }); fire(v.svg, 'pointermove', at(213, 216)); fire(v.svg, 'pointermove', at(210, 115)); fire(v.svg, 'pointerup', at(210, 115));
  R.annotAltCopied = p().annots.filter(a => a.type === 'shape').length === 2 && Math.round(p().annots.find(a => a.id === 'ann1').y) === 200;

  // Supprimer l'original bleu : sa copie reste
  A.setVsel(v, A.vHit(v, [400, 705]));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  await wait(1200);
  R.originalDeletedCopyKept = p().vedits[blueOrd].del === true && p().vedits[blueOrd].copies.length === 1;

  // Relecture du PDF enregistré
  const out = (await A.producePdf(S.pages, { protect: null })).bytes;
  const od = await L.PDFDocument.load(out), os = VEC.scan(od, od.getPage(0));
  R.savedShapes = os.filter(s => s.kind !== 'text').map(s => `${s.fill}@${Math.round(s.box.x0)},${Math.round(s.box.y0)}`).join(' ');
  R.savedCopyOnly = R.savedShapes.includes('#22aa44@180,500') && !R.savedShapes.includes('#1a4d99');
  const pdf = await A.openPdfjs(out), items = (await (await pdf.getPage(1)).getTextContent()).items.filter(i => i.str.trim());
  R.savedTitres = items.filter(i => i.str === 'Titre').map(i => Math.round(i.transform[5])).sort().join(',');
  R.savedTwoTitres = /^4(19|20|21),720$/.test(R.savedTitres);
  pdf.loadingTask.destroy();

  // Annuler la suppression
  A.undo(); await wait(1000);
  R.undoBringsBack = !S.pages[0].vedits[blueOrd].del;

  S.dirty = false;
  return R;
})()
