// Test du chiffrement : node scripts/test-crypt.js <dossier de travail>
// 1. chiffre un PDF en AES-256 (le dossier reçoit enc-atelier.pdf, vérifié ensuite par pypdf)
// 2. déchiffre les fichiers in-*.pdf produits par pypdf (RC4 40/128, AES-128, AES-256) avec chaque mot de passe
const fs = require('fs');
const path = require('path');
global.window = global;
global.PDFLib = require('pdf-lib');
require('../app/js/pdfcrypt.js');
let pdfjs;

const dir = process.argv[2];
const textOf = async bytes => {
  pdfjs ??= await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  const t = (await (await pdf.getPage(1)).getTextContent()).items.map(i => i.str).join(' ');
  const info = (await pdf.getMetadata()).info;
  await pdf.loadingTask.destroy();
  return { t, title: info.Title };
};

(async () => {
  if (process.argv[3] === 'make') {
    const doc = await PDFLib.PDFDocument.create();
    doc.setTitle('Titre confidentiel é');
    const page = doc.addPage([400, 300]);
    page.drawText('Bonjour secret 42', { x: 40, y: 200, size: 20, font: await doc.embedFont(PDFLib.StandardFonts.Helvetica) });
    const plain = await doc.save();
    fs.writeFileSync(path.join(dir, 'plain.pdf'), plain);
    const enc = await AtelierCrypt.encryptBytes(plain, { user: 'abc', owner: 'propriétaire', perms: { print: false, copy: true } });
    fs.writeFileSync(path.join(dir, 'enc-atelier.pdf'), enc);
    console.log('chiffré :', enc.length, 'octets ; détecté chiffré =', AtelierCrypt.isEncrypted(enc));
    // relecture par notre propre code
    for (const pw of ['abc', 'propriétaire', 'faux']) {
      try { const r = await AtelierCrypt.decrypt(enc, pw); console.log(`  relu avec « ${pw} » :`, JSON.stringify(await textOf(r.bytes)), JSON.stringify(r.info)); }
      catch (e) { console.log(`  relu avec « ${pw} » : refusé (${e.code})`); }
    }
    return;
  }
  for (const f of fs.readdirSync(dir).filter(f => /^in-.*\.pdf$/.test(f))) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(dir, f)));
    for (const pw of ['', 'u1', 'o1', 'mauvais']) {
      try {
        const r = await AtelierCrypt.decrypt(bytes, pw);
        const { t, title } = await textOf(r.bytes);
        console.log(`${f.padEnd(22)} « ${pw} »`.padEnd(36), 'OK', JSON.stringify(t), JSON.stringify(title), r.info && `R${r.info.revision}${r.info.owner ? ' propriétaire' : ''}`);
      } catch (e) { console.log(`${f.padEnd(22)} « ${pw} »`.padEnd(36), 'refusé', e.code || e.message); }
    }
  }
})();
