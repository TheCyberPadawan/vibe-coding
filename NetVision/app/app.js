"use strict";
// Interface de NetVision : affichage seulement. Les données viennent toutes du processus principal.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const keyOf = h => h.mac || "ip:" + h.ip;

const ICONS = {
  router: '<rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 17h.01M11 17h3M12 13V8M12 8a4 4 0 0 1 4 4M12 8a4 4 0 0 0-4 4" fill="none"/>',
  self: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  apple: '<path d="M15 2c0 1.5-1.2 3-2.8 3M16.5 13c0-2 1.3-3 1.4-3.1-0.8-1.1-2-1.3-2.4-1.3-1.1-.1-2 .6-2.6.6-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.8 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6 1 0 1.3.6 2.3.6.9 0 1.5-.8 2.1-1.7.4-.6.6-1 .9-1.6-1.9-.7-2.4-3.2-2.4-3.2z"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.2"/>',
  nas: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>',
  cast: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 21a6 6 0 0 0-0-0M4 14a4 4 0 0 1 4 4M4 18a1 1 0 0 1 1 1" fill="none"/>',
  iot: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  linux: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  unknown: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 15v.01M9.5 9.5a2.5 2.5 0 0 1 4 2c0 1.5-2 1.7-2 3"/>',
};
const icon = kind => `<svg viewBox="0 0 24 24">${ICONS[kind] || ICONS.unknown}</svg>`;

const S = { meta: null, hosts: new Map(), view: "map", q: "", sel: null, scanning: false, auto: false, autoTimer: 0 };

/* ---------- Données ---------- */
function upsert(h) { S.hosts.set(keyOf(h), h); if (S.sel === keyOf(h)) renderDetail(); render(); }
function list() {
  const q = S.q.toLowerCase();
  let arr = [...S.hosts.values()];
  if (q) arr = arr.filter(h => [h.ip, h.mac, h.name, h.label, h.vendor, h.type].some(x => String(x || "").toLowerCase().includes(q))
    || (h.services || []).some(s => s.name.toLowerCase().includes(q) || String(s.port) === q));
  const score = h => (h.self ? 0 : h.ip === S.meta?.gateway ? 1 : 2);
  return arr.sort((a, b) => score(a) - score(b) || cmpIp(a.ip, b.ip));
}
const ipn = ip => ip.split(".").reduce((n, x) => n * 256 + (+x || 0), 0);
const cmpIp = (a, b) => ipn(a) - ipn(b);
const dispName = h => h.label || h.name || h.vendor || h.type || "Appareil inconnu";

/* ---------- Rendu ---------- */
function renderInfo() {
  const m = S.meta;
  $("#netinfo").innerHTML = m ? `Réseau <b>${esc(m.network)}/${m.prefix}</b> · box <b>${esc(m.gateway)}</b> · ${esc(m.iface)}` : "";
}
function renderSummary() {
  const all = [...S.hosts.values()], n = all.filter(h => h.isNew).length;
  $("#summary").innerHTML = `<b>${all.length}</b> appareil${all.length > 1 ? "s" : ""}` + (n ? ` · <span class="new">${n} nouveau${n > 1 ? "x" : ""}</span>` : "");
}
function render() {
  renderInfo(); renderSummary();
  const items = list();
  $("#map").hidden = S.view !== "map";
  $("#list").hidden = S.view !== "list";
  const empty = !items.length && !S.scanning;
  $("#empty").hidden = !empty;
  $("#stage").style.display = "";
  if (empty) { $("#empty").innerHTML = S.q ? "<div>Aucun appareil ne correspond à la recherche.</div>" : "<div><h3>Aucun appareil trouvé</h3><p>Vérifiez que vous êtes connecté à un réseau, puis relancez un scan.</p></div>"; $("#map").hidden = $("#list").hidden = true; return; }
  if (S.view === "map") renderMap(items); else renderList(items);
}
function renderList(items) {
  $("#list").innerHTML = items.map(h => {
    const k = keyOf(h), svc = (h.services || []).slice(0, 4);
    return `<div class="device ${h.ip === S.meta?.gateway ? "gw" : ""} ${h.self ? "self" : ""} ${k === S.sel ? "sel" : ""}" data-k="${esc(k)}">
      <div class="disc">${icon(h.kind)}</div>
      <div><div class="name">${esc(dispName(h))}${h.isNew ? '<span class="badge-new">nouveau</span>' : ""}</div>
        <div class="meta">${esc(h.type)}${h.vendor && !h.label && h.vendor !== dispName(h) ? " · " + esc(h.vendor) : ""}</div>
        <div class="ip">${esc(h.ip)}</div>
        <div class="chips">${svc.map(s => `<span class="chip">${esc(s.name)}</span>`).join("")}${(h.services || []).length > 4 ? `<span class="chip">+${h.services.length - 4}</span>` : ""}</div>
      </div></div>`;
  }).join("");
}
function renderMap(items) {
  const map = $("#map"), W = map.clientWidth, H = map.clientHeight;
  if (!W || !H) { requestAnimationFrame(() => render()); return; }
  const cx = W / 2, cy = H / 2;
  const gw = items.find(h => h.ip === S.meta?.gateway);
  const others = items.filter(h => h !== gw);
  const pos = new Map();
  if (gw) pos.set(keyOf(gw), [cx, cy]);
  // Anneaux concentriques autour de la box : 10 appareils max sur le premier, puis +6 par anneau
  let i = 0, ring = 1;
  while (i < others.length) {
    const cap = 8 + ring * 6, n = Math.min(cap, others.length - i), r = Math.min(Math.min(W, H) / 2 - 70, 110 + (ring - 1) * 120);
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 - Math.PI / 2 + (ring % 2 ? 0 : Math.PI / n);
      pos.set(keyOf(others[i + j]), [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    i += n; ring++;
  }
  const edges = others.map(h => { const p = pos.get(keyOf(h)); return p ? `<line class="edge" x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}"/>` : ""; }).join("");
  const nodes = items.map(h => {
    const k = keyOf(h); if (!pos.has(k)) return "";
    const cls = [h.ip === S.meta?.gateway ? "gw" : "", h.self ? "self" : "", h.isNew ? "new" : "", k === S.sel ? "sel" : ""].join(" ");
    return `<div class="node ${cls}" data-k="${esc(k)}">
      <div class="disc">${icon(h.kind)}</div><div class="lbl">${esc(dispName(h))}</div><div class="sub">${esc(h.ip.split(".").pop())}</div></div>`;
  }).join("");
  map.innerHTML = `<svg>${edges}</svg>${nodes}`;
  // Positions posées par JS (la CSP interdit les attributs style= en ligne)
  map.querySelectorAll(".node").forEach(n => { const p = pos.get(n.dataset.k); if (p) { n.style.left = p[0] + "px"; n.style.top = p[1] + "px"; } });
}

function renderDetail() {
  const h = S.sel && S.hosts.get(S.sel), box = $("#detail"), main = document.querySelector("main");
  if (!h) { box.hidden = true; main.classList.remove("open"); return; }
  box.hidden = false; main.classList.add("open");
  const fmt = t => t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const row = (k, v, mono) => `<div class="row"><span class="k">${k}</span><span class="v ${mono ? "mono" : ""}">${v}</span></div>`;
  const hasWeb = (h.ports || []).includes(80), hasWebS = (h.ports || []).includes(443) || (h.ports || []).includes(8443);
  box.innerHTML = `<div class="dhead">
      <div class="disc">${icon(h.kind)}</div>
      <div><div class="dname"><h2 id="dtitle">${esc(dispName(h))}</h2><button id="drename" title="Renommer">✎</button></div>
        <div class="dtype">${esc(h.type)}${h.isNew ? ' · <span class="is-new">nouveau</span>' : ""}</div></div>
      <button class="d-close" id="dclose" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="rows">
      ${row("Adresse IP", esc(h.ip), true)}
      ${row("Adresse MAC", h.mac ? esc(h.mac) : "inconnue", true)}
      ${row("Fabricant", esc(h.vendor || "inconnu"))}
      ${h.random ? row("Confidentialité", 'MAC aléatoire <span class="note">(fréquent sur les téléphones)</span>') : ""}
      ${row("Temps de réponse", h.rtt >= 0 ? h.rtt + " ms" : h.alive === false ? "ne répond pas au ping" : "—")}
      ${row("Première fois vu", fmt(h.firstSeen))}
    </div>
    <h3>Services ouverts (${(h.services || []).length})</h3>
    ${(h.services || []).length ? (h.services || []).map(s => `<div class="svc"><span>${esc(s.name)}</span><span class="port">${s.port}</span></div>`).join("")
      : '<p class="note">Aucun port ouvert détecté. L\'appareil est présent mais n\'expose aucun service courant.</p>'}
    <div class="dactions">
      ${hasWeb ? `<button class="btn" data-open="http">Ouvrir l'interface web</button>` : ""}
      ${hasWebS && !hasWeb ? `<button class="btn" data-open="https">Ouvrir l'interface web (HTTPS)</button>` : ""}
      <button class="btn ghost danger" id="dforget">Oublier cet appareil</button>
    </div>`;
  $("#dclose").onclick = () => { S.sel = null; renderDetail(); render(); };
  $("#drename").onclick = startRename;
  $("#dtitle").ondblclick = startRename;
  $("#dforget").onclick = async () => { await window.netvision.forget(S.sel); const h2 = S.hosts.get(S.sel); if (h2) { h2.isNew = false; h2.label = null; } toast("Appareil oublié."); renderDetail(); render(); };
  box.querySelectorAll("[data-open]").forEach(b => b.onclick = () => window.netvision.openHost(S.sel, b.dataset.open));
}
function startRename() {
  const h = S.hosts.get(S.sel); if (!h) return;
  const t = $("#dtitle");
  t.outerHTML = `<input id="dtitle" value="${esc(h.label || h.name || "")}" placeholder="${esc(dispName(h))}" maxlength="60">`;
  const inp = $("#dtitle"); inp.focus(); inp.select();
  const save = async () => { const v = inp.value.trim(); await window.netvision.rename(S.sel, v); const hh = S.hosts.get(S.sel); if (hh) hh.label = v || null; renderDetail(); render(); };
  inp.onkeydown = e => { if (e.key === "Enter") save(); if (e.key === "Escape") renderDetail(); };
  inp.onblur = save;
}

/* ---------- Scan ---------- */
function setScanning(on) {
  S.scanning = on;
  $("#rescan").disabled = on;
  $("#rescan").querySelector("span").textContent = on ? "Scan en cours…" : "Scanner";
  $("#progress").hidden = !on;
  if (on) { $("#progbar").style.width = "0%"; $("#progtext").textContent = "Préparation…"; }
}
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4000); }

window.netvision.onScanStart(() => { S.hosts.clear(); S.sel = null; setScanning(true); renderDetail(); render(); });
window.netvision.onMeta(m => { S.meta = m; renderInfo(); });
window.netvision.onProgress(p => { const pct = Math.round(p.done / p.total * 100); $("#progbar").style.width = pct + "%"; $("#progtext").textContent = `Analyse ${p.done} / ${p.total} adresses… ${S.hosts.size} appareil${S.hosts.size > 1 ? "s" : ""}`; });
window.netvision.onHost(h => upsert(h));
window.netvision.onScanDone(d => { setScanning(false); render(); if (d.count) toast(`Scan terminé : ${d.count} appareil${d.count > 1 ? "s" : ""} sur le réseau.`); });
window.netvision.onScanError(e => { setScanning(false); render(); toast(e); });

/* ---------- Événements ---------- */
$("#rescan").onclick = () => { if (!S.scanning) window.netvision.scan(); };
$("#autoscan").onchange = e => {
  S.auto = e.target.checked; clearInterval(S.autoTimer);
  if (S.auto) { S.autoTimer = setInterval(() => { if (!S.scanning) window.netvision.scan(); }, 60000); toast("Actualisation automatique toutes les minutes."); }
};
document.querySelectorAll(".views button").forEach(b => b.onclick = () => {
  S.view = b.dataset.view; document.querySelectorAll(".views button").forEach(x => x.setAttribute("aria-selected", x === b)); render();
});
$("#search").oninput = e => { S.q = e.target.value.trim(); render(); };
$("#stage").onclick = e => { const n = e.target.closest("[data-k]"); if (n) { S.sel = n.dataset.k; renderDetail(); render(); } };
window.addEventListener("resize", () => { if (S.view === "map") renderMap(list()); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; renderDetail(); render(); } });

// État courant si la fenêtre est rouverte / au démarrage
window.netvision.snapshot().then(s => {
  if (s.meta) S.meta = s.meta;
  for (const h of s.hosts || []) S.hosts.set(keyOf(h), h);
  setScanning(s.scanning); render();
});
