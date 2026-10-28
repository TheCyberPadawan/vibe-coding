// Test du caviardage, exécuté dans la page par le mode SMOKE :
//   ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-redact.js ATELIER_SMOKE_OUT=sortie.pdf  electron .
// Caviarde des zones du PDF d'exemple (texte, champ rempli, image), remplace un texte, puis cherche les mots
// supprimés dans le fichier produit, avec pdf.js et en clair / en hexadécimal dans tous les flux décompressés.
(async () => {
  const { S, sampleFile, addFiles, exportPdf, openPdfjs } = window.__atelier;
  const { PDFDocument, StandardFonts, PDFRawStream, PDFName, decodePDFRawStream } = PDFLib;

  // Page 3 : une image JPEG contenant un « numéro secret », et du texte dans une police TrueType intégrée
  const c = document.createElement('canvas'); c.width = 600; c.height = 200;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 200); g.fillStyle = '#000'; g.font = 'bold 60px Arial'; g.fillText('IBAN 7612', 20, 120);
  const extra = await PDFDocument.create(), pg3 = extra.addPage([595.28, 841.89]);
  pg3.drawImage(await extra.embedJpg(c.toDataURL('image/jpeg', 0.95)), { x: 56, y: 500, width: 300, height: 100 });
  pg3.drawText('Code client : ZX-99-confidentiel', { x: 56, y: 450, size: 12, font: await extra.embedFont(StandardFonts.TimesRoman) });
  await addFiles([await sampleFile()], true);
  await addFiles([new File([await extra.save()], 'extra.pdf', { type: 'application/pdf' })], false);

  const [p1, p2, p3] = S.pages;
  const box = (x, y, w, h, more = {}) => ({ id: Math.random().toString(36).slice(2), type: 'rect', kind: 'redact', x, y, w, h, r: 0, color: '#000000', ...more });
  S.form['0:nom'] = 'Durand Secretissime';
  p1.annots.push(
    box(50, 44, 500, 15),                 // pied de page : adresse complète
    box(176, 636, 348, 28),               // champ « Nom » rempli
    box(292, 734, 70, 28),                // « 2026 » du titre seulement (le reste du titre doit rester)
  );
  p2.annots.push(                         // « Modifier texte » : ancien texte remplacé
    box(54, 704, 420, 15, { erase: true, color: '#ffffff' }),
    { id: 'txt', type: 'text', x: 56, y: 708, r: 0, text: 'Article 2. Le local est fermé.', size: 11, font: 'Helvetica', bold: false, color: '#111111' },
  );
  p3.annots.push(box(170, 520, 190, 70), box(130, 446, 200, 18));   // la moitié droite de l'image ; « ZX-99-confidentiel »

  const t0 = performance.now();
  const { bytes, report } = await exportPdf(S.pages);
  const ms = Math.round(performance.now() - t0);

  // 1. Texte lu par pdf.js
  const pdf = await openPdfjs(bytes), text = [];
  for (let n = 1; n <= pdf.numPages; n++) text.push((await (await pdf.getPage(n)).getTextContent()).items.map(i => i.str).join(' '));
  pdf.loadingTask.destroy();
  const all = text.join('\n').replace(/[ \t]+/g, ' ');
  const gone = ['75019', 'quai', 'Loire', 'Association', 'Durand', 'Secretissime', 'samedi', 'outils', 'ZX-99', 'confidentiel'];
  const kept = ['Bulletin', "d'adhésion", 'Merci', 'novembre', 'Article 1.', 'Article 3.', 'Règlement', 'Le local est fermé.', 'Code client'];

  // 2. Recherche brute dans tous les flux décompressés et dans le fichier lui-même
  const doc = await PDFDocument.load(bytes);
  let blob = new TextDecoder('latin1').decode(bytes), redactedImages = 0, images = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (!(o instanceof PDFRawStream)) continue;
    if (o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) { images++; if (o.dict.get(PDFName.of('ARd'))) redactedImages++; }
    try { blob += new TextDecoder('latin1').decode(decodePDFRawStream(o).decode()); } catch {}
  }
  const hex = s => [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2, '0')).join('');
  const lowBlob = blob.toLowerCase();
  const raw = gone.filter(w => blob.includes(w) || lowBlob.includes(hex(w)));

  window.__atelier.setTool('redact'); await window.__atelier.rebuild();
  await new Promise(r => setTimeout(r, 1500));
  S.dirty = false;   // sinon la fermeture demande confirmation

  let b64 = ''; for (let i = 0; i < bytes.length; i += 0x8000) b64 += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {
    ms, size: bytes.length, objects: doc.context.enumerateIndirectObjects().length, images, redactedImages,
    rasterPages: report.raster, elsewhere: Object.fromEntries(report.elsewhere),
    stillReadable: gone.filter(w => all.includes(w)), rawHits: raw,
    missingKept: kept.filter(w => !all.includes(w)),
    page1: text[0].slice(0, 200), page3: text[2],
    pdf: btoa(b64),
  };
})()
