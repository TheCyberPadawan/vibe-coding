# Atelier PDF

Éditeur PDF complet, gratuit et **100 % hors ligne** : vos fichiers ne quittent jamais votre ordinateur. Pensé comme une alternative aux fonctions de base d'Adobe Acrobat.

## Fonctions

- **Texte** : ajouter du texte, et modifier un texte existant du PDF.
- **Annotations** : surligner, souligner, barrer, notes, rectangles, ellipses, lignes, flèches, dessin à main levée, tampons (Approuvé, Confidentiel…).
- **Signature** : dessinée ou tapée.
- **Images** et **formulaires** : remplir les champs, et en créer de nouveaux.
- **Caviardage réel** : supprime vraiment le contenu sous la zone (vectoriel, avec repli en image), puis **vérifie** le résultat avant d'enregistrer. Recherche + « tout caviarder ».
- **Liens** vers une page ou une adresse web.
- **Pages** : fusionner, diviser, extraire, insérer, dupliquer, pivoter, recadrer, supprimer.
- **Mise en page** : en-têtes, pieds de page, numéros, filigrane.
- **OCR** (français / anglais, hors ligne) pour rendre un scan cherchable.
- **Recherche** dans le document.
- **Protection par mot de passe** (chiffrement AES-256) et ouverture des PDF protégés.
- **Analyser et nettoyer** : métadonnées, JavaScript, pièces jointes, versions antérieures.
- **Compression**, **comparaison** de deux PDF, **export** images / texte, **impression**.

## Installation

Télécharger l'installateur Windows depuis les **Releases**, ou compiler depuis les sources (ci-dessous).

## Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org) (Windows).

```bash
npm install
npm start          # lance l'application en mode développement
npm run dist       # construit l'installateur Windows dans dist/
```

`npm start` copie d'abord les bibliothèques et polices dans `app/vendor/` (étape `vendor`).

## Confidentialité et sécurité

- Aucun envoi de données : tout le traitement se fait localement, sans connexion Internet.
- Interface isolée, politique de sécurité du contenu (CSP) stricte, « fusibles » Electron.
- **Non signé** : Windows SmartScreen affichera un avertissement au premier lancement (« Informations complémentaires » → « Exécuter quand même »).

## Technique

Electron · [pdf.js](https://github.com/mozilla/pdf.js) · [pdf-lib](https://github.com/Hopding/pdf-lib) · [tesseract.js](https://github.com/naptha/tesseract.js). Chiffrement PDF maison vérifié contre pypdf et qpdf.

## Licence

[MIT](LICENSE).
