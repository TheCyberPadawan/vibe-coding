// Modifier un texte espacé lettre par lettre (letter-spacing d'une page web imprimée par Chromium) :
// le texte de remplacement garde les vrais mots et l'espacement d'origine.
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-spaced.js electron .
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib, R = {};
  await A.fontsReady;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // Police composite (Identity-H + ToUnicode), une lettre par opération, espaces dessinées comme des glyphes
  const doc = await L.PDFDocument.create(); doc.registerFontkit(window.fontkit);
  const font = await doc.embedFont(await A.appBytes('fonts/Manrope-Bold.ttf'), { subset: true }), pg = doc.addPage([420, 595]);
  const size = 10, ls = 0.14 * size;
  let x = 40;
  for (const ch of 'CE QUE JE FAIS') { pg.drawText(ch, { x, y: 500, size, font }); x += font.widthOfTextAtSize(ch, size) + ls; }
  await A.addFiles([new File([await doc.save()], 'espace.pdf', { type: 'application/pdf' })], true);
  const v = A.V.get(S.pages[0].id);
  for (let k = 0; k < 50 && !v.shapes; k++) await wait(100);
  R.glyphItems = v.shapes.filter(s => s.kind === 'text').length === 11 || v.shapes.length;   // 11 lettres, pas les 3 espaces
  const items = await A.ensureText(v);
  R.pdfjsReads = items.map(i => i.str).join(' | ');
  await A.replaceTextAt(v, [42, 503], true);
  const t = S.pages[0].annots.find(a => a.type === 'text');
  R.text = t?.text === 'CE QUE JE FAIS' || t?.text;
  R.letterSpacing = Math.abs((t?.ls || 0) - 0.14) < 0.01 || t?.ls;
  S.dirty = false;
  return R;
})()
