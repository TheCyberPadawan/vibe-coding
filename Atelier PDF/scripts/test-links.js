// Test des liens, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-links.js electron .
// Liens d'un PDF existant (web, page interne, action nommée) rendus cliquables ; liens posés par Atelier non dupliqués.
(async () => {
  const A = window.__atelier, { S, V } = A, L = PDFLib, R = {};
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // PDF « venu d'ailleurs » : 2 pages, un lien web et un lien vers la page 2 sur la page 1
  const src = await L.PDFDocument.create(), font = await src.embedFont(L.StandardFonts.Helvetica);
  const p1 = src.addPage([595, 842]), p2 = src.addPage([595, 842]), ctx = src.context;
  p1.drawText('Site : https://exemple.fr', { x: 60, y: 760, size: 14, font });
  p1.drawText('Voir page 2', { x: 60, y: 720, size: 14, font });
  p2.drawText('Page deux', { x: 60, y: 760, size: 14, font });
  const uri = ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [60, 755, 260, 775], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: L.PDFString.of('https://exemple.fr/') } });
  const go = ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [60, 715, 160, 735], Border: [0, 0, 0], Dest: [p2.ref, 'XYZ', null, null, null] });
  p1.node.set(L.PDFName.of('Annots'), ctx.obj([ctx.register(uri), ctx.register(go)]));
  await A.addFiles([new File([await src.save()], 'liens.pdf', { type: 'application/pdf' })], true);

  // La page 1 est affichée : ses liens doivent être dans le calque des formulaires
  const v = V.get(S.pages[0].id);
  for (let k = 0; k < 40 && !v.forms.querySelector('a.pdflink'); k++) await wait(100);
  const links = [...v.forms.querySelectorAll('a.pdflink')];
  R.linksShown = links.length;
  R.linkTitles = links.map(a => a.title);
  const anns = (await v.pg.getAnnotations({ intent: 'display' })).filter(a => a.subtype === 'Link');
  R.targets = await Promise.all(anns.map(an => A.pdfLinkTarget(v, an)));
  R.nextPage = await A.pdfLinkTarget(v, { action: 'NextPage' });
  // Clic sur le lien interne : doit faire défiler jusqu'à la page 2
  // (fenêtre cachée : le défilement doux n'avance pas, on vérifie la demande de défilement)
  const ws = document.querySelector('#workspace'), scrollTo = ws.scrollTo; let asked = null;
  ws.scrollTo = o => { asked = o.top; };
  links.find(a => !/^https?:/.test(a.title))?.click();
  await wait(300);
  ws.scrollTo = scrollTo;
  R.scrollToPage2 = asked === V.get(S.pages[1].id).wrap.offsetTop - 16;
  // Clic sur le lien web : la confirmation s'affiche, on annule
  links.find(a => /^https?:/.test(a.title))?.click();
  await wait(200);
  R.confirmShown = document.querySelector('#dlg').open && document.querySelector('#dlgTitle').textContent;
  document.querySelector('#dlgCancel').click();
  await wait(100);
  R.confirmClosed = !document.querySelector('#dlg').open;

  // Lien posé avec l'outil Lien : enregistrer, rouvrir, enregistrer → un seul lien natif
  S.pages[1].annots.push({ id: 'lk1', type: 'link', x: 60, y: 500, w: 150, h: 20, r: 0, target: { kind: 'url', url: 'https://atelier.example/' } });
  const count = async bytes => { const pdf = await A.openPdfjs(bytes); const n = (await (await pdf.getPage(2)).getAnnotations()).filter(a => a.subtype === 'Link').length; pdf.loadingTask.destroy(); return n; };
  const once = (await A.producePdf(S.pages, { protect: null })).bytes;
  R.afterSave1 = await count(once);
  await A.addFiles([new File([once], 'liens-1.pdf', { type: 'application/pdf' })], true);
  R.reopenedLinkObjects = S.pages[1].annots.filter(a => a.type === 'link').length;
  const twice = (await A.producePdf(S.pages, { protect: null })).bytes;
  R.afterSave2 = await count(twice);

  S.dirty = false;
  return R;
})()
