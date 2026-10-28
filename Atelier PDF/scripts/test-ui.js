// Scène de démonstration pour une capture d'écran de l'éditeur (mode SMOKE + ATELIER_SMOKE_SHOT)
(async () => {
  const A = window.__atelier, { S } = A, id = () => Math.random().toString(36).slice(2);
  await A.addFiles([await A.sampleFile()], true);
  const p = S.pages[0];
  p.annots.push(
    { id: id(), type: 'shape', kind: 'rect', x: 50, y: 422, w: 300, h: 76, r: 0, stroke: '#d0312d', fill: '', width: 2 },
    { id: id(), type: 'line', x1: 420, y1: 440, x2: 360, y2: 470, arrow: true, stroke: '#d0312d', width: 2 },
    { id: id(), type: 'rect', kind: 'underline', x: 56, y: 737, w: 285, h: 27, r: 0, color: '#1f8a4c' },
    { id: id(), type: 'rect', kind: 'strike', x: 56, y: 696, w: 300, h: 13, r: 0, color: '#d0312d' },
    { id: id(), type: 'field', kind: 'text', name: 'Ville', x: 92, y: 246, w: 188, h: 18, r: 0 },
    { id: id(), type: 'note', x: 440, y: 470, text: 'Vérifier les tarifs 2026 avec le bureau.', author: 'Camille', date: new Date().toISOString(), color: '#ffd84d' },
  );
  const st = A.makeStamp({ text: 'APPROUVÉ', color: '#1f8a4c', date: true });
  p.annots.push({ id: id(), type: 'image', x: 380, y: 140, w: st.w, h: st.h, r: 0, src: st.src });
  S.decor = { hf: { fc: 'Page {n} sur {N}', size: 9, color: '#555555', margin: 8, from: 1, to: 0, start: 1 }, wm: { text: 'BROUILLON', size: 70, color: '#c62828', opacity: 0.15, angle: 45 } };
  await A.rebuild();
  document.querySelector('#btnFind').click();
  document.querySelector('#findInput').value = 'parcelle';
  await A.runFind();
  A.setTool('rect');
  await new Promise(r => setTimeout(r, 1500));
  document.querySelector('#workspace').scrollTop = 380;
  await new Promise(r => setTimeout(r, 5000));
  S.dirty = false;
  return { hits: S.find.n };
})()
