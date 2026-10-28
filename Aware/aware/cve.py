"""Recherche des CVE affectant une version installée, via l'API NVD 2.0 du NIST."""
import base64
import ctypes
import ctypes.wintypes as wt
import json
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

NVD = "https://services.nvd.nist.gov/rest/json"
DATA_DIR = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "Aware")
CACHE_FILE = os.path.join(DATA_DIR, "cache.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
CVE_TTL = 24 * 3600
CPE_TTL = 14 * 24 * 3600

# Correspondances connues identifiant winget -> vendor:product CPE
KNOWN_CPE = {
    "7zip.7zip": "7-zip:7-zip",
    "Mozilla.Firefox": "mozilla:firefox",
    "Mozilla.Firefox.ESR": "mozilla:firefox_esr",
    "Mozilla.Thunderbird": "mozilla:thunderbird",
    "Google.Chrome": "google:chrome",
    "Microsoft.Edge": "microsoft:edge_chromium",
    "Brave.Brave": "brave:brave",
    "VideoLAN.VLC": "videolan:vlc_media_player",
    "Notepad++.Notepad++": "notepad-plus-plus:notepad\\+\\+",
    "Audacity.Audacity": "audacityteam:audacity",
    "Oracle.VirtualBox": "oracle:vm_virtualbox",
    "Docker.DockerDesktop": "docker:desktop",
    "Tailscale.Tailscale": "tailscale:tailscale",
    "Microsoft.VisualStudioCode": "microsoft:visual_studio_code",
    "Git.Git": "git-scm:git",
    "OpenJS.NodeJS": "nodejs:node.js",
    "OpenJS.NodeJS.LTS": "nodejs:node.js",
    "WinSCP.WinSCP": "winscp:winscp",
    "PuTTY.PuTTY": "putty:putty",
    "KeePassXCTeam.KeePassXC": "keepassxc:keepassxc",
    "DominikReichl.KeePass": "keepass:keepass",
    "TheDocumentFoundation.LibreOffice": "libreoffice:libreoffice",
    "GIMP.GIMP": "gimp:gimp",
    "WiresharkFoundation.Wireshark": "wireshark:wireshark",
    "Balena.Etcher": "balena:etcher",
    "OBSProject.OBSStudio": "obsproject:obs_studio",
    "Telegram.TelegramDesktop": "telegram:telegram_desktop",
    "Zoom.Zoom": "zoom:meetings",
    "RARLab.WinRAR": "rarlab:winrar",
    "Adobe.Acrobat.Reader.64-bit": "adobe:acrobat_reader_dc",
    "Adobe.Acrobat.Reader.32-bit": "adobe:acrobat_reader_dc",
    "Opera.Opera": "opera:opera_browser",
    "VMware.WorkstationPlayer": "vmware:workstation_player",
    "Microsoft.PowerShell": "microsoft:powershell",
    "Python.Python.3.13": "python:python",
    "Python.Python.3.12": "python:python",
    "Python.Python.3.11": "python:python",
    "voidtools.Everything": "voidtools:everything",
    "Postman.Postman": "postman:postman",
    "SumatraPDF.SumatraPDF": "sumatrapdfreader_project:sumatrapdf",
    "Foxit.FoxitReader": "foxit:pdf_reader",
    "HandBrake.HandBrake": "handbrake:handbrake",
    "Inkscape.Inkscape": "inkscape:inkscape",
    "BlenderFoundation.Blender": "blender:blender",
    "Nextcloud.NextcloudDesktop": "nextcloud:desktop",
    "FileZilla.FileZilla": "filezilla-project:filezilla_client",
    "TeamViewer.TeamViewer": "teamviewer:teamviewer",
    "AnyDeskSoftwareGmbH.AnyDesk": "anydesk:anydesk",
    "Amazon.AWSCLI": "amazon:aws_command_line_interface",
}

_lock = threading.Lock()
_net_lock = threading.Lock()
_last_call = 0.0


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _save(path, data):
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f)
    os.replace(tmp, path)


_cache = _load(CACHE_FILE, {"cpe": {}, "cve": {}})

IGNORED_FILE = os.path.join(DATA_DIR, "ignored.json")
_IGN_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.+_\-]{0,127}$")


def get_ignored():
    v = _load(IGNORED_FILE, [])
    return [i for i in v if isinstance(i, str) and _IGN_ID.match(i)] if isinstance(v, list) else []


def set_ignored(ids):
    if not isinstance(ids, list):
        raise ValueError("Liste invalide")
    clean = [i for i in ids if isinstance(i, str) and _IGN_ID.match(i)][:1000]
    _save(IGNORED_FILE, clean)
    return clean


# Clé API chiffrée par Windows (DPAPI) : seul ce compte utilisateur, sur ce PC, peut la relire
class _Blob(ctypes.Structure):
    _fields_ = [("cbData", wt.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


_ENTROPY = b"Aware/NVD api key"
API_KEY = re.compile(r"^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$")


def _dpapi(data, protect):
    crypt32, kernel32 = ctypes.windll.crypt32, ctypes.windll.kernel32
    fn = crypt32.CryptProtectData if protect else crypt32.CryptUnprotectData
    fn.argtypes = [ctypes.POINTER(_Blob), ctypes.c_void_p, ctypes.POINTER(_Blob), ctypes.c_void_p, ctypes.c_void_p, wt.DWORD, ctypes.POINTER(_Blob)]
    fn.restype = wt.BOOL
    kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    def blob(b):
        buf = ctypes.create_string_buffer(b, len(b))
        return _Blob(len(b), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char))), buf
    inp, _keep1 = blob(data)
    ent, _keep2 = blob(_ENTROPY)
    out = _Blob()
    if not fn(ctypes.byref(inp), None, ctypes.byref(ent), None, None, 0x1, ctypes.byref(out)):   # 0x1 : aucune fenêtre
        raise OSError(ctypes.GetLastError(), "DPAPI")
    try:
        return ctypes.string_at(out.pbData, out.cbData)
    finally:
        kernel32.LocalFree(ctypes.cast(out.pbData, ctypes.c_void_p))


def get_settings():
    raw = _load(SETTINGS_FILE, {})
    key = ""
    if raw.get("api_key_dpapi"):
        try:
            key = _dpapi(base64.b64decode(raw["api_key_dpapi"]), False).decode("utf-8")
        except (OSError, ValueError):
            key = ""   # fichier copié depuis un autre compte ou altéré : on ignore la clé
    elif raw.get("api_key"):   # ancien format en clair : migré vers DPAPI
        key = str(raw["api_key"]).strip()
        if API_KEY.match(key):
            save_settings({"api_key": key})
    return {"api_key": key if API_KEY.match(key) else ""}


def save_settings(settings):
    key = str((settings or {}).get("api_key", "")).strip()
    if key and not API_KEY.match(key):
        raise ValueError("Clé API invalide : elle doit avoir la forme xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.")
    _save(SETTINGS_FILE, {"api_key_dpapi": base64.b64encode(_dpapi(key.encode("utf-8"), True)).decode("ascii")} if key else {})
    return {"api_key": key}


def _get(path, params):
    """Appel NVD en respectant la limite de débit (5 req/30 s sans clé, 50 avec)."""
    global _last_call
    key = get_settings().get("api_key", "").strip()
    delay = 0.7 if key else 6.5
    url = f"{NVD}/{path}?" + urllib.parse.urlencode(params, safe=":*\\")
    headers = {"User-Agent": "Aware/1.0"}
    if key:
        headers["apiKey"] = key
    for attempt in range(4):
        with _net_lock:
            wait = _last_call + delay - time.time()
            if wait > 0:
                time.sleep(wait)
            _last_call = time.time()
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 500, 502, 503) and attempt < 3:
                time.sleep(8 * (attempt + 1))
                continue
            raise
        except urllib.error.URLError:
            if attempt < 3:
                time.sleep(4)
                continue
            raise


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _clean_name(name):
    name = re.sub(r"\((x64|x86|64-bit|32-bit|64 bits|32 bits|user|machine)\)", "", name, flags=re.I)
    name = re.sub(r"\bv?\d+(\.\d+)+\b", "", name)
    name = re.sub(r"\b(x64|x86|amd64|arm64)\b", "", name, flags=re.I)
    return re.sub(r"\s+", " ", name).strip(" -_")


def _search_cpe(app_id, name):
    clean = _clean_name(name)
    if not clean:
        return None
    data = _get("cpes/2.0", {"keywordSearch": clean, "resultsPerPage": 300})
    counts = {}
    for p in data.get("products", []):
        parts = p["cpe"]["cpeName"].split(":")
        if len(parts) > 4 and parts[2] == "a" and not p["cpe"].get("deprecated"):
            counts[(parts[3], parts[4])] = counts.get((parts[3], parts[4]), 0) + 1
    if not counts:
        return None
    managed = "\\" not in app_id and "." in app_id
    id_parts = app_id.split(".") if managed else []
    id_vendor = _norm(id_parts[0]) if id_parts else ""
    id_product = _norm(id_parts[-1]) if id_parts else ""
    n_name = _norm(clean)
    best, best_score = None, 0
    for (vendor, product), count in counts.items():
        nv, np_ = _norm(vendor), _norm(product)
        score = 0
        if np_ and np_ in (n_name, id_product):
            score += 3
        elif np_ and len(np_) > 3 and (np_ in n_name or n_name in np_):
            score += 1
        if id_vendor and nv and (nv == id_vendor or nv in id_vendor or id_vendor in nv):
            score += 2
        elif nv and nv in n_name:
            score += 1
        score += min(count, 50) / 100
        if score > best_score:
            best, best_score = f"{vendor}:{product}", score
    # sans éditeur fiable (applis hors winget), on exige un nom de produit identique
    return best if best_score >= (4 if managed else 3) else None


def resolve_cpe(app_id, name):
    if app_id in KNOWN_CPE:
        return KNOWN_CPE[app_id]
    with _lock:
        hit = _cache["cpe"].get(app_id)
    if hit and time.time() - hit["t"] < CPE_TTL:
        return hit["v"]
    value = _search_cpe(app_id, name)
    with _lock:
        _cache["cpe"][app_id] = {"v": value, "t": time.time()}
        _save(CACHE_FILE, _cache)
    return value


def _severity(metrics):
    for key in ("cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        for m in metrics.get(key, []):
            d = m.get("cvssData", {})
            sev = d.get("baseSeverity") or m.get("baseSeverity") or ""
            return d.get("baseScore"), sev.upper(), key.replace("cvssMetric", "CVSS ")
    return None, "", ""


def _description(cve):
    descs = cve.get("descriptions", [])
    for lang in ("fr", "en"):
        for d in descs:
            if d.get("lang") == lang:
                return d.get("value", "")
    return descs[0]["value"] if descs else ""


def find_cves(app_id, name, version, force=False):
    version = (version or "").strip()
    if not version or not re.match(r"\d", version):
        return {"cpe": None, "cves": [], "error": "Version inconnue"}
    cpe = resolve_cpe(app_id, name)
    if not cpe:
        return {"cpe": None, "cves": [], "error": "Produit introuvable dans la base NVD"}
    key = f"{cpe}@{version}"
    with _lock:
        hit = _cache["cve"].get(key)
    if hit and not force and time.time() - hit["t"] < CVE_TTL:
        return {"cpe": cpe, "cves": hit["v"], "cached": True}

    cves, start = [], 0
    while True:
        data = _get("cves/2.0", {
            "virtualMatchString": f"cpe:2.3:a:{cpe}",
            "versionStart": version, "versionStartType": "including",
            "versionEnd": version, "versionEndType": "including",
            "startIndex": start, "resultsPerPage": 2000,
        })
        for v in data.get("vulnerabilities", []):
            c = v["cve"]
            if c.get("vulnStatus") == "Rejected":
                continue
            score, sev, vector = _severity(c.get("metrics", {}))
            cves.append({
                "id": c["id"],
                "score": score,
                "severity": sev,
                "vector": vector,
                "published": (c.get("published") or "")[:10],
                "description": _description(c),
                "kev": bool(c.get("cisaExploitAdd")),
            })
        start += data.get("resultsPerPage", 0)
        if not data.get("resultsPerPage") or start >= data.get("totalResults", 0):
            break
    cves.sort(key=lambda c: (c["score"] or 0), reverse=True)
    with _lock:
        _cache["cve"][key] = {"v": cves, "t": time.time()}
        _save(CACHE_FILE, _cache)
    return {"cpe": cpe, "cves": cves}
