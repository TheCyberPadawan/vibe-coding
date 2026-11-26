// Aligner et répartir le contenu d'origine du PDF (blocs, lignes écrites lettre par lettre, groupes) :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-align-pdf.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const near = (u, v, e = 0.05) => Math.abs(u - v) < e;
  const src = await L.PDFDocument.create(), pg = src.addPage([420, 595]), helv = await src.embedFont(L.StandardFonts.Helvetica);
  pg.drawRectangle({ x: 50, y: 480, width: 60, height: 40, color: L.rgb(0.2, 0.4, 0.8) });    // bloc A
  pg.drawRectangle({ x: 90, y: 380, width: 100, height: 40, color: L.rgb(0.9, 0.5, 0.3) });   // bloc B
  pg.drawRectangle({ x: 70, y: 200, width: 40, height: 40, color: L.rgb(0.3, 0.7, 0.4) });    // bloc C
  // Ligne écrite lettre par lettre, comme les PDF imprimés par Chromium
  let x = 150; for (const ch of 'TITRE') { pg.drawText(ch, { x, y: 300, size: 16, font: helv }); x += helv.widthOfTextAtSize(ch, 16); }
  await A.addFiles([new File([await src.save()], 'aligner-pdf.pdf', { type: 'application/pdf' })], true);
  const v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && !v.shapes; k++) await wait(100);
  const p = () => S.pages[0];
  const all = v.shapes.map(s => String(s.ord));
  const boxOf = sh => { const m = p().vedits?.[sh.ord]?.m || [1, 0, 0, 1, 0, 0]; return { x0: sh.box.x0 + m[4], x1: sh.box.x1 + m[4], y0: sh.box.y0 + m[5], y1: sh.box.y1 + m[5] }; };
  const fills = v.shapes.filter(s => s.kind !== 'text').sort((a, b) => b.box.y1 - a.box.y1), letters = v.shapes.filter(s => s.kind === 'text');
  R.items = `${fills.length} blocs, ${letters.length} lettres`;
  const gap0 = letters.map(boxOf).sort((a, b) => a.x0 - b.x0);

  // Tout sélectionner (3 blocs + la ligne) : la barre propose aligner et répartir sur 4 blocs
  A.selectMany(p().id, []); S.vsel = { pid: p().id, ords: all };
  A.alignSel('left');
  const xs = [...fills.map(boxOf), letters.map(boxOf).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0) }), { x0: 1e9 })].map(b => b.x0);
  R.alignLeft = xs.every(x0 => near(x0, 50, 0.5)) || xs.map(n => n.toFixed(1)).join(' ');
  // Les lettres de la ligne gardent leur espacement (pas empilées)
  const gap1 = letters.map(boxOf).sort((a, b) => a.x0 - b.x0);
  R.lineKept = gap1.every((b, i) => near(b.x0 - gap1[0].x0, gap0[i].x0 - gap0[0].x0, 0.01));
  A.alignSel('right');
  const x1s = [...fills.map(boxOf).map(b => b.x1), Math.max(...letters.map(boxOf).map(b => b.x1))];
  R.alignRight = x1s.every(x1 => near(x1, x1s[1], 0.5)) || x1s.map(n => n.toFixed(1)).join(' ');
  A.alignSel('hcenter');
  const cs = fills.map(boxOf).map(b => (b.x0 + b.x1) / 2);
  R.alignCenter = cs.every(c => near(c, cs[0], 0.5));
  // Répartir verticalement : espaces égaux entre A, B, la ligne et C ; extrêmes immobiles
  const yA = boxOf(fills[0]).y1, yC = boxOf(fills[2]).y0;
  A.distributeSel('v');
  const line = letters.map(boxOf).reduce((u, b) => ({ y0: Math.min(u.y0, b.y0), y1: Math.max(u.y1, b.y1) }), { y0: 1e9, y1: -1e9 });
  const bs = [fills[0], fills[1]].map(boxOf).concat([line, boxOf(fills[2])]).sort((a, b) => b.y1 - a.y1);
  const gaps = [0, 1, 2].map(i => bs[i].y0 - bs[i + 1].y1);
  R.distribute = gaps.every(g => near(g, gaps[0], 0.05)) && near(boxOf(fills[0]).y1, yA) && near(boxOf(fills[2]).y0, yC) || gaps.map(n => n.toFixed(2)).join(' ');
  // Une seule étape d'annulation par commande
  const before = JSON.stringify(p().vedits);
  A.alignSel('top'); A.undo();
  R.undoOne = JSON.stringify(S.pages[0].vedits) === before;

  // Deux groupes : A+B groupés, C+ligne groupés ; aligner à gauche déplace chaque groupe d'un bloc
  S.vsel = { pid: p().id, ords: [String(fills[0].ord), String(fills[1].ord)] }; A.groupSel();
  S.vsel = { pid: p().id, ords: [String(fills[2].ord), ...letters.map(s => String(s.ord))] }; A.groupSel();
  const relAB = boxOf(fills[1]).x0 - boxOf(fills[0]).x0;
  S.vsel = { pid: p().id, ords: all };
  A.alignSel('right');
  const g1 = [fills[0], fills[1]].map(boxOf), g2 = [fills[2], ...letters].map(boxOf);
  const r1 = Math.max(...g1.map(b => b.x1)), r2 = Math.max(...g2.map(b => b.x1));
  R.groupsAsBlocks = near(r1, r2, 0.5) && near(boxOf(fills[1]).x0 - boxOf(fills[0]).x0, relAB) || [r1, r2, relAB].join(' ');
  // La barre de propriétés du contenu du PDF propose les boutons
  await wait(50);
  R.barButtons = !!document.querySelector('#props [data-align=left]') && !!document.querySelector('#props [data-align=right]');
  S.dirty = false;
  return R;
})()
