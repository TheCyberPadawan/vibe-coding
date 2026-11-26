// Groupes et verrous sur les éléments d'origine du PDF (blocs de couleur, textes), seuls ou mêlés aux ajouts :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-group-pdf.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // PDF « imprimé » : deux blocs de couleur, un fond de carte et un titre, sans calque Atelier
  const src = await L.PDFDocument.create(), pg = src.addPage([420, 595]), helv = await src.embedFont(L.StandardFonts.HelveticaBold);
  pg.drawRectangle({ x: 40, y: 300, width: 340, height: 220, color: L.rgb(0.86, 0.93, 0.91) });   // fond (à verrouiller)
  pg.drawRectangle({ x: 70, y: 400, width: 100, height: 60, color: L.rgb(0.17, 0.36, 0.84) });     // bloc bleu
  pg.drawRectangle({ x: 220, y: 400, width: 100, height: 60, color: L.rgb(0.89, 0.54, 0.33) });    // bloc orange
  pg.drawLine({ start: { x: 230, y: 340 }, end: { x: 330, y: 340 }, thickness: 2, color: L.rgb(0.1, 0.1, 0.1) });   // filet au trait
  pg.drawText('MRINFO', { x: 80, y: 480, size: 20, font: helv, color: L.rgb(0, 0, 0) });
  await A.addFiles([new File([await src.save()], 'imprime.pdf', { type: 'application/pdf' })], true);
  let v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && !v.shapes; k++) await wait(100);
  let p = v.p;
  const r = () => v.svg.getBoundingClientRect();
  const at = (x, y) => { const [vx, vy] = v.vp.convertToViewportPoint(x, y), b = r(); return { clientX: b.left + vx, clientY: b.top + vy }; };
  const fire = (el, type, pt, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...pt, ...extra }));
  const click = (x, y, extra = {}) => { fire(v.el, 'pointerdown', at(x, y), extra); fire(v.el, 'pointerup', at(x, y), extra); };
  const key = (k, o = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, ctrlKey: true, bubbles: true, ...o }));
  const keyOf = (x, y) => { const sh = A.vHit(v, [x, y]); return sh ? String(sh.ord) : null; };
  R.items = v.shapes.length;
  // Tracé au trait : repéré, saisi près du trait, déplaçable et groupable comme un bloc
  const line = v.shapes.find(s => s.kind === 'stroke');
  R.strokeItem = !!line && A.vHit(v, [280, 341.5])?.ord === line.ord && A.vHit(v, [280, 350])?.kind !== 'stroke';
  click(280, 341); R.strokeSelected = S.vsel?.ords[0] === String(line.ord);
  fire(v.el, 'pointerdown', at(280, 341)); fire(v.el, 'pointermove', at(285, 336), { ctrlKey: true }); fire(v.el, 'pointermove', at(290, 331), { ctrlKey: true }); fire(v.el, 'pointerup', at(290, 331));
  R.strokeMoved = Math.abs((v.p.vedits?.[line.ord]?.m || [])[4] - 10) < 0.01;
  key('z'); v = A.V.get(S.pages[0].id); p = S.pages[0]; A.setSel(null);
  const kBlue = keyOf(120, 430), kOrange = keyOf(270, 430);

  // Clic sur le bleu, Maj+clic sur l'orange, Ctrl+G
  click(120, 430); click(270, 430, { shiftKey: true });
  R.twoSelected = S.vsel?.ords.length === 2;
  key('g');
  R.grouped = !!p.vmeta?.[kBlue]?.gid && p.vmeta[kBlue].gid === p.vmeta[kOrange]?.gid;
  R.groupBox = !!v.g.querySelector('.selbox.group [data-handle="g"]') && !!document.querySelector('[data-act=ungroup]');
  // Un clic sur un seul des deux reprend tout le groupe
  A.setSel(null); click(270, 430);
  R.clickSelectsGroup = S.vsel?.ords.length === 2;
  // Glisser le bleu déplace les deux (Ctrl : sans aimant)
  fire(v.el, 'pointerdown', at(120, 430));
  fire(v.el, 'pointermove', at(130, 420), { ctrlKey: true }); fire(v.el, 'pointermove', at(140, 410), { ctrlKey: true });
  fire(v.el, 'pointerup', at(140, 410), { ctrlKey: true });
  const mB = p.vedits?.[kBlue]?.m, mO = p.vedits?.[kOrange]?.m;
  R.movedTogether = !!mB && !!mO && Math.abs(mB[4] - 20) < 0.01 && Math.abs(mB[5] + 20) < 0.01 && Math.abs(mO[4] - 20) < 0.01 || JSON.stringify([mB, mO]);
  key('z');
  R.undoMove = !S.pages[0].vedits?.[kBlue] && !!S.pages[0].vmeta?.[kBlue]?.gid;
  key('y');
  p = S.pages[0];

  // Groupe mêlé : un texte ajouté rejoint le groupe des deux blocs
  const t = { id: 'ajout1', type: 'text', x: 70, y: 370, r: 0, text: 'Ajout', size: 14, font: 'Helvetica', color: '#111111' };
  p.annots.push(t); A.V.get(p.id).p = p; v = A.V.get(p.id);
  A.setSel(null); await wait(20);
  click(270 + 20, 430 - 20);   // l'orange a été déplacé de (20, -20)
  const tn = v.g.querySelector(`[data-aid="${t.id}"] rect`);
  fire(tn, 'pointerdown', at(75, 372), { shiftKey: true }); fire(v.svg, 'pointerup', at(75, 372), { shiftKey: true });
  R.mixedSelection = S.vsel?.ords.length === 2 && A.selAnnots().length === 1;
  key('g');
  const gid = S.pages[0].annots[0].gid;
  R.mixedGroup = !!gid && S.pages[0].vmeta[kBlue].gid === gid;
  // Clic sur le texte ajouté : tout le groupe (2 blocs + texte)
  A.setSel(null); await wait(20);
  fire(v.g.querySelector(`[data-aid="${t.id}"] rect`), 'pointerdown', at(75, 372)); fire(v.svg, 'pointerup', at(75, 372));
  R.clickAnnotSelectsMixed = S.vsel?.ords.length === 2 && A.selAnnots().length === 1;
  // Redimensionner le groupe mêlé : blocs et texte agrandis ensemble
  const hd = v.g.querySelector('[data-handle="g"]'), hx = +hd.getAttribute('cx'), hy = +hd.getAttribute('cy');
  const size0 = t.size;
  fire(hd, 'pointerdown', at(hx, hy));
  fire(v.svg, 'pointermove', at(hx + 30, hy - 20)); fire(v.svg, 'pointermove', at(hx + 60, hy - 40));
  fire(v.svg, 'pointerup', at(hx + 60, hy - 40));
  p = S.pages[0];
  const mB2 = p.vedits[kBlue].m, tt = p.annots.find(a => a.id === t.id);
  R.resizeMixed = mB2[0] > 1.05 && Math.abs(mB2[0] - mB2[3]) < 0.001 && Math.abs(tt.size / size0 - mB2[0]) < 0.02 || JSON.stringify([mB2, tt.size]);

  // Verrouiller le fond : il ne se clique plus, ni au cadre
  await wait(300);
  A.setSel(null);
  click(60, 320);
  const kBg = S.vsel?.ords[0];
  R.bgSelectable = !!kBg && S.vsel.ords.length === 1;
  key('l');
  R.bgLocked = S.pages[0].vmeta?.[kBg]?.locked === true && !S.vsel;
  R.bgClickThrough = A.vHit(v, [60, 320]) === null;
  R.lockMark = !!v.g.querySelector(`.lockmark[data-unlock="v:${kBg}"]`);
  // Clic droit sur le fond : déverrouiller est proposé
  const b = r(), [cx, cy] = v.vp.convertToViewportPoint(60, 320);
  v.el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: b.left + cx, clientY: b.top + cy }));
  const menu = document.querySelector('#mCtx');
  R.contextMenu = !menu.hidden && [...menu.querySelectorAll('button')].some(x => x.textContent.includes('Déverrouiller cet élément'));
  menu.hidden = true;

  // Enregistrer puis rouvrir : groupe (blocs + texte), positions et verrou retrouvés
  A.setSel(null);
  const before = S.pages[0].vedits;
  const { bytes } = await A.producePdf(S.pages);
  S.dirty = false;
  await A.addFiles([new File([bytes], 'imprime-rouvert.pdf', { type: 'application/pdf' })], true);
  v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && (!v.shapes || S.pages[0].vpending); k++) await wait(100);
  p = S.pages[0];
  const vm = Object.entries(p.vmeta || {});
  const back = p.annots.find(a => a.type === 'text' && a.text === 'Ajout');
  R.reopenGroup = vm.filter(([, e]) => e.gid && e.gid === back?.gid).length === 2 || JSON.stringify(vm);
  R.reopenLock = vm.filter(([, e]) => e.locked).length === 1;
  R.noVedits = !p.vedits;   // les déplacements sont maintenant dans le contenu de la page
  // Le clic sur un bloc reprend tout le groupe après réouverture
  const blue = v.shapes.find(s => s.kind !== 'text' && vm.some(([k, e]) => k === String(s.ord) && e.gid));
  const bx = (blue.box.x0 + blue.box.x1) / 2, by = (blue.box.y0 + blue.box.y1) / 2;
  A.setSel(null); click(bx, by);
  R.reopenClick = S.vsel?.ords.length === 2 && A.selAnnots().length === 1;
  // Ctrl+Maj+G : dégrouper ; Ctrl+Maj+L : déverrouiller
  key('g', { shiftKey: true, key: 'G' });
  R.ungroup = !Object.values(S.pages[0].vmeta || {}).some(e => e.gid) && !S.pages[0].annots.some(a => a.gid);
  A.setSel(null); S.cur = 0;
  key('l', { shiftKey: true, key: 'L' });
  R.unlockAll = !S.pages[0].vmeta;
  key('z');
  R.undoUnlock = Object.values(S.pages[0].vmeta || {}).some(e => e.locked);
  // Calque piégé : les éléments du PDF relus sont vérifiés
  R.sanitize = AtelierLayer.vitem({ k: 'script', b: [0, 0, 1, 1], gid: 'a' }) === null && AtelierLayer.vitem({ k: 'text', b: [0, 0, 1, 1], gid: '<x>' }) === null
    && AtelierLayer.vitem({ k: 'fill', b: [0, 0, 1, 1], locked: true })?.locked === true;
  // Icône au trait dans sa propre découpe (comme dans un PDF imprimé par Chromium) : visible une fois déplacée
  const d2 = await L.PDFDocument.create(), p2 = d2.addPage([200, 200]);
  p2.pushOperators(L.pushGraphicsState(), L.moveTo(40, 40), L.lineTo(70, 40), L.lineTo(70, 70), L.lineTo(40, 70), L.closePath(), L.clip(), L.endPath(),
    L.setLineWidth(4), L.moveTo(45, 45), L.lineTo(65, 65), L.stroke(), L.popGraphicsState());
  S.dirty = false;
  await A.addFiles([new File([await d2.save()], 'icone.pdf', { type: 'application/pdf' })], true);
  v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && !v.shapes; k++) await wait(100);
  const icon = v.shapes.find(s => s.kind === 'stroke');
  const dark = async (x, y) => {   // pixel sombre au point (x, y) de la page rendue avec ses modifications
    const pgR = await A.renderPage(S.pages[0]), vp = pgR.getViewport({ scale: 2 }), c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height; await pgR.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    const [px, py] = vp.convertToViewportPoint(x, y), d = c.getContext('2d').getImageData(Math.round(px), Math.round(py), 1, 1).data;
    return d[3] > 128 && d[0] < 100;
  };
  R.iconBefore = !!icon && await dark(55, 55);
  S.pages[0].vedits = { [icon.ord]: { m: [1, 0, 0, 1, 80, 80] } };
  R.iconMovedVisible = await dark(135, 135) && !(await dark(55, 55));
  S.dirty = false;
  return R;
})()
