# NetVision

Cartographie du **réseau local** : NetVision découvre les appareils connectés au même réseau et affiche ce que l'on peut savoir d'eux — **sans aucun droit administrateur**.

## Fonctions

- **Scan** du sous-réseau (ping + ARP + sonde de ports) en une dizaine de secondes.
- **Carte radiale** (la box au centre, les appareils autour) et vue en liste.
- Par appareil : IP, adresse MAC, **fabricant** (base OUI intégrée), **type deviné** (box, PC, téléphone, TV, imprimante, caméra, NAS, objet connecté…), ports et services ouverts, temps de réponse.
- **Détection des nouveaux appareils** d'un scan à l'autre, avec notification — utile pour repérer un intrus sur son Wi-Fi.
- Renommer un appareil, l'oublier, ouvrir son interface web, actualisation automatique.

## Installation

Installateur Windows dans les **Releases**, ou compilation depuis les sources.

## Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org) (Windows).

```bash
npm install
npm run oui        # (optionnel) régénère la base des fabricants app/data/oui.json
npm start          # lance l'application
npm run dist       # construit l'installateur Windows dans dist/
```

Tests de sécurité : `node scripts/test-security.js`.

## Sécurité et confidentialité

- **Lecture seule** du réseau (ping, ARP, connexions TCP, lecture du cache ARP) : NetVision ne modifie rien et ne demande jamais les droits administrateur.
- Aucune donnée envoyée : la base des fabricants est **intégrée** (dérivée du fichier `manuf` de Wireshark / IEEE, données publiques).
- La liste de vos appareils reste en local (profil Windows), hors du dépôt. CSP stricte, « fusibles » Electron.
- **Non signé** : SmartScreen avertit au premier lancement.

## Avertissement

À utiliser **uniquement sur votre propre réseau** : scanner un réseau tiers sans autorisation est interdit.

## Licence

[MIT](LICENSE).
