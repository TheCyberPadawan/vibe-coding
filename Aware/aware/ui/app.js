"use strict";

const state = {
  apps: [],
  filter: "updates",
  query: "",
  cves: {},       // id -> { status: "loading" | "done" | "error", cves, cpe, error }
  upgrades: {},   // id -> { status: "running" | "ok" | "err", message, category, advice, code }
  search: {},     // id -> { status: "loading" | "done", results } (recherche winget pour un logiciel hors winget)
  ignored: new Set(),  // mises à jour que l'utilisateur gère lui-même (ex. conda) : masquées et non comptées
  selected: null,
  scanning: false,
};

const $ = (s) => document.querySelector(s);
const SEV_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
const SEV_LABEL = { CRITICAL: "Critique", HIGH: "Élevée", MEDIUM: "Moyenne", LOW: "Faible", UNKNOWN: "Non notée" };
const SEV_COLOR = { CRITICAL: "var(--critical)", HIGH: "var(--high)", MEDIUM: "var(--medium)", LOW: "var(--low)", UNKNOWN: "var(--low)" };
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let api = null;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function hue(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function avatar(app, cls = "") {
  const letter = (app.name.match(/[A-Za-z0-9À-ÿ]/) || ["?"])[0].toUpperCase();
  const h = hue(app.id);
  return `<div class="avatar ${cls}" style="background:linear-gradient(135deg,hsl(${h} 65% 52%),hsl(${(h + 40) % 360} 70% 42%))">${esc(letter)}</div>`;
}

function topSeverity(cves) {
  return cves.reduce((best, c) => {
    const s = c.severity || "UNKNOWN";
    return SEV_ORDER[s] > SEV_ORDER[best] ? s : best;
  }, "UNKNOWN");
}

function isUpdatable(app) {
  return Boolean(app.available) && app.managed;
}

function isIgnored(app) {
  return state.ignored.has(app.id);
}
// Mises à jour proposées à l'écran : winget peut les faire, et l'utilisateur ne les a pas mises de côté
function isProposed(app) {
  return isUpdatable(app) && !isIgnored(app);
}

function isVulnerable(app) {
  const r = state.cves[app.id];
  return r && r.status === "done" && r.cves.length > 0;
}

function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " err" : "");
  el.textContent = message;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), error ? 7000 : 4000);
}

/* ---------- Rendu ---------- */

function cveBadge(app) {
  const r = state.cves[app.id];
  if (!r) return "";
  if (r.status === "loading") return '<span class="badge none"><span class="spinner"></span>Analyse…</span>';
  if (r.status === "error") return `<span class="badge none" title="${esc(r.error)}">Non référencé</span>`;
  if (!r.cves.length) return '<span class="badge safe">Aucune CVE</span>';
  const sev = topSeverity(r.cves);
  return `<span class="badge ${sev}">${r.cves.length} CVE · ${SEV_LABEL[sev]}</span>`;
}

function actionCell(app) {
  const u = state.upgrades[app.id];
  if (u?.status === "running") return '<span class="status-text" style="display:flex;gap:8px;align-items:center"><span class="spinner"></span>Installation…</span>';
  if (u?.status === "ok") return '<span class="status-text ok">✓ À jour</span>';
  if (isIgnored(app)) return app.available ? '<span class="status-text muted">Géré à part</span>' : "";
  if (isUpdatable(app)) {
    const label = u?.status === "err" ? "Réessayer" : "Mettre à jour";
    return `<button class="btn soft" data-upgrade="${esc(app.id)}">${label}</button>`;
  }
  return "";
}

// Bouton « je gère moi-même » (masquer) ou « reproposer », placé à côté des actions du panneau de détails
function ignoreBtn(app) {
  if (isIgnored(app)) return `<button class="btn ghost" data-unignore="${esc(app.id)}">Reproposer cette mise à jour</button>`;
  if (app.available) return `<button class="btn ghost" data-ignore="${esc(app.id)}" title="Masque cette mise à jour quand vous la faites autrement (par exemple conda update)">Je gère moi-même</button>`;
  return "";
}

function visibleApps() {
  const q = state.query.toLowerCase();
  return state.apps.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false;
    if (state.filter === "updates") return isProposed(a) || state.upgrades[a.id]?.status === "ok";
    if (state.filter === "vulnerable") return isVulnerable(a);
    return true;
  }).sort((a, b) => {
    if (state.filter === "all") return 0;
    const sa = isVulnerable(a) ? SEV_ORDER[topSeverity(state.cves[a.id].cves)] + 1 : 0;
    const sb = isVulnerable(b) ? SEV_ORDER[topSeverity(state.cves[b.id].cves)] + 1 : 0;
    return sb - sa;
  });
}

function emptyState() {
  const messages = {
    updates: ["Tout est à jour", "Aucune mise à jour disponible pour vos applications."],
    vulnerable: ["Aucune vulnérabilité détectée", "Aucune CVE connue n'affecte les versions analysées."],
    all: ["Aucune application", "Aucun résultat pour cette recherche."],
  };
  const [title, text] = state.query ? ["Aucun résultat", "Essayez un autre terme de recherche."] : messages[state.filter];
  return `<div class="empty">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h3>${title}</h3><p>${text}</p></div>`;
}

function renderList() {
  const list = $("#list");
  const apps = visibleApps();
  if (!apps.length) {
    list.innerHTML = emptyState();
    return;
  }
  list.innerHTML = apps.map((a) => {
    const versions = a.available
      ? `<div class="versions"><span class="old">${esc(a.version)}</span>${ARROW}<span class="new">${esc(a.available)}</span></div>`
      : `<div class="versions"><span class="old">${esc(a.version || "—")}</span></div>`;
    return `<div class="row" data-id="${esc(a.id)}">
      ${avatar(a)}
      <div class="app-main"><div class="app-name">${esc(a.name)}</div><div class="app-id">${esc(a.id)}</div></div>
      ${versions}
      <div>${cveBadge(a)}</div>
      <div class="cell-action">${actionCell(a)}</div>
    </div>`;
  }).join("");
}

function renderStats() {
  const updatable = state.apps.filter(isProposed);
  const vulnerable = state.apps.filter(isVulnerable);
  const totalCves = vulnerable.reduce((n, a) => n + state.cves[a.id].cves.length, 0);
  $("#stat-total").textContent = state.apps.length;
  $("#stat-updates").textContent = updatable.length;
  $("#stat-vuln").textContent = vulnerable.length;
  $("#stat-cves").textContent = totalCves;
  $("#count-all").textContent = state.apps.length;
  $("#count-updates").textContent = updatable.length;
  $("#count-vulnerable").textContent = vulnerable.length;
  const busy = Object.values(state.upgrades).some((u) => u.status === "running");
  $("#btn-update-all").disabled = busy || !updatable.length;
}

function renderDrawer() {
  const app = state.apps.find((a) => a.id === state.selected);
  if (!app) return;
  $("#d-avatar").outerHTML = avatar(app, "big").replace('class="avatar big"', 'class="avatar big" id="d-avatar"');
  $("#d-name").textContent = app.name;
  $("#d-id").textContent = app.id + (app.source ? ` · ${app.source}` : " · installé hors winget");
  $("#d-versions").innerHTML = `
    <div class="stat"><span class="stat-value">${esc(app.version || "—")}</span><span class="stat-label">Version installée</span></div>
    <div class="stat"><span class="stat-value ${app.available ? "accent" : ""}">${esc(app.available || "—")}</span><span class="stat-label">Disponible</span></div>`;

  const r = state.cves[app.id];
  const checkLabel = r?.status === "done" ? "Revérifier les CVE" : "Vérifier les CVE";
  const checkBtn = r?.status === "loading" ? "" : `<button class="btn ghost" data-check="${esc(app.id)}">${checkLabel}</button>`;
  $("#d-actions").innerHTML = actionCell(app).replace("btn soft", "btn primary") + checkBtn + ignoreBtn(app);
  $("#d-help").innerHTML = updateHelp(app);

  $("#d-cpe").textContent = r?.cpe ? `· cpe:${r.cpe}` : "";
  const box = $("#d-cves");
  if (!r) {
    box.innerHTML = '<p class="muted">Pas encore analysée. Cliquez sur « Vérifier les CVE ».</p>';
  } else if (r.status === "loading") {
    box.innerHTML = '<p class="muted" style="display:flex;gap:8px;align-items:center"><span class="spinner"></span>Interrogation de la base NVD…</p>';
  } else if (r.status === "error") {
    box.innerHTML = `<p class="muted">${esc(r.error)}</p>`;
  } else if (!r.cves.length) {
    box.innerHTML = `<p class="muted">Aucune CVE connue pour la version ${esc(app.version)}.</p>`;
  } else {
    box.innerHTML = r.cves.map((c) => {
      const sev = c.severity || "UNKNOWN";
      return `<div class="cve" style="--sev:${SEV_COLOR[sev]}">
        <div class="cve-head">
          <a href="#" class="cve-id" data-url="https://nvd.nist.gov/vuln/detail/${esc(c.id)}">${esc(c.id)}</a>
          <span class="badge ${sev}">${c.score != null ? Number(c.score).toFixed(1) : "?"} ·${SEV_LABEL[sev]}</span>
          ${c.kev ? '<span class="badge kev" title="Exploitation active connue (catalogue CISA KEV)">Exploitée</span>' : ""}
          <span class="cve-date">${esc(c.published)}</span>
        </div>
        <p>${esc(c.description)}</p>
      </div>`;
    }).join("");
  }
}

function render() {
  renderStats();
  renderList();
  if (state.selected) renderDrawer();
  const pending = Object.values(state.cves).filter((r) => r.status === "loading").length;
  $("#scan-status").innerHTML = state.scanning
    ? `<span class="spinner"></span>Analyse des CVE… (${pending} restante${pending > 1 ? "s" : ""})`
    : "";
}

/* ---------- Actions ---------- */

async function loadApps() {
  $("#btn-refresh").disabled = true;
  $("#list").innerHTML = Array.from({ length: 7 }, () => '<div class="skeleton"></div>').join("");
  $("#scan-status").innerHTML = '<span class="spinner"></span>Lecture des applications installées…';
  const res = await api.list_apps();
  $("#btn-refresh").disabled = false;
  if (!res.ok) {
    $("#scan-status").textContent = "";
    $("#list").innerHTML = `<div class="empty"><h3>Impossible d'interroger winget</h3><p>${esc(res.error)}</p></div>`;
    return;
  }
  state.apps = res.apps;
  state.cves = {};
  state.upgrades = {};
  state.search = {};
  try { const ig = await api.get_ignored(); state.ignored = new Set((ig && ig.ignored) || []); } catch { /* garde l'ensemble courant */ }
  render();
  scanCves();
}

async function checkApp(app, force = false) {
  state.cves[app.id] = { status: "loading" };
  render();
  const res = await api.check_cves(app.id, app.name, app.version, force);
  state.cves[app.id] = res.ok && !res.error
    ? { status: "done", cves: res.cves, cpe: res.cpe }
    : { status: "error", error: res.error || "Erreur inconnue", cpe: res.cpe };
  render();
}

async function scanCves() {
  const targets = state.apps.filter(isProposed);
  if (!targets.length) return;
  state.scanning = true;
  targets.forEach((a) => (state.cves[a.id] = { status: "loading" }));
  render();
  for (const app of targets) {
    if (!state.apps.includes(app)) break; // liste rechargée entre-temps
    await checkApp(app);
  }
  state.scanning = false;
  render();
  const vuln = state.apps.filter(isVulnerable).length;
  if (vuln) toast(`${vuln} application${vuln > 1 ? "s" : ""} avec des vulnérabilités connues`);
}

async function upgradeApp(app, opts = {}) {
  state.upgrades[app.id] = { status: "running" };
  render();
  const res = await api.upgrade(app.id, !!opts.admin, !!opts.interactive);
  if (res.ok) {
    state.upgrades[app.id] = { status: "ok" };
    app.version = app.available;
    app.available = "";
    delete state.cves[app.id];
    toast(`${app.name} a été mis à jour`);
  } else {
    state.upgrades[app.id] = { status: "err", message: res.message, category: res.category, advice: res.advice, code: res.code };
    toast(`${app.name} : ${res.advice || res.message || "échec (code " + res.code + ")"}`, true);
    // Ouvre le panneau de détails pour montrer l'explication et les boutons (interactif, administrateur…)
    if (!opts.bulk) openDrawer(app.id);
  }
  render();
}

async function setIgnore(id, on) {
  if (on) { state.ignored.add(id); delete state.upgrades[id]; } else state.ignored.delete(id);
  render();
  try {
    const res = await api.set_ignored([...state.ignored]);
    if (res && res.ignored) state.ignored = new Set(res.ignored);
  } catch { /* conserve l'état local */ }
  toast(on ? "Mise à jour masquée. Vous la retrouverez dans l'onglet « Toutes »." : "Mise à jour de nouveau proposée.");
  render();
}

async function findWinget(app) {
  state.search[app.id] = { status: "loading" };
  render();
  const res = await api.find_winget(app.name);
  state.search[app.id] = { status: "done", results: (res && res.results) || [] };
  render();
}

async function installWinget(pkgId, forId) {
  const app = state.apps.find((a) => a.id === forId);
  state.upgrades[forId] = { status: "running" };
  render();
  const res = await api.install(pkgId);
  if (res.ok) {
    state.upgrades[forId] = { status: "ok" };
    if (app) { app.available = ""; delete state.cves[forId]; }
    toast(`${app ? app.name : pkgId} installé via winget`);
  } else {
    state.upgrades[forId] = { status: "err", message: res.message, category: res.category, advice: res.advice, code: res.code };
    toast(`${app ? app.name : pkgId} : ${res.advice || res.message || "échec"}`, true);
  }
  render();
}

async function upgradeAll() {
  const targets = state.apps.filter(isProposed);
  for (const app of targets) await upgradeApp(app, { bulk: true });
}

// Bloc d'aide à la mise à jour affiché dans le panneau de détails : conseil après un échec, ou recherche winget
function updateHelp(app) {
  let html = "";
  const u = state.upgrades[app.id];
  if (u && u.status === "err") {
    const advice = u.advice || u.message || `Échec (code ${esc(u.code || "?")}).`;
    const retry = `<button class="btn soft" data-upgrade="${esc(app.id)}">Réessayer</button>`;
    let btn = "";
    if (u.category === "admin") btn = `<button class="btn primary" data-upgrade-admin="${esc(app.id)}">Réessayer en administrateur</button>`;
    else if (u.category === "installer") btn = `<button class="btn primary" data-upgrade-inter="${esc(app.id)}">Réessayer en mode interactif</button>${retry}`;
    else if (!u.category || u.category === "inuse" || u.category === "generic") btn = retry;
    html += `<div class="help err"><p>${esc(advice)}</p><div class="help-btns">${btn}</div></div>`;
  }
  if (!app.source) {
    const s = state.search[app.id];
    html += `<div class="help"><p class="muted">Installé en dehors de winget : Aware ne peut pas le mettre à jour tout seul. Mettez-le à jour depuis le site officiel de l'éditeur, ou cherchez s'il existe dans winget.</p>`;
    if (!s) html += `<button class="btn soft" data-search="${esc(app.id)}">Chercher dans winget</button>`;
    else if (s.status === "loading") html += `<p class="muted" style="display:flex;gap:8px;align-items:center"><span class="spinner"></span>Recherche…</p>`;
    else if (!s.results.length) html += `<p class="muted">Aucun paquet winget correspondant. Passez par le site de l'éditeur.</p>`;
    else html += `<div class="wsearch">${s.results.map((r) => `<div class="wrow"><div><b>${esc(r.name)}</b><br><span class="muted small">${esc(r.id)} · ${esc(r.version)}</span></div><button class="btn soft" data-install="${esc(r.id)}" data-for="${esc(app.id)}">Installer via winget</button></div>`).join("")}<p class="muted small">Vérifiez que l'éditeur correspond avant d'installer : l'installation remplace en général la version actuelle.</p></div>`;
    html += `</div>`;
  }
  return html;
}

function openDrawer(id) {
  state.selected = id;
  renderDrawer();
  $("#drawer").classList.add("open");
  $("#scrim").classList.add("open");
}

function closeDrawer() {
  state.selected = null;
  $("#drawer").classList.remove("open");
  $("#scrim").classList.remove("open");
}

async function openSettings() {
  const s = await api.get_settings();
  $("#api-key").value = s.api_key || "";
  $("#settings").showModal();
}

/* ---------- Événements ---------- */

function bind() {
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    state.filter = tab.dataset.filter;
    renderList();
  }));

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value.trim();
    renderList();
  });

  document.body.addEventListener("click", (e) => {
    const up = e.target.closest("[data-upgrade]");
    if (up) {
      e.stopPropagation();
      const app = state.apps.find((a) => a.id === up.dataset.upgrade);
      if (app) upgradeApp(app);
      return;
    }
    const upAdmin = e.target.closest("[data-upgrade-admin]");
    if (upAdmin) {
      const app = state.apps.find((a) => a.id === upAdmin.dataset.upgradeAdmin);
      if (app) upgradeApp(app, { admin: true });
      return;
    }
    const upInter = e.target.closest("[data-upgrade-inter]");
    if (upInter) {
      const app = state.apps.find((a) => a.id === upInter.dataset.upgradeInter);
      if (app) { toast("Suivez la fenêtre d'installation qui va s'ouvrir."); upgradeApp(app, { interactive: true }); }
      return;
    }
    const search = e.target.closest("[data-search]");
    if (search) {
      const app = state.apps.find((a) => a.id === search.dataset.search);
      if (app) findWinget(app);
      return;
    }
    const install = e.target.closest("[data-install]");
    if (install) {
      installWinget(install.dataset.install, install.dataset.for);
      return;
    }
    const ign = e.target.closest("[data-ignore]");
    if (ign) { setIgnore(ign.dataset.ignore, true); return; }
    const unign = e.target.closest("[data-unignore]");
    if (unign) { setIgnore(unign.dataset.unignore, false); return; }
    const check = e.target.closest("[data-check]");
    if (check) {
      const app = state.apps.find((a) => a.id === check.dataset.check);
      if (app) checkApp(app, true);
      return;
    }
    const link = e.target.closest("[data-url]");
    if (link) {
      e.preventDefault();
      api.open_url(link.dataset.url);
      return;
    }
    const cveCard = e.target.closest(".cve");
    if (cveCard) {
      cveCard.classList.toggle("expanded");
      return;
    }
    const row = e.target.closest(".row");
    if (row) openDrawer(row.dataset.id);
  });

  $("#d-close").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  $("#btn-refresh").addEventListener("click", loadApps);
  $("#btn-update-all").addEventListener("click", upgradeAll);
  $("#btn-settings").addEventListener("click", openSettings);
  $("#nvd-link").addEventListener("click", (e) => {
    e.preventDefault();
    api.open_url("https://nvd.nist.gov/developers/request-an-api-key");
  });
  $("#settings").addEventListener("close", async () => {
    if ($("#settings").returnValue === "save") {
      const res = await api.save_settings({ api_key: $("#api-key").value.trim() });
      if (res && res.ok === false) toast(res.error, true);
      else toast("Paramètres enregistrés");
    }
  });
}

/* ---------- Démarrage ---------- */

function demoApi() {
  // Données fictives pour prévisualiser l'interface hors de l'application
  const apps = [
    { name: "7-Zip 24.06 (x64)", id: "7zip.7zip", version: "24.06", available: "26.05", source: "winget", managed: true },
    { name: "Docker Desktop", id: "Docker.DockerDesktop", version: "4.95.0", available: "4.96.0", source: "winget", managed: true },
    { name: "Tailscale", id: "Tailscale.Tailscale", version: "1.104.1", available: "1.104.2", source: "winget", managed: true },
    { name: "Adobe InDesign 2024", id: "ARP\\Machine\\X86\\IDSN_19_3", version: "19.3", available: "", source: "", managed: false },
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    list_apps: async () => (await wait(600), { ok: true, apps: structuredClone(apps) }),
    check_cves: async (id) => (await wait(500), id === "7zip.7zip"
      ? { ok: true, cpe: "7-zip:7-zip", cves: [
          { id: "CVE-2025-0411", score: 7.0, severity: "HIGH", published: "2025-01-25", description: "Contournement de Mark-of-the-Web.", kev: true },
          { id: "CVE-2024-11477", score: 7.8, severity: "HIGH", published: "2024-11-22", description: "Dépassement d'entier dans la décompression Zstandard.", kev: false }] }
      : { ok: true, cpe: "x:y", cves: [] }),
    upgrade: async (id, admin, interactive) => {
      await wait(1200);
      if (id === "Docker.DockerDesktop" && !admin) return { ok: false, code: "0x80073D28", category: "admin", advice: "Cette mise à jour demande les droits administrateur." };
      if (id === "Tailscale.Tailscale" && !interactive) return { ok: false, code: "0x8A150102", category: "installer", advice: "L'installateur a échoué (code 6). winget l'installe en mode silencieux, ce que certains installateurs (comme celui d'OBS) refusent. Essayez « Réessayer en mode interactif »." };
      return { ok: true };
    },
    find_winget: async () => (await wait(700), { ok: true, results: [{ name: "Adobe Acrobat Reader", id: "Adobe.Acrobat.Reader.64-bit", version: "25.001" }] }),
    install: async () => (await wait(1200), { ok: true }),
    get_settings: async () => ({ api_key: "" }),
    save_settings: async (s) => ({ ok: true, ...s }),
    get_ignored: async () => ({ ignored: [] }),
    set_ignored: async (ids) => ({ ok: true, ignored: ids }),
    open_url: (u) => window.open(u),
  };
}

function start(instance) {
  if (api) return;
  api = instance;
  bind();
  loadApps();
}

window.addEventListener("pywebviewready", () => start(window.pywebview.api));
// Données fictives seulement pour prévisualiser l'interface hors de l'application (index.html?demo) : dans Aware,
// un pont lent ne doit jamais faire afficher de faux résultats (« tout est à jour », CVE inventées)
if (new URLSearchParams(location.search).has("demo")) setTimeout(() => { if (!api) start(demoApi()); }, 300);
else setTimeout(() => {
  if (api) return;
  $("#list").innerHTML = '<div class="empty"><h3>Le moteur d\'Aware ne répond pas</h3><p>Fermez puis relancez l\'application.</p></div>';
}, 15000);
