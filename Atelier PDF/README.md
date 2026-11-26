# Atelier PDF

Éditeur PDF complet, gratuit et **100 % hors ligne** : vos fichiers ne quittent jamais votre ordinateur. Pensé comme une alternative aux fonctions de base d'Adobe Acrobat.

## Fonctions

- **Texte** : ajouter du texte, et modifier un texte existant du PDF. Polices intégrées (Instrument Serif, Manrope, Fira Code) en plus des polices standard, avec gras, italique, interligne et espacement des lettres.
- **Sélection multiple et alignement** : Maj+clic, cadre tiré dans le vide ou Ctrl+A ; sur les ajouts comme sur le contenu d'origine d'un PDF (chaque groupe et chaque ligne de texte comptent pour un bloc), aligner à gauche, au centre, à droite, en haut, au milieu, en bas ou sur la ligne de base des textes, répartir à espaces égaux, centrer sur la page. Repères magnétiques pendant le déplacement (bords, centres, lignes de base, centre de la page, espacements égaux entre blocs voisins signalés par deux rectangles roses ; Ctrl pour les ignorer). Alt + glisser déplace une copie. Les réglages de police s'appliquent à tous les textes sélectionnés.
- **Grouper et verrouiller** : Ctrl+G groupe les éléments sélectionnés (au moins deux) ; le groupe se sélectionne, se déplace et se redimensionne d'un bloc avec sa poignée (tout est mis à l'échelle, texte compris), Ctrl+Maj+G le défait. Ctrl+L verrouille un élément ou un groupe : il ne se sélectionne plus au clic ni au cadre, pour atteindre facilement ce qui l'entoure ; un petit cadenas, le clic droit, Outils › Tout déverrouiller ou Ctrl+Maj+L le libèrent. Cela marche aussi pour les éléments d'origine du PDF (textes, blocs de couleur et tracés d'un PDF fait ailleurs), seuls ou mêlés aux ajouts. Groupes et verrous sont gardés à l'enregistrement.
- **Calques et ordre d'empilement** : onglet Calques pour créer, renommer, réordonner, masquer ou verrouiller des calques nommés ; les nouveaux ajouts vont sur le calque actif, et un calque masqué n'est ni affiché ni imprimé (ses éléments restent dans le fichier). Le contenu d'origine du PDF est toujours dessous et peut être verrouillé d'un clic. Premier plan, Avancer, Reculer, Arrière-plan au clic droit ou avec Ctrl+↑ / Ctrl+↓ (Maj : tout en haut / tout en bas).
- **Déplacer au clavier** : flèches pour 1 pt, Maj+flèches pour 10 pt, sur les ajouts comme sur le contenu d'origine du PDF.
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

Les ajouts réouvrables sont dessinés dans un flux de contenu à part ; leur description (JSON compressé) est rangée dans un flux `/AtelierLayer` relié à la page par la clé `/AtelierPDF`. À l'ouverture, ce flux est retiré de la page et chaque élément est vérifié champ par champ avant d'être réaffiché. Rien de ce qui est caviardé n'entre dans cette description. Tests : `ATELIER_SMOKE=1 ATELIER_SMOKE_JS=scripts/test-layer.js electron .` et `scripts/test-align.js` (sélection multiple, alignement, aimantation). Les liens d'un PDF ouvert sont cliquables avec l'outil Sélection (les adresses web demandent une confirmation) : `scripts/test-links.js`.

Les blocs de couleur du PDF d'origine (formes pleines, y compris dans les sous-dessins) se sélectionnent avec l'outil Sélection : déplacer, redimensionner, changer la couleur, supprimer. Ils sont modifiés à leur place dans le contenu de la page (`js/vector.js`), donc le texte posé dessus reste au-dessus. « Modifier texte » (ou un double-clic sur un texte avec l'outil Sélection) garde la couleur du texte et sa police d'origine : la police complète de Windows si elle est installée, sinon celle intégrée au PDF quand elle contient toutes les lettres. Test : `scripts/test-vector.js`.

Le cadre tiré avec l'outil Sélection prend tout ce qui est entièrement dedans : ajouts, blocs de couleur et textes du PDF d'origine. Le groupe se déplace d'un seul geste, Maj+clic ajoute ou retire un élément, Suppr efface le tout. Un texte du PDF déplacé est réécrit à sa nouvelle place avec sa police et sa couleur d'origine, sans être redessiné ; le reste de sa ligne ne bouge pas. Test : `scripts/test-marquee.js`.

Pendant un déplacement, Alt fait partir une copie (l'original reste en place) et Maj limite le mouvement à l'horizontale ou à la verticale ; les deux se combinent, pour les ajouts comme pour les textes et blocs du PDF. Une copie d'un élément du PDF est réécrite dans la page juste après son original, et se sélectionne, se déplace, se recolore et se supprime comme lui. Test : `scripts/test-copy.js`.

## Licence

[MIT](LICENSE).
