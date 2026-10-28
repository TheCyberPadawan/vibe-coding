# Vigie

Pare-feu **visuel et en direct** pour Windows : voir, programme par programme, qui se connecte à Internet et quels ports sont ouverts, puis **couper ou restreindre** l'accès réseau d'un logiciel — en s'appuyant sur le pare-feu Windows lui-même.

## Fonctions

- Vue en temps réel des connexions et des ports ouverts, regroupés par programme (avec icône, éditeur, signature).
- Pour chaque programme : connexions (Internet / réseau local / VPN), ports en écoute et leur portée, services hébergés.
- Actions : **réseau local seulement** (bloque Internet, garde le LAN et le VPN), **couper l'accès réseau**, **fermer les ports entrants**, **arrêter le programme**, et **rétablir**.
- Alerte quand un programme ouvre un nouveau port sur le réseau. Journal d'activité.

## Droits nécessaires

La **consultation ne demande aucun droit administrateur**. Seule la modification du pare-feu passe par un assistant administrateur, autorisé **une fois par session** (fenêtre UAC).

## Installation

Installateur Windows dans les **Releases**, ou compilation depuis les sources.

## Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org) (Windows).

```bash
npm install
npm start          # lance l'application
npm run dist       # construit l'installateur Windows dans dist/
```

Tests de sécurité (sans modifier le pare-feu) : `node scripts/test-security.js`.

## Sécurité

- L'interface ne modifie rien ; les règles passent par un **assistant administrateur isolé**, joint par un canal nommé protégé par un jeton secret et réservé à votre compte.
- Scripts PowerShell **vérifiés par empreinte SHA-256**, garde-fous contre le blocage de composants vitaux de Windows, règles créées dans le groupe « Vigie » uniquement.
- Les règles utilisent le pare-feu Windows : elles survivent au redémarrage et restent visibles dans Windows. CSP stricte, « fusibles » Electron, aucune connexion Internet.

## Avertissement

Outil de sécurité qui crée des règles de pare-feu sur votre système. **Non signé** : SmartScreen avertit au premier lancement. À utiliser sur votre propre machine.

## Licence

[MIT](LICENSE).
