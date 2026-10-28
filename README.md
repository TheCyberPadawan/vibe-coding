# vibe-coding

Petits logiciels Windows gratuits et hors ligne, créés par itérations avec Claude. Chaque dossier est un projet autonome, avec son propre README.

| Projet | En deux mots | Droits admin |
|--------|--------------|:---:|
| [**Atelier PDF**](./Atelier%20PDF) | Éditeur PDF complet (texte, caviardage réel, OCR, formulaires, protection…) | non |
| [**Rempart**](./Rempart) | Audit de durcissement de Windows, corrections réversibles | partiel |
| [**Vigie**](./Vigie) | Pare-feu visuel en direct par programme | pour agir |
| [**NetVision**](./NetVision) | Cartographie des appareils du réseau local | non |
| [**Aware**](./Aware) | Inventaire des logiciels, mises à jour winget et CVE | non |

## Points communs

- **Confidentialité** : rien n'est envoyé sur Internet, sauf ce qui est strictement nécessaire (Aware interroge la base publique de vulnérabilités NVD).
- La plupart sont construits avec **Electron** (Aware est en **Python**) ; interface isolée et politique de sécurité du contenu (CSP) stricte.
- Les réglages et données restent dans le profil Windows (`AppData`), **jamais dans le dépôt** (clés et identifiants chiffrés quand il y en a).
- **Non signés** : Windows SmartScreen affiche un avertissement au premier lancement (« Informations complémentaires » → « Exécuter quand même »). Les installateurs sont publiés dans les **Releases**, pas dans l'historique Git.

## Compiler un projet

Prérequis : [Node.js](https://nodejs.org) (Windows). Dans le dossier du projet :

```bash
npm install
npm start
```

## Avertissement

Certains de ces outils touchent à la sécurité ou au réseau (Rempart, Vigie, NetVision) : à utiliser sur votre propre matériel et votre propre réseau. Fournis « en l'état », sans garantie.

## Licence

[MIT](LICENSE) pour l'ensemble.
