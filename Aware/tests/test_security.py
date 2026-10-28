"""Tests de sécurité d'Aware (aucune mise à jour n'est lancée) : python -I tests/test_security.py"""
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "aware"))
import app  # noqa: E402
import cve  # noqa: E402
import winget  # noqa: E402

ok = True


def check(name, cond):
    global ok
    ok &= bool(cond)
    print(("OK    " if cond else "ÉCHEC ") + name)


# 1. Un faux winget.exe dans le dossier courant n'est pas utilisé
d = tempfile.mkdtemp()
with open(os.path.join(d, "winget.exe"), "wb") as f:   # leurre : seul le choix du chemin est testé
    f.write(b"MZ")
old = os.getcwd()
os.chdir(d)
try:
    path = winget._winget_path()
    check(f"faux winget.exe du dossier courant ignoré ({path})", os.path.dirname(path).lower() != d.lower())
finally:
    os.chdir(old)
    shutil.rmtree(d, ignore_errors=True)

# 2. Identifiants de paquet
for pid, expected in [("7zip.7zip", True), ("Notepad++.Notepad++", True), ("--override", False), ("a b", False), ("x;calc", False)]:
    check(f"identifiant {pid!r} {'accepté' if expected else 'refusé'}", bool(winget.PACKAGE_ID.match(pid)) == expected)
api = app.Api()
check("mise à jour refusée pour un paquet absent de l'inventaire", api.upgrade("7zip.7zip")["ok"] is False)
# install n'accepte qu'un identifiant issu d'une recherche de cette session
check("install refusé pour un paquet non recherché", api.install("Evil.Backdoor")["ok"] is False)
api._installable.add("VideoLAN.VLC")
r = api.install("Nope.NotSearched")
check("install refuse un autre id que celui recherché", r["ok"] is False and "recherche" in r["message"])

# 3. Liens ouverts : seulement https://nvd.nist.gov
opened = []
app.webbrowser.open = opened.append
for u in ["https://nvd.nist.gov/vuln/detail/CVE-2025-1", "https://evil.example/", "http://nvd.nist.gov/", "https://nvd.nist.gov@evil.example/", "file:///C:/Windows/System32/calc.exe"]:
    api.open_url(u)
check(f"seul le lien NVD est ouvert ({opened})", opened == ["https://nvd.nist.gov/vuln/detail/CVE-2025-1"])

# 4. Clé API chiffrée par DPAPI, jamais en clair sur le disque
key = "12345678-90ab-cdef-1234-567890abcdef"
backup = cve._load(cve.SETTINGS_FILE, None)
try:
    check("clé invalide refusée", api.save_settings({"api_key": "pas une clé"})["ok"] is False)
    api.save_settings({"api_key": key})
    raw = open(cve.SETTINGS_FILE, encoding="utf-8").read()
    check("clé absente en clair du fichier", key not in raw and "api_key_dpapi" in raw)
    check("clé relue après déchiffrement", cve.get_settings()["api_key"] == key)
finally:
    if backup is None:
        os.remove(cve.SETTINGS_FILE)
    else:
        cve._save(cve.SETTINGS_FILE, backup)

# 5. Liste « je gère moi-même » : filtre les entrées invalides, refuse autre chose qu'une liste
ig_backup = cve._load(cve.IGNORED_FILE, None)
try:
    r = api.set_ignored(["Anaconda.Miniconda3", "x;rm -rf", "a b", 123, "OK.Valid_Id"])
    check("ignore ne garde que les identifiants valides", r["ok"] and set(r["ignored"]) == {"Anaconda.Miniconda3", "OK.Valid_Id"})
    check("ignore relu depuis le disque", set(cve.get_ignored()) == {"Anaconda.Miniconda3", "OK.Valid_Id"})
    check("ignore refuse autre chose qu'une liste", api.set_ignored("tout")["ok"] is False)
finally:
    if ig_backup is None:
        if os.path.exists(cve.IGNORED_FILE):
            os.remove(cve.IGNORED_FILE)
    else:
        cve._save(cve.IGNORED_FILE, ig_backup)

print("\nTOUT EST BON" if ok else "\nDES TESTS ONT ÉCHOUÉ")
sys.exit(0 if ok else 1)
