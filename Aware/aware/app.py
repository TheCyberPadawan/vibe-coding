"""Aware — inventaire des logiciels, mises à jour winget et CVE."""
import os
import sys
import urllib.parse
import webbrowser

import webview

import cve
import winget

BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
FROZEN = getattr(sys, "frozen", False)
# Seules les pages de la base NVD peuvent être ouvertes depuis l'interface
OPEN_HOSTS = {"nvd.nist.gov"}


def _text(value, limit=300):
    """Les arguments viennent de la page : on n'accepte que des chaînes courtes."""
    if not isinstance(value, str) or len(value) > limit:
        raise ValueError("Paramètre invalide")
    return value


class Api:
    def __init__(self):
        # Identifiants winget du dernier inventaire : seuls ceux-là peuvent être mis à jour
        self._upgradable = set()
        # Identifiants renvoyés par une recherche : seuls ceux-là peuvent être installés
        self._installable = set()

    def list_apps(self):
        try:
            apps = winget.list_packages()
            self._upgradable = {a["id"] for a in apps if a["managed"] and a["available"]}
            self._installable = set()
            return {"ok": True, "apps": apps}
        except Exception as e:  # noqa: BLE001 — remonté tel quel à l'interface
            return {"ok": False, "error": str(e)}

    def check_cves(self, app_id, name, version, force=False):
        try:
            return {"ok": True, **cve.find_cves(_text(app_id), _text(name), _text(version, 100), bool(force))}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e), "cves": []}

    def upgrade(self, app_id, admin=False, interactive=False):
        if app_id not in self._upgradable:
            return {"ok": False, "message": "Ce logiciel ne figure pas parmi les mises à jour proposées par winget.", "category": "", "advice": ""}
        try:
            return winget.upgrade(app_id, elevated=bool(admin), interactive=bool(interactive))
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "message": str(e), "category": "generic", "advice": ""}

    def find_winget(self, name):
        try:
            results = winget.search(_text(name, 120))
            self._installable |= {r["id"] for r in results}
            return {"ok": True, "results": results}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e), "results": []}

    def install(self, pkg_id, admin=False):
        if pkg_id not in self._installable:
            return {"ok": False, "message": "Ce paquet ne fait pas partie des résultats de recherche.", "category": "", "advice": ""}
        try:
            return winget.install(pkg_id, elevated=bool(admin))
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "message": str(e), "category": "generic", "advice": ""}

    def get_ignored(self):
        return {"ignored": cve.get_ignored()}

    def set_ignored(self, ignored):
        try:
            return {"ok": True, "ignored": cve.set_ignored(ignored)}
        except ValueError as e:
            return {"ok": False, "error": str(e), "ignored": cve.get_ignored()}

    def get_settings(self):
        return cve.get_settings()

    def save_settings(self, settings):
        try:
            return {"ok": True, **cve.save_settings(settings)}
        except ValueError as e:
            return {"ok": False, "error": str(e)}

    def open_url(self, url):
        try:
            u = urllib.parse.urlsplit(_text(url, 500))
        except ValueError:
            return
        if u.scheme == "https" and u.hostname in OPEN_HOSTS and not u.username and not u.password:
            webbrowser.open(urllib.parse.urlunsplit(u))


def main():
    webview.create_window(
        "Aware",
        os.path.join(BASE, "ui", "index.html"),
        js_api=Api(),
        width=1180,
        height=760,
        min_size=(820, 560),
        background_color="#0f1115",
    )
    # Outils de développement uniquement depuis les sources, jamais dans l'exécutable distribué
    webview.start(debug="--debug" in sys.argv and not FROZEN, private_mode=True)


if __name__ == "__main__":
    main()
