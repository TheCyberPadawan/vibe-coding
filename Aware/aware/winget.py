"""Interaction avec winget, sans fenêtre console."""
import ctypes
import os
import re
import subprocess
import sys

CREATE_NO_WINDOW = 0x08000000
PACKAGE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.+_\-]{0,127}$")


def _winget_path():
    """Chemin complet de winget.

    Lancé par son seul nom, Windows chercherait d'abord dans le dossier d'Aware et dans le dossier courant :
    un faux winget.exe posé à côté d'Aware.exe (par exemple dans Téléchargements) serait exécuté à sa place.
    """
    exe_dir = os.path.dirname(os.path.abspath(sys.executable)).lower()
    cwd = os.getcwd().lower()
    candidates = []
    local = os.environ.get("LOCALAPPDATA")
    if local:
        candidates.append(os.path.join(local, "Microsoft", "WindowsApps", "winget.exe"))
    for d in os.environ.get("PATH", "").split(os.pathsep):
        d = d.strip().strip('"')
        if d and os.path.isabs(d):
            candidates.append(os.path.join(d, "winget.exe"))
    for c in candidates:
        if os.path.dirname(c).lower() in (exe_dir, cwd):
            continue
        if os.path.isfile(c):
            return c
    raise RuntimeError("winget est introuvable : installez « Programme d'installation d'application » depuis le Microsoft Store.")


def _run(args, timeout=1800):
    proc = subprocess.run(
        [_winget_path(), *args],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        creationflags=CREATE_NO_WINDOW,
        timeout=timeout,
    )
    raw = proc.stdout
    for enc in ("utf-8", "cp850", "mbcs"):
        try:
            text = raw.decode(enc)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    else:
        text = raw.decode("utf-8", errors="replace")
    return proc.returncode, text


def _clean_lines(text):
    # winget écrit un indicateur de progression avec des \r : on garde la dernière partie de chaque ligne
    return [line.rstrip("\r").split("\r")[-1].rstrip() for line in text.split("\n")]


def _parse_tables(text):
    lines = _clean_lines(text)
    rows = []
    for i, line in enumerate(lines):
        if i == 0 or not re.fullmatch(r"-{10,}", line.strip()):
            continue
        header = lines[i - 1]
        starts = [m.start() for m in re.finditer(r"\S+", header)]
        if len(starts) < 3:
            continue
        for data in lines[i + 1:]:
            if not data.strip() or len(data) < starts[1]:
                break
            cols = []
            for k, s in enumerate(starts):
                e = starts[k + 1] if k + 1 < len(starts) else None
                cols.append(data[s:e].strip())
            rows.append(cols)
    return rows


def _version(v):
    return re.sub(r"^[<>]\s*", "", v or "").strip()


def list_packages():
    code, text = _run(["list", "--accept-source-agreements", "--disable-interactivity"], timeout=300)
    apps = {}
    for cols in _parse_tables(text):
        cols += [""] * (5 - len(cols))
        name, pid, version, available, source = cols[:5]
        if not pid:
            continue
        # quand la colonne « Disponible » est absente, la source glisse en 4e position
        if available in ("winget", "msstore") and not source:
            available, source = "", available
        apps[pid] = {
            "name": name.replace("…", "").strip(),
            "id": pid,
            "version": _version(version),
            "available": _version(available),
            "source": source,
            "managed": bool(source),
        }
    if not apps and code != 0:
        raise RuntimeError(text.strip()[-400:] or f"winget a échoué (code {code})")
    return sorted(apps.values(), key=lambda a: a["name"].lower())


# Traduction des échecs de winget en une catégorie et un conseil clair. On se fie surtout au message
# (deux causes différentes partagent le même code, ex. 0x8A15002B pour « déjà à jour » et « ne s'applique pas »).
def _classify(ucode, text):
    t = (text or "").lower()
    has = lambda *p: any(re.search(x, t) for x in p)
    if ucode == 0x80073D28 or has(r"administrator privileges", r"privil[eè]ges? d.?administrateur", r"droits d.?administrateur", r"0x80073d28"):
        return "admin", "Cette mise à jour demande les droits administrateur."
    if has(r"ne s.?applique pas", r"does not apply to your system"):
        return "notapplicable", "winget a une version plus récente, mais elle ne correspond pas à votre installation (architecture ou édition différente). Mettez à jour depuis le site officiel de l'éditeur."
    if has(r"m[eé]thode fournie par l.?[eé]diteur", r"method provided by the publisher", r"impossible de mettre [aà] niveau le package [aà] l.?aide de winget", r"unable to upgrade"):
        return "vendor", "winget ne sait pas mettre à jour ce logiciel : utilisez l'outil de l'éditeur. Pour Miniconda ou Anaconda, ouvrez « Anaconda Prompt » depuis le menu Démarrer, puis tapez « conda update --all » (une fenêtre PowerShell normale ne connaît pas la commande conda)."
    if has(r"aucune version.*plus r[eé]cente", r"mise [aà] niveau disponible introuvable", r"no (available|newer|applicable) (upgrade|version)", r"no installed package found"):
        return "noupdate", "Rien à faire côté winget : ce logiciel est déjà à jour, ou il se met à jour tout seul (c'est le cas de Microsoft Edge et des navigateurs)."
    if has(r"en cours d.?ex[eé]cution", r"being used", r"\bin use\b", r"is running"):
        return "inuse", "Le logiciel est en cours d'exécution. Fermez-le complètement (y compris près de l'horloge, dans la zone de notification), puis réessayez."
    m = re.search(r"(?:code de sortie|exit code)\s*:?\s*(\d+)\b", t)
    if m or has(r"[eé]chec du programme d.?installation", r"installer (technique )?failed"):
        n = m.group(1) if m else "?"
        return "installer", ("L'installateur a échoué (code %s). winget l'installe en mode silencieux, ce que certains installateurs (comme celui d'OBS) refusent. Essayez « Réessayer en mode interactif » : la vraie fenêtre d'installation s'affichera et vous cliquerez sur Suivant. Si ça échoue encore, fermez le logiciel, ou mettez-le à jour depuis le site officiel de l'éditeur." % n)
    if has(r"annul", r"cancel"):
        return "cancelled", "Mise à jour annulée."
    return "generic", ""


def _result(code, text):
    lines = [l for l in _clean_lines(text) if l.strip() and not re.fullmatch(r"[\s\-\\|/█▒·]+", l)]
    ucode = code & 0xFFFFFFFF
    cat, advice = _classify(ucode, "\n".join(lines))
    ok = code == 0
    return {"ok": ok, "code": "0x%08X" % ucode, "message": lines[-1] if lines else "",
            "log": "\n".join(lines[-15:]), "category": "" if ok else cat, "advice": "" if ok else advice}


# Lance winget avec les droits administrateur (fenêtre UAC) et attend sa fin. Les arguments sont fixes et
# l'identifiant est validé (PACKAGE_ID, sans espace ni guillemet) : aucune injection possible dans la commande.
def _run_elevated(args):
    exe = _winget_path()
    shell32 = ctypes.WinDLL("shell32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    class SHELLEXECUTEINFO(ctypes.Structure):
        _fields_ = [("cbSize", ctypes.c_ulong), ("fMask", ctypes.c_ulong), ("hwnd", ctypes.c_void_p),
                    ("lpVerb", ctypes.c_wchar_p), ("lpFile", ctypes.c_wchar_p), ("lpParameters", ctypes.c_wchar_p),
                    ("lpDirectory", ctypes.c_wchar_p), ("nShow", ctypes.c_int), ("hInstApp", ctypes.c_void_p),
                    ("lpIDList", ctypes.c_void_p), ("lpClass", ctypes.c_wchar_p), ("hkeyClass", ctypes.c_void_p),
                    ("dwHotKey", ctypes.c_ulong), ("hIconOrMonitor", ctypes.c_void_p), ("hProcess", ctypes.c_void_p)]

    info = SHELLEXECUTEINFO()
    info.cbSize = ctypes.sizeof(info)
    info.fMask = 0x00000040 | 0x00008000      # NOCLOSEPROCESS | NO_CONSOLE
    info.lpVerb = "runas"
    info.lpFile = exe
    info.lpParameters = " ".join(args)
    info.nShow = 0                             # SW_HIDE
    if not shell32.ShellExecuteExW(ctypes.byref(info)):
        err = ctypes.get_last_error()
        if err == 1223:
            return {"ok": False, "code": "0x000004C7", "category": "cancelled", "message": "", "advice": "Autorisation administrateur refusée."}
        raise OSError(f"Lancement en administrateur impossible (erreur {err}).")
    try:
        kernel32.WaitForSingleObject(ctypes.c_void_p(info.hProcess), 1800000)
        code = ctypes.c_ulong()
        kernel32.GetExitCodeProcess(ctypes.c_void_p(info.hProcess), ctypes.byref(code))
        code = code.value
    finally:
        kernel32.CloseHandle(ctypes.c_void_p(info.hProcess))
    if code == 0:
        return {"ok": True, "code": "0x00000000", "message": "", "category": "", "advice": ""}
    cat, advice = _classify(code & 0xFFFFFFFF, "")
    return {"ok": False, "code": "0x%08X" % (code & 0xFFFFFFFF), "message": "", "category": cat or "generic",
            "advice": advice or ("La mise à jour en administrateur a échoué (code 0x%08X)." % (code & 0xFFFFFFFF))}


def _args(verb, package_id, interactive=False):
    # --interactive : l'installateur s'affiche normalement (utile quand le mode silencieux échoue, ex. OBS)
    mode = "--interactive" if interactive else "--silent"
    return [verb, "--id", package_id, "--exact", mode,
            "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity"]


def _do(verb, package_id, elevated=False, interactive=False):
    if not isinstance(package_id, str) or not PACKAGE_ID.match(package_id):
        raise ValueError("Identifiant de paquet invalide")
    args = _args(verb, package_id, interactive)
    return _run_elevated(args) if elevated else _result(*_run(args))


def upgrade(package_id, elevated=False, interactive=False):
    return _do("upgrade", package_id, elevated, interactive)


# Pour un logiciel installé hors winget : réinstaller via winget le met à jour et le place sous sa gestion.
def install(package_id, elevated=False, interactive=False):
    return _do("install", package_id, elevated, interactive)


# Recherche un paquet winget par nom (pour proposer une mise à jour à un logiciel installé autrement).
def search(query):
    if not isinstance(query, str) or not query.strip() or len(query) > 100:
        raise ValueError("Recherche invalide")
    _code, text = _run(["search", "--query", query, "--source", "winget",
                        "--accept-source-agreements", "--disable-interactivity"], timeout=90)
    out = []
    for cols in _parse_tables(text):
        cols += [""] * (3 - len(cols))
        name, pid, version = cols[0], cols[1], cols[2]
        if pid and PACKAGE_ID.match(pid):
            out.append({"name": name.replace("…", "").strip(), "id": pid, "version": _version(version)})
    return out[:12]
