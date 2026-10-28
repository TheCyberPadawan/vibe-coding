// pdf.js n'existe plus qu'en module : on l'expose sous son nom habituel avant le démarrage de js/app.js
// (les modules et les scripts « defer » s'exécutent dans l'ordre du document).
import * as pdfjsLib from '../vendor/pdfjs/pdf.min.mjs';

window.pdfjsLib = pdfjsLib;
