// Ouvre chaque boîte de dialogue et la referme : détecte les erreurs de construction des formulaires.
// La boîte « Analyser et nettoyer » reste ouverte pour la capture d'écran.
(async () => {
  const A = window.__atelier, R = {}, errors = [];
  window.addEventListener('error', e => errors.push(e.message));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason?.message || e.reason)));
  await A.addFiles([await A.sampleFile()], true);
  const tick = ms => new Promise(r => setTimeout(r, ms));
  for (const name of ['openHeaderFooter', 'openWatermark', 'openProps', 'openProtect', 'openCompress', 'splitDoc', 'deletePages', 'exportImages', 'openOcr']) {
    const p = A[name]();
    await tick(500);
    const dlg = document.querySelector('#dlg');
    R[name] = dlg.open ? `${document.querySelector('#dlgTitle').textContent} (${dlg.querySelectorAll('#dlgBody input,#dlgBody select').length} champs)` : 'NON OUVERT';
    document.querySelector('#dlgCancel').click();
    await p;
  }
  A.openClean();
  await tick(1500);
  R.openClean = document.querySelector('#dlgTitle').textContent;
  R.errors = errors;
  A.S.dirty = false;
  return R;
})()
