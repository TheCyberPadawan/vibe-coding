// Flèches du clavier, ordre d'empilement et calques nommés, exécuté dans la page :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-layers.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const src = await L.PDFDocument.create(), pg = src.addPage([420, 595]), helv = await src.embedFont(L.StandardFonts.Helvetica);
  pg.drawRectangle({ x: 40, y: 450, width: 80, height: 60, color: L.rgb(0.17, 0.36, 0.84) });
  pg.drawText('Texte du PDF', { x: 40, y: 420, size: 14, font: helv });
  await A.addFiles([new File([await src.save()], 'calques.pdf', { type: 'application/pdf' })], true);
  let v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && !v.shapes; k++) await wait(100);
  const key = (k, o = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...o }));
  const order = () => [...v.g.querySelectorAll(':scope > [data-aid]')].map(n => n.dataset.aid);

  // Flèches sur un bloc du PDF : 1 pt, Maj : 10 pt
  const blue = A.vHit(v, [80, 480]);
  A.setVsel(v, blue);
  key('ArrowRight', { shiftKey: true }); key('ArrowUp');
  const m = S.pages[0].vedits?.[blue.ord]?.m;
  R.nudgePdf = !!m && m[4] === 10 && m[5] === 1;
  key('z', { ctrlKey: true }); key('z', { ctrlKey: true });
  R.nudgeUndo = !S.pages[0].vedits;
  await wait(300);

  // Ordre d'empilement : trois formes qui se chevauchent
  const p = S.pages[0], sq = (id, x, fill) => ({ id, type: 'shape', kind: 'rect', x, y: 200, w: 100, h: 100, r: 0, stroke: '', fill, width: 0 });
  p.annots.push(sq('a', 100, '#ff0000'), sq('b', 150, '#00ff00'), sq('c', 200, '#0000ff'));
  A.selectMany(p.id, ['a']);
  key('ArrowUp', { ctrlKey: true });
  R.forward = order().join('') === 'bac' || order().join('');
  key('ArrowUp', { ctrlKey: true, shiftKey: true });
  R.front = order().join('') === 'bca' || order().join('');
  key('ArrowDown', { ctrlKey: true, shiftKey: true });
  R.back = order().join('') === 'abc' || order().join('');
  // Un groupe garde son ordre interne
  A.selectMany(p.id, ['a', 'b']); key('g', { ctrlKey: true });
  key('ArrowUp', { ctrlKey: true, shiftKey: true });
  R.groupFront = order().join('') === 'cab' || order().join('');
  key('z', { ctrlKey: true });
  R.undoRestack = order().join('') === 'abc' || order().join('');

  // Calques : un nouveau calque passe au-dessus, les nouveaux ajouts y vont
  A.addLayer();
  const L2 = S.layers[1];
  R.newLayer = S.layers.length === 2 && S.curLayer === L2.id && L2.name === 'Calque 2';
  const q = S.pages[0];
  q.annots.unshift({ id: 'd', type: 'text', x: 120, y: 250, r: 0, text: 'Dessus', size: 18, font: 'Helvetica', color: '#000000' });   // en tête de liste…
  A.V.get(q.id).p = q; v = A.V.get(q.id); A.selectMany(q.id, ['d']);
  R.adopted = q.annots[0].layer === L2.id && order()[order().length - 1] === 'd' || order().join('');   // … mais dessiné au-dessus
  // Placer « c » sur le calque 2 depuis le calque 1
  A.selectMany(q.id, ['c']); A.moveToLayer(L2.id);
  R.moveToLayer = q.annots.find(a => a.id === 'c').layer === L2.id;
  // Masquer le calque 2 : ni affiché, ni dessiné dans le PDF, mais gardé dans le fichier
  A.toggleLayer(L2.id, 'hidden');
  R.hidden = !v.g.querySelector('[data-aid="d"]') && !v.g.querySelector('[data-aid="c"]') && !!v.g.querySelector('[data-aid="a"]');
  // Verrouiller le calque 1 : ses éléments ne se cliquent plus
  const L1 = S.layers[0];
  A.toggleLayer(L1.id, 'locked');
  const na = v.g.querySelector('[data-aid="a"]');
  R.lockedLayer = na.classList.contains('locked') && getComputedStyle(na).pointerEvents === 'none';
  A.selectAll(); R.selectAllSkips = !S.sel;
  // Verrouiller le contenu du PDF
  A.toggleLayer('pdf');
  R.pdfLocked = A.vHit(v, [80, 480]) === null;
  A.toggleLayer('pdf');
  R.pdfUnlocked = !!A.vHit(v, [80, 480]);
  // Panneau Calques
  document.querySelector('[data-pane="layers"]').click(); await wait(50);
  const rows = [...document.querySelectorAll('#layers .layer-row')].map(r => r.querySelector('.lyr-name').textContent);
  R.panel = rows.join(' | ') === 'Calque 2 | Calque 1 | Contenu du PDF' || rows.join(' | ');

  // Enregistrer puis rouvrir : calques, calque de chaque élément, ordre, élément masqué gardé
  A.setSel(null);
  const { bytes } = await A.producePdf(S.pages);
  const pdf = await A.openPdfjs(bytes), txt = (await (await pdf.getPage(1)).getTextContent()).items.map(i => i.str).join(' ');
  pdf.loadingTask.destroy();
  R.hiddenNotPrinted = !txt.includes('Dessus') && txt.includes('Texte du PDF');
  S.dirty = false;
  await A.addFiles([new File([bytes], 'calques-rouvert.pdf', { type: 'application/pdf' })], true);
  await wait(300);
  const back = S.pages[0].annots;
  R.reopenLayers = S.layers.map(l => `${l.name}${l.hidden ? ' (masqué)' : ''}${l.locked ? ' (verrouillé)' : ''}`).join(', ');
  R.reopenLayersOk = S.layers.length === 2 && S.layers[1].hidden && S.layers[0].locked;
  R.reopenHiddenKept = back.some(a => a.id && a.type === 'text' && a.text === 'Dessus' && a.layer === S.layers[1].id);
  R.reopenOrder = back.filter(a => a.type === 'shape').map(a => a.fill).join(' ') === '#ff0000 #00ff00 #0000ff' || back.map(a => a.fill).join(' ');
  // Supprimer le calque 2 : ses éléments rejoignent le calque 1
  S.curLayer = S.layers[1].id;
  A.deleteLayer(S.layers[1].id);
  R.deleteLayer = S.layers.length === 1 && S.pages[0].annots.every(a => a.layer === S.layers[0].id);
  key('z', { ctrlKey: true });
  R.undoDeleteLayer = S.layers.length === 2;
  R.sanitize = AtelierLayer.layerList({ layers: [{ id: '<x>', name: 'a' }] }) === null && AtelierLayer.layerList({ layers: [{ id: 'ab1', name: 'x'.repeat(100) }] })?.layers[0].name === 'Calque';
  S.dirty = false;
  return R;
})()
