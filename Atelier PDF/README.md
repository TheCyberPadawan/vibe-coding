# Atelier PDF

Éditeur PDF complet, gratuit et **100 % hors ligne** : vos fichiers ne quittent jamais votre ordinateur. Pensé comme une alternative aux fonctions de base d'Adobe Acrobat.

## Fonctions

- **Texte** : ajouter du texte, et modifier un texte existant du PDF. Polices intégrées (Instrument Serif, Manrope, Fira Code) en plus des polices standard, avec gras, italique, interligne et espacement des lettres.
- **Sélection multiple et alignement** : Maj+clic, cadre tiré dans le vide ou Ctrl+A ; aligner à gauche, au centre, à droite, en haut, au milieu, en bas ou sur la ligne de base des textes, répartir à espaces égaux, centrer sur la page. Repères magnétiques pendant le déplacement (bords, centres, lignes de base, centre de la page, espacements égaux entre blocs voisins signalés par deux rectangles roses ; Ctrl pour les ignorer). Alt + glisser déplace une copie. Les réglages de police s'appliquent à tous les textes sélectionnés.
- **Ajouts toujours modifiables** : textes, images, formes et dessins ajoutés avec Atelier PDF redeviennent modifiables quand on rouvre le fichier (déplacer, réécrire, copier-coller avec Ctrl+C / Ctrl+V, dupliquer avec Ctrl+D, ajuster aux flèches). Ils restent visibles normalement dans tous les autres lecteurs PDF.
- **Annotations** : surligner, souligner, barrer, notes, rectangles (coins arrondis, avec ou sans contour), ellipses, lignes, flèches, dessin à main levée, tampons (Approuvé, Confidentiel…).
- **Signature** : dessinée ou tapée.
- **Images** et **formulaires** : remplacer une image en gardant son cadre, puis choisir le cadrage par double-clic (glisser, molette pour zoomer) ; remplir les champs, et en créer de nouveaux.
- **Caviardage réel** : supprime vraiment le contenu sous la zone (vectoriel, avec repli en image), puis **vérifie** le résultat avant d'enregistrer. Recherche + « tout caviarder ».
- **Liens** vers une page ou une adresse web, en zone libre ou posés sur un texte (le lien suit le texte quand on le déplace).
- **Pages** : fusionner, diviser, extraire, insérer, dupliquer, pivoter, recadrer, supprimer.
- **Mise en page** : en-têtes, pieds de page, numéros, filigrane.
- **OCR** (français / anglais, hors ligne) pour rendre un scan cherchable.
- **Recherche** dans le document.
- **Protection par mot de passe** (chiffrement AES-256) et ouverture des PDF protégés.
- **Analyser et nettoyer** : métadonnées, JavaScript, pièces jointes, versions antérieures.
- **Réduire la taille** (images à 200, 150 ou 96 ppp, compression sans perte des flux, retrait des vignettes et données inutiles), **comparaison** de deux PDF, **export** images / texte, **impression**.

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

Electron · [pdf.js](https://github.com/mozilla/pdf.js) · [pdf-lib](https://github.com/Hopding/pdf-lib) · [fontkit](https://github.com/Hopding/fontkit) · [tesseract.js](https://github.com/naptha/tesseract.js). Chiffrement PDF maison vérifié contre pypdf et qpdf. Polices de `app/fonts` sous licence SIL Open Font License.

Les ajouts réouvrables sont dessinés dans un flux de contenu à part ; leur description (JSON compressé) est rangée dans un flux `/AtelierLayer` relié à la page par la clé `/AtelierPDF`. À l'ouverture, ce flux est retiré de la page et chaque élément est vérifié champ par champ avant d'être réaffiché. Rien de ce qui est caviardé n'entre dans cette description. Tests : `ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-layer.js electron .` et `scripts/test-align.js` (sélection multiple, alignement, aimantation).

## Licence

[MIT](LICENSE).
