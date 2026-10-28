# Rempart

Audit de **durcissement de sécurité de Windows** : Rempart vérifie 28 points de configuration, **explique** chacun en clair, et propose une **correction réversible** quand c'est possible. Il attribue une note globale et peut exporter un rapport PDF.

## Ce qu'il vérifie

Antivirus (Defender, SmartScreen, protection anti-rançongiciel…), système (mises à jour, UAC, BitLocker, Secure Boot, protection LSA, WDigest, PowerShell 2.0…), réseau (pare-feu, SMBv1, Bureau à distance, LLMNR, ports à l'écoute, partages…) et comptes (compte invité, verrouillage, compte administrateur au quotidien…).

## Points forts

- Chaque correction sauvegarde l'état d'origine et peut être **annulée** à l'identique.
- Confirmation avant toute modification, avec indication si un redémarrage est nécessaire.
- Bouton « point de restauration » avant d'agir.

## Installation

Installateur Windows dans les **Releases**, ou compilation depuis les sources.

## Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org) (Windows).

```bash
npm install
npm start          # lance l'application
npm run dist       # construit l'installateur Windows dans dist/
```

Tests (sans modifier le système) : `node scripts/test-security.js` et `node scripts/test-undo.js`.

## Fabriquer l'installateur Windows

`npm run dist` appelle **electron-builder** : il empaquette l'application avec le runtime Electron et produit un installateur **NSIS** dans le dossier `dist\`.

```bash
npm install
npm run dist
```

Résultat : **`dist\Rempart Setup 1.1.0.exe`**. Ce fichier installe Rempart comme un vrai programme Windows — raccourcis menu Démarrer et bureau, entrée dans « Applications installées », désinstalleur propre. C'est lui qu'on publie dans les **Releases**.

> - Si PowerShell bloque npm (« l'exécution de scripts est désactivée »), utilisez **`npm.cmd`** à la place de `npm`, ou autorisez les scripts : `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
> - Le premier build télécharge Electron (~100 Mo, mis en cache ensuite, donc les builds suivants sont rapides).
> - L'exe n'est **pas signé** : SmartScreen avertit au premier lancement.

## Sécurité

- Les corrections en administrateur passent par un script **vérifié par empreinte SHA-256** juste avant exécution.
- L'annulation n'accepte que la forme exacte de sauvegarde produite par la correction.
- CSP stricte, « fusibles » Electron, aucune connexion Internet.

## Avertissement

Outil qui **modifie des réglages de sécurité de Windows**. Les corrections sont réversibles et confirmées une par une ; un point de restauration est conseillé avant usage. **Non signé** : SmartScreen avertit au premier lancement. À utiliser sur votre propre machine.

## Licence

[MIT](LICENSE).
