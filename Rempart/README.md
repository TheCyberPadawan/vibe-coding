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

## Sécurité

- Les corrections en administrateur passent par un script **vérifié par empreinte SHA-256** juste avant exécution.
- L'annulation n'accepte que la forme exacte de sauvegarde produite par la correction.
- CSP stricte, « fusibles » Electron, aucune connexion Internet.

## Avertissement

Outil qui **modifie des réglages de sécurité de Windows**. Les corrections sont réversibles et confirmées une par une ; un point de restauration est conseillé avant usage. **Non signé** : SmartScreen avertit au premier lancement. À utiliser sur votre propre machine.

## Licence

[MIT](LICENSE).
