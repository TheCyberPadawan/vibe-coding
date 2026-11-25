// Test des groupes (Ctrl+G / Ctrl+Maj+G) et du verrouillage (Ctrl+L / Ctrl+Maj+L), exécuté dans la page :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-group.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const doc = await L.PDFDocument.create(); doc.addPage([595, 842]);
  await A.addFiles([new File([await doc.save()], 'groupes.pdf', { type: 'application/pdf' })], true);
  await new Promise(r => setTimeout(r, 300));
  let p = S.pages[0];
  const id = () => Math.random().toString(36).slice(2, 10), near = (u, v, e = 0.05) => Math.abs(u - v) < e;
  const t = { id: id(), type: 'text', x: 100, y: 700, r: 0, text: 'Titre groupé', size: 20, font: 'Helvetica', color: '#111111' };
  const sh = { id: id(), type: 'shape', kind: 'rect', x: 90, y: 600, w: 200, h: 80, r: 0, stroke: '#d0312d', fill: '', width: 2, rx: 6 };
  const ln = { id: id(), type: 'line', x1: 90, y1: 590, x2: 290, y2: 590, arrow: false, stroke: '#111111', width: 2 };
  const other = { id: id(), type: 'shape', kind: 'ellipse', x: 400, y: 400, w: 60, h: 60, r: 0, stroke: '#111111', fill: '', width: 1 };
  p.annots.push(t, sh, ln, other);
  const v = A.V.get(p.id), r = v.svg.getBoundingClientRect();
  const at = (x, y) => { const [vx, vy] = v.vp.convertToViewportPoint(x, y); return { clientX: r.left + vx, clientY: r.top + vy }; };
  const fire = (el, type, pt, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, isPrimary: true, ...pt, ...extra }));
  const key = (k, o = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, ctrlKey: true, bubbles: true, ...o }));
  const node = a => v.g.querySelector(`[data-aid="${a.id}"]`);
  const box = a => A.annotBox(a);

  // Ctrl+G avec moins de deux éléments : rien
  A.selectMany(p.id, [t.id]); key('g');
  R.needTwo = !t.gid;
  // Ctrl+G sur trois éléments
  A.selectMany(p.id, [t.id, sh.id, ln.id]); key('g');
  R.grouped = !!t.gid && t.gid === sh.gid && sh.gid === ln.gid && !other.gid;
  R.groupBox = !!v.g.querySelector('.selbox.group [data-handle="g"]') && document.querySelector('[data-act=ungroup]') !== null;
  // Un clic sur un membre sélectionne tout le groupe
  A.setSel(null);
  fire(node(sh).querySelector('rect'), 'pointerdown', at(95, 640)); fire(v.svg, 'pointerup', at(95, 640));
  R.clickSelectsGroup = A.selAnnots().length === 3 && !!A.selGroup();
  // Glisser un membre déplace tout le groupe
  const t0 = { x: t.x, y: t.y }, l0 = { x1: ln.x1 };
  fire(node(sh).querySelector('rect'), 'pointerdown', at(95, 640));
  fire(v.svg, 'pointermove', at(125, 620), { ctrlKey: true }); fire(v.svg, 'pointermove', at(135, 610), { ctrlKey: true });
  fire(v.svg, 'pointerup', at(135, 610));
  R.moveTogether = near(t.x - t0.x, 40) && near(t.y - t0.y, -30) && near(ln.x1 - l0.x1, 40) && near(other.x, 400);
  // Maj+clic sur l'autre élément : le groupe + l'ellipse ; Ctrl+G : un seul groupe englobant
  fire(node(other).querySelector('ellipse'), 'pointerdown', at(430, 430), { shiftKey: true }); fire(v.svg, 'pointerup', at(430, 430));
  R.shiftAddsUnit = A.selAnnots().length === 4;
  // Ungroup : retire le groupe de tous les membres sélectionnés
  A.selectMany(p.id, [t.id, sh.id, ln.id]); key('g', { shiftKey: true, key: 'G' });
  R.ungrouped = !t.gid && !sh.gid && !ln.gid;
  key('z');
  R.undoUngroup = !!S.pages[0].annots.find(a => a.id === t.id).gid;
  key('y');
  R.redoUngroup = !S.pages[0].annots.find(a => a.id === t.id).gid;
  key('z');   // groupe rétabli
  p = S.pages[0];
  const [T, SH, LN, O] = [t, sh, ln, other].map(a => p.annots.find(x => x.id === a.id));

  // Redimensionner le groupe avec sa poignée : tout est mis à l'échelle (texte compris), coin haut gauche fixe
  A.selectMany(p.id, [T.id, SH.id, LN.id]);
  const b0 = { ...[T, SH, LN].map(box).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) })) };
  const s0 = { size: T.size, w: SH.w, h: SH.h, rx: SH.rx, len: LN.x2 - LN.x1 };
  const hd = v.g.querySelector('[data-handle="g"]');
  const hx = +hd.getAttribute('cx'), hy = +hd.getAttribute('cy');
  // Pointeur sur la diagonale prolongée : facteur 1,5
  const W = b0.x1 - b0.x0, H = b0.y1 - b0.y0;
  fire(hd, 'pointerdown', at(hx, hy));
  fire(v.svg, 'pointermove', at(b0.x0 + W * 1.2, b0.y1 - H * 1.2));
  fire(v.svg, 'pointermove', at(b0.x0 + W * 1.5, b0.y1 - H * 1.5));
  fire(v.svg, 'pointerup', at(b0.x0 + W * 1.5, b0.y1 - H * 1.5));
  const k = SH.w / s0.w;
  R.resizeFactor = near(k, 1.5, 0.02) || k;
  R.resizeProportional = near(SH.h / s0.h, k, 0.01) && near(T.size / s0.size, k, 0.02) && near((LN.x2 - LN.x1) / s0.len, k, 0.02) && near(SH.rx / s0.rx, k, 0.05) && near(SH.width, 2 * k, 0.05);
  const b1 = [T, SH, LN].map(box).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), y1: Math.max(u.y1, b.y1) }), { x0: 1e9, y1: -1e9 });
  R.anchorFixed = near(b1.x0, b0.x0, 2) && near(b1.y1, b0.y1, 2)   // marges fixes des cadres (2-3 pt)
   || JSON.stringify([b0, b1]);
  key('z');
  R.undoResize = near(S.pages[0].annots.find(a => a.id === SH.id).w, s0.w);
  key('y');
  R.redoResize = near(S.pages[0].annots.find(a => a.id === SH.id).w, s0.w * k);

  // Copier-coller un groupe : la copie forme son propre groupe
  p = S.pages[0];
  const g0 = p.annots.find(a => a.id === T.id).gid;
  A.selectMany(p.id, p.annots.filter(a => a.gid === g0).map(a => a.id)); A.copySel(); A.pasteClip();
  const pasted = A.selAnnots();
  R.pasteNewGroup = pasted.length === 3 && pasted.every(a => a.gid && a.gid === pasted[0].gid && a.gid !== g0);
  A.deleteSel();

  // Alignement : un groupe seul est centré sur la page d'un bloc (ses membres gardent leurs positions relatives)
  A.selectMany(p.id, p.annots.filter(a => a.gid === g0).map(a => a.id));
  const rel0 = p.annots.find(a => a.id === T.id).x - p.annots.find(a => a.id === SH.id).x;
  A.alignSel('hcenter');
  const mem = p.annots.filter(a => a.gid === g0), ub = mem.map(box).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), x1: Math.max(u.x1, b.x1) }), { x0: 1e9, x1: -1e9 });
  R.alignAsUnit = near(ub.x0 + ub.x1, 595, 0.1) && near(p.annots.find(a => a.id === T.id).x - p.annots.find(a => a.id === SH.id).x, rel0);

  // Verrouillage : Ctrl+L sur l'ellipse, elle ne se sélectionne plus, ni au clic ni au cadre, ni par Ctrl+A
  const E = p.annots.find(a => a.id === O.id);
  A.selectMany(p.id, [E.id]); key('l');
  R.locked = E.locked === true && !S.sel;
  await new Promise(r => setTimeout(r, 20));
  const en = node(E);
  R.lockedClass = en.classList.contains('locked') && getComputedStyle(en).pointerEvents === 'none';
  R.lockMark = !!v.g.querySelector(`.lockmark[data-unlock="${E.id}"]`);
  A.setSel(null);
  fire(v.el, 'pointerdown', at(380, 380)); fire(v.el, 'pointermove', at(480, 480)); fire(v.el, 'pointerup', at(480, 480));
  R.marqueeSkipsLocked = !S.sel;
  A.selectAll();
  R.selectAllSkipsLocked = !A.selAnnots().includes(E);
  // Un élément sous un verrouillé se clique à travers lui
  const under = { id: id(), type: 'shape', kind: 'rect', x: 410, y: 410, w: 20, h: 20, r: 0, stroke: '#111111', fill: '#ffe08a', width: 1 };
  p.annots.splice(p.annots.indexOf(E), 0, under);   // dessous
  E.fill = '#cccccc'; A.setSel(null);
  v.wrap.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 50));
  const rr = v.svg.getBoundingClientRect(), [hx2, hy2] = v.vp.convertToViewportPoint(420, 420);
  const hitEl = document.elementFromPoint(rr.left + hx2, rr.top + hy2);
  R.clickThrough = hitEl?.closest('[data-aid]')?.dataset.aid === under.id || String(hitEl?.outerHTML?.slice(0, 80));
  // Clic droit : le menu propose de déverrouiller
  v.el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: rr.left + v.vp.convertToViewportPoint(445, 445)[0], clientY: rr.top + v.vp.convertToViewportPoint(445, 445)[1] }));
  const menu = document.querySelector('#mCtx');
  R.contextMenu = !menu.hidden && [...menu.querySelectorAll('button')].some(b => b.textContent.includes('Déverrouiller cet élément')) && [...menu.querySelectorAll('button')].some(b => b.textContent.includes('Tout déverrouiller'));
  menu.hidden = true;
  // Enregistrer puis rouvrir : groupes et verrou conservés
  A.setSel(null);
  const { bytes } = await A.producePdf(S.pages);
  S.dirty = false;
  await A.addFiles([new File([bytes], 'groupes-rouvert.pdf', { type: 'application/pdf' })], true);
  await new Promise(r => setTimeout(r, 300));
  const back = S.pages[0].annots;
  const gids = back.filter(a => a.gid), lk = back.filter(a => a.locked);
  R.reopenGroup = gids.length === 3 && gids.every(a => a.gid === gids[0].gid) && gids.some(a => a.type === 'text') && gids.some(a => a.type === 'line') || JSON.stringify(back.map(a => [a.type, a.gid]));
  R.reopenLock = lk.length === 1 && lk[0].type === 'shape' && lk[0].kind === 'ellipse';
  // Le PDF affiche les enfants normalement
  const pdf = await A.openPdfjs(bytes), txt = (await (await pdf.getPage(1)).getTextContent()).items.map(i => i.str).join(' ');
  pdf.loadingTask.destroy();
  R.exportText = txt.includes('Titre groupé');
  // Après réouverture, le clic sélectionne encore tout le groupe ; Ctrl+Maj+L déverrouille la page
  const v2 = A.V.get(S.pages[0].id); await new Promise(r => setTimeout(r, 50));
  const sh2 = back.find(a => a.type === 'shape' && a.kind === 'rect' && a.gid);
  const r2 = v2.svg.getBoundingClientRect(), at2 = (x, y) => { const [vx, vy] = v2.vp.convertToViewportPoint(x, y); return { clientX: r2.left + vx, clientY: r2.top + vy }; };
  const n2 = v2.g.querySelector(`[data-aid="${sh2.id}"] rect`);
  fire(n2, 'pointerdown', at2(sh2.x + 2, sh2.y + 20)); fire(v2.svg, 'pointerup', at2(sh2.x + 2, sh2.y + 20));
  R.reopenClickGroup = A.selAnnots().length === 3;
  A.setSel(null); S.cur = 0;
  key('l', { shiftKey: true, key: 'L' });
  R.unlockAll = !S.pages[0].annots.some(a => a.locked) && A.selAnnots().length === 1;
  key('z');
  R.undoUnlock = S.pages[0].annots.some(a => a.locked);
  // Verrou malveillant / identifiant de groupe invalide ignorés à la relecture
  R.sanitize = AtelierLayer.sanitize({ type: 'shape', kind: 'rect', x: 1, y: 1, w: 2, h: 2, stroke: '', width: 0, gid: '<script>', locked: 'yes' })?.gid === undefined
    && AtelierLayer.sanitize({ type: 'line', x1: 1, y1: 1, x2: 2, y2: 2, stroke: '#000000', width: 1, gid: 'abc123', locked: true })?.locked === true;
  S.dirty = false;
  return R;
})()
