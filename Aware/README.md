# Aware

Inventaire des logiciels installés sur Windows, **mises à jour via winget**, et recherche des **vulnérabilités connues (CVE)** affectant les versions installées, grâce à la base NVD du NIST.

## Fonctions

- Liste des logiciels installés (via winget), avec la version disponible.
- **Mise à jour en un clic**, avec gestion claire des échecs :
  - réessai **en administrateur** (fenêtre UAC) quand c'est nécessaire ;
  - réessai **en mode interactif** quand l'installateur refuse le mode silencieux ;
  - message adapté quand il faut passer par l'outil de l'éditeur, ou quand c'est déjà à jour ;
  - **« Je gère moi-même »** pour masquer une mise à jour qu'on fait autrement.
- **Recherche winget** pour les logiciels installés en dehors de winget.
- **CVE par logiciel** depuis la base NVD, avec gravité et repère d'exploitation active (CISA KEV).
- Clé API NVD facultative (analyses plus rapides), **chiffrée** et stockée localement.

## Prérequis

- Windows avec **winget** (« Programme d'installation d'application », depuis le Microsoft Store).
- [Python 3](https://www.python.org) pour compiler depuis les sources.

## Lancer depuis les sources

```bash
python -m pip install pywebview
python aware/app.py
```

Aperçu de l'interface seule (données fictives), dans un navigateur : ouvrir `aware/ui/index.html?demo`.

## Construire l'exécutable

Les dépendances de construction sont **figées avec leur empreinte** (`requirements-build.txt`) :

```bash
build.bat
```

Cela installe les dépendances vérifiées, génère l'icône et produit `dist\Aware.exe`, puis affiche son empreinte SHA-256.

Tests de sécurité : `python tests/test_security.py`.

## Sécurité et confidentialité

- La clé API NVD est chiffrée par Windows (**DPAPI**) et stockée dans `%LOCALAPPDATA%\Aware`, **hors du dépôt**.
- winget est appelé par son **chemin complet** (pas de faux `winget.exe` dans le dossier courant), et les mises à jour sont limitées aux logiciels réellement listés.
- Seuls les liens vers `nvd.nist.gov` peuvent être ouverts. CSP stricte, dépendances de build à empreinte figée.
- **Non signé** : Windows SmartScreen avertit au premier lancement.

## Technique

Python · [pywebview](https://pywebview.flowrl.com) · [PyInstaller](https://pyinstaller.org). Données CVE : [API NVD 2.0](https://nvd.nist.gov/developers).

## Licence

[MIT](LICENSE).
