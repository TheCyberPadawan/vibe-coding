// Test de l'OCR par l'interface : page scannée (image seule), dialogue rempli automatiquement,
// puis recherche du texte reconnu et vérification dans le PDF produit.
(async () => {
  const A = window.__atelier, { S } = A, L = PDFLib;
  const c = document.createElement('canvas'); c.width = 1654; c.height = 2339;   // A4 à 200 ppp
  const g = c.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1a1a1a';
  g.font = 'bold 64px Georgia'; g.fillText('Contrat de location', 140, 260);
  g.font = '40px Georgia';
  ['Le locataire s\'engage à payer le loyer', 'avant le cinq de chaque mois.', 'Montant mensuel : 850 euros.'].forEach((t, i) => g.fillText(t, 140, 420 + i * 70));
  const doc = await L.PDFDocument.create();
  doc.addPage([595.28, 841.89]).drawImage(await doc.embedJpg(c.toDataURL('image/jpeg', 0.85)), { x: 0, y: 0, width: 595.28, height: 841.89 });
  await A.addFiles([new File([await doc.save()], 'scan.pdf', { type: 'application/pdf' })], true);

  const run = A.openOcr();
  await new Promise(r => setTimeout(r, 300));
  document.querySelector('#dlg [name=lang]').value = 'fra';
  document.querySelector('#dlgOk').click();
  const t0 = performance.now();
  await run;
  const R = { ms: Math.round(performance.now() - t0), words: S.pages[0].ocr?.length || 0, sample: (S.pages[0].ocr || []).slice(0, 12).map(w => w.str).join(' ') };

  document.querySelector('#findInput').value = 'loyer';
  await A.runFind();
  R.found = S.find.n;
  const hit = S.find.hits[0];
  R.hitBox = hit && [hit.x, hit.y, hit.w, hit.h].map(Math.round).join(',');   // « loyer » est vers x≈300 pt, y≈670 pt

  const { bytes } = await A.producePdf(S.pages);
  const pdf = await A.openPdfjs(bytes);
  R.pdfText = (await (await pdf.getPage(1)).getTextContent()).items.map(i => i.str).join(' ').slice(0, 160);
  pdf.loadingTask.destroy();
  S.dirty = false;
  return R;
})()
