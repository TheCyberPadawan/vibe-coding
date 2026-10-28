// Vérifie que correction puis annulation remettent le registre à l'identique, sur une clé de test.
// node scripts/test-undo.js
const { runPS, runStep, regApply, REG_UNDO } = require('../ps');

const KEY = String.raw`HKCU:\Software\RempartTest`;
const read = async () => (await runPS(String.raw`Emit @{ a = (RegVal '${KEY}' 'Existante'); ak = $(try { (Get-Item '${KEY}').GetValueKind('Existante').ToString() } catch { $null }); b = (RegVal '${KEY}' 'Nouvelle'); s = (RegVal '${KEY}' 'Texte') }`)).items[0];

(async () => {
  await runPS(String.raw`New-Item '${KEY}' -Force | Out-Null; New-ItemProperty '${KEY}' -Name Existante -Value 7 -PropertyType QWord -Force | Out-Null; New-ItemProperty '${KEY}' -Name Texte -Value '%TEMP%\x' -PropertyType ExpandString -Force | Out-Null`);
  const start = await read();
  const before = await runStep(regApply([
    { path: KEY, name: 'Existante', value: 1, kind: 'DWord' },
    { path: KEY, name: 'Nouvelle', value: 'Warn', kind: 'String' },
    { path: KEY, name: 'Texte', value: 'remplacé', kind: 'String' },
  ]));
  const fixed = await read();
  await runStep(REG_UNDO, JSON.parse(JSON.stringify(before)));   // même aller-retour JSON que le fichier de sauvegarde
  const back = await read();
  await runPS(String.raw`Remove-Item '${KEY}' -Recurse -Force`);

  console.log('départ   ', start);
  console.log('corrigé  ', fixed);
  console.log('annulé   ', back);
  const ok = JSON.stringify(start) === JSON.stringify(back) && fixed.a === 1 && fixed.b === 'Warn' && fixed.s === 'remplacé';
  console.log(ok ? 'OK : état d\'origine rétabli à l\'identique' : 'ÉCHEC');
  process.exit(ok ? 0 : 1);
})();
