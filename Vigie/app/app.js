'use strict';
// Interface de Vigie : affichage seulement. Les actions passent par window.vigie (clé du programme + nom d'action).
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { programs: [], fw: [], helper: false, icons: {}, filter: 'online', q: '', sel: null, details: {}, live: new Map(), prevNet: new Map(), busy: false };

const KIND = { internet: 'Internet', lan: 'Réseau local / VPN', local: 'Cet ordinateur' };
const SCOPE = { all: 'Tout le réseau', lan: 'Une interface', local: 'Cet ordinateur seulement' };
const SCOPE_HINT = { all: "accessible depuis les autres appareils si le pare-feu l'autorise", lan: "accessible par l'adresse de cette interface", local: 'invisible depuis le réseau' };
const GENERIC = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>';
const iconHtml = g => S.icons[g.key] ? `<img src="${esc(S.icons[g.key])}" alt="">` : GENERIC;

function status(g) {
  const c = [];
  if (g.blockedOut) c.push('<span class="chip block">Accès réseau coupé</span>');
  else if (g.lanOnly) c.push('<span class="chip lan">Réseau local seulement</span>');
  if (g.blockedIn) c.push('<span class="chip inb">Entrées bloquées</span>');
  return c.join('');
}
function chips(g) {
  const c = [];
  if (g.internet) c.push(`<span class="chip net">${g.internet} connexion${g.internet > 1 ? 's' : ''} Internet</span>`);
  const ex = g.listen.filter(l => l.scope !== 'local');
  if (ex.length) c.push(`<span class="chip port">Port${ex.length > 1 ? 's' : ''} ${esc([...new Set(ex.map(l => l.port))].slice(0, 4).join(', '))}${ex.length > 4 ? '…' : ''} ouvert${ex.length > 1 ? 's' : ''}</span>`);
  return status(g) + c.join('');
}
const matches = g => {
  if (!S.q) return true;
  const q = S.q.toLowerCase();
  return g.name.toLowerCase().includes(q) || (g.path || '').toLowerCase().includes(q) || g.services.some(s => s.toLowerCase().includes(q))
    || g.conns.some(c => c.remote.includes(q) || (c.host || '').toLowerCase().includes(q) || String(c.rport) === q) || g.listen.some(l => String(l.port) === q);
};
const FILTERS = {
  online: g => g.internet > 0,
  ports: g => g.exposed > 0,
  blocked: g => g.blockedOut || g.lanOnly || g.blockedIn,
  all: () => true,
};

function renderList() {
  const counts = Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, S.programs.filter(f).length]));
  for (const [k, n] of Object.entries(counts)) $('#c-' + k).textContent = n;
  const list = S.programs.filter(FILTERS[S.filter]).filter(matches)
    .sort((a, b) => (b.internet - a.internet) || (b.exposed - a.exposed) || a.name.localeCompare(b.name, 'fr'));
  const now = Date.now();
  $('#list').innerHTML = list.length ? list.map(g => `<div class="prog${g.key === S.sel ? ' sel' : ''}" data-key="${esc(g.key)}" tabindex="0">
      <div class="ico">${iconHtml(g)}</div>
      <div><div class="name">${esc(g.name)}${(S.live.get(g.key) || 0) > now ? '<span class="live" title="Nouvelle connexion"></span>' : ''}</div>
        <div class="sub">${esc(g.path || (g.services.length ? g.services.join(', ') : 'composant du système'))}</div></div>
      <div class="chips">${chips(g)}</div></div>`).join('')
    : `<div class="empty">${S.q ? 'Aucun programme ne correspond à la recherche.' : { online: 'Aucun programme n’est connecté à Internet en ce moment.', ports: 'Aucun port n’est ouvert sur le réseau.', blocked: 'Aucun programme n’est restreint par le pare-feu.', all: 'Aucun programme réseau.' }[S.filter]}</div>`;
}

function renderStats() {
  const online = S.programs.filter(g => g.internet).length, ports = S.programs.reduce((s, g) => s + g.listen.filter(l => l.scope !== 'local').length, 0);
  const rules = S.programs.reduce((s, g) => s + (g.rules || []).filter(r => r.vigie).length, 0);
  $('#stats').innerHTML = `<b>${online}</b> programme${online > 1 ? 's' : ''} sur Internet · <b>${ports}</b> port${ports > 1 ? 's' : ''} ouvert${ports > 1 ? 's' : ''} au réseau · <b>${rules}</b> règle${rules > 1 ? 's' : ''} Vigie`;
  const off = S.fw.filter(p => !p.on).map(p => ({ Domain: 'domaine', Private: 'privé', Public: 'public' }[p.n] || p.n));
  const fw = $('#fwstate');
  fw.className = 'pill' + (off.length ? ' bad' : '');
  fw.textContent = !S.fw.length ? 'Pare-feu : lecture…' : off.length ? `Pare-feu Windows désactivé (profil ${off.join(', ')})` : 'Pare-feu Windows actif';
  const h = $('#helper');
  h.className = 'pill ' + (S.helper ? 'on' : 'dim');
  h.textContent = `Assistant administrateur : ${S.helper ? 'actif' : 'inactif'}`;
}

const ACTS = [
  ['lanOnly', 'Réseau local seulement', 'Bloque Internet, garde le réseau local et le VPN', g => !g.blockedOut && !g.lanOnly],
  ['blockOut', "Couper l'accès réseau", 'Plus aucune connexion sortante', g => !g.blockedOut],
  ['blockIn', 'Fermer ses ports au réseau', 'Bloque les connexions entrantes', g => !g.blockedIn],
  ['unblock', 'Rétablir', 'Retire les règles de Vigie', g => (g.rules || []).some(r => r.vigie)],
  ['kill', 'Arrêter le programme', 'Ferme le programme maintenant', g => g.pids.length > 0],
];
function renderDetail() {
  const box = $('#detail'), g = S.programs.find(x => x.key === S.sel);
  if (!g) { box.innerHTML = '<div class="placeholder">Choisissez un programme pour voir ses connexions et agir.</div>'; return; }
  const d = S.details[g.key];
  const sig = !g.path ? '' : !d ? '<span class="small">Vérification de la signature…</span>'
    : d.status === 'Valid' ? `<span class="sig ok">Signé par ${esc(d.signer || d.company)}</span>` : `<span class="sig bad">Non signé${d.company ? ` · éditeur annoncé : ${esc(d.company)}` : ''}</span>`;
  const conns = [...g.conns].sort((a, b) => (a.kind === 'internet' ? -1 : 1) - (b.kind === 'internet' ? -1 : 1));
  const others = (g.rules || []).filter(r => !r.vigie);
  box.innerHTML = `<div class="dhead"><div class="ico">${iconHtml(g)}</div>
      <div><h2>${esc(d?.description && d.description !== g.name ? `${d.description}` : g.name)}</h2>
        <div class="meta">${esc(g.name)}${d?.version ? ` · version ${esc(d.version)}` : ''}${g.pids.length ? ` · processus ${esc(g.pids.join(', '))}` : g.idle ? ' · inactif' : ''} · ${sig}</div>
        ${g.path ? `<button class="path" data-folder title="Ouvrir l'emplacement">${esc(g.path)}</button>` : ''}
        ${g.services.length ? `<div class="services">Services : ${esc(g.services.join(' · '))}</div>` : ''}</div></div>
    ${g.protected ? `<div class="note">${g.path ? 'Composant vital de Windows : le bloquer couperait des fonctions essentielles (mises à jour, réseau, antivirus). Vigie ne le modifie pas.' : "Composant du noyau sans fichier programme : il ne peut pas être visé par une règle."}</div>` : ''}
    <div class="acts">${ACTS.map(([a, t, sub, ok]) => `<button class="act${a === 'kill' ? ' bad' : ''}" data-act="${a}" ${g.protected || !ok(g) || S.busy ? 'disabled' : ''}><b>${t}</b><span>${sub}</span></button>`).join('')}</div>
    <h3>Connexions (${conns.length})</h3>
    ${conns.length ? `<table><tr><th>Sens</th><th>Destination</th><th>Type</th><th>État</th></tr>${conns.map(c => `<tr><td>${c.dir}</td>
        <td><span class="mono">${esc(c.remote.includes(':') ? `[${c.remote}]` : c.remote)}:${c.rport}</span>${c.host ? `<br><span class="small">${esc(c.host)}</span>` : ''}</td>
        <td class="k-${c.kind}">${KIND[c.kind]}</td><td>${esc(c.state)}</td></tr>`).join('')}</table>` : '<p class="small">Aucune connexion en ce moment.</p>'}
    <h3>Ports en écoute (${g.listen.length})</h3>
    ${g.listen.length ? `<table><tr><th>Port</th><th>Adresse</th><th>Portée</th></tr>${g.listen.map(l => `<tr><td class="mono">${l.proto} ${l.port}</td><td class="mono">${esc(l.addr)}</td>
        <td class="s-${l.scope}">${SCOPE[l.scope]}<br><span class="small">${SCOPE_HINT[l.scope]}</span></td></tr>`).join('')}</table>` : '<p class="small">Aucun port ouvert.</p>'}
    <h3>Règles du pare-feu</h3>
    ${(g.rules || []).length ? (g.rules || []).map(r => `<div class="rule"><span>${esc(r.display)}</span><span class="small">${r.dir === 'Inbound' ? 'entrante' : 'sortante'}${r.vigie ? ' · Vigie' : ' · autre logiciel'}</span></div>`).join('') : '<p class="small">Aucune règle de blocage pour ce programme.</p>'}
    ${others.length ? '<p class="small">Les règles créées par d’autres logiciels ou par Windows ne sont pas modifiées par Vigie.</p>' : ''}`;
  if (g.path && !d) window.vigie.details(g.key).then(x => { S.details[g.key] = x || { status: 'Unknown' }; if (S.sel === g.key) renderDetail(); }).catch(() => {});
}

const CONFIRM = {
  lanOnly: (g) => ['Réseau local seulement', `${g.name} ne pourra plus joindre Internet. Il pourra toujours communiquer avec les appareils de votre réseau (imprimante, NAS…) et votre VPN.`],
  blockOut: (g) => ["Couper l'accès réseau", `Toutes les connexions sortantes de ${g.name} seront bloquées, y compris vers le réseau local. Les connexions déjà ouvertes peuvent durer encore quelques instants.`],
  blockIn: (g) => ['Fermer ses ports au réseau', `Les autres appareils ne pourront plus se connecter à ${g.name}. Les programmes de ce PC pourront toujours l'utiliser.`],
  unblock: (g) => ['Rétablir', `Les règles ajoutées par Vigie pour ${g.name} seront retirées du pare-feu Windows.`],
  kill: (g) => ['Arrêter le programme', `${g.name} sera fermé immédiatement (${g.pids.length} processus). Les données non enregistrées seront perdues.`],
};
async function act(action) {
  const g = S.programs.find(x => x.key === S.sel); if (!g || S.busy) return;
  const [title, text] = CONFIRM[action](g);
  $('#cTitle').textContent = title; $('#cText').textContent = text;
  $('#cUac').textContent = S.helper ? 'La règle est ajoutée au pare-feu Windows et reste active après un redémarrage, jusqu’à ce que vous la retiriez.'
    : 'Windows va demander une autorisation administrateur. Elle vaut pour toute cette session de Vigie.';
  const dlg = $('#confirm'); dlg.returnValue = ''; dlg.showModal();
  await new Promise(r => dlg.addEventListener('close', r, { once: true }));
  if (dlg.returnValue !== 'ok') return;
  S.busy = true; renderDetail(); toast(S.helper ? 'Modification du pare-feu…' : 'Autorisation administrateur demandée…');
  try { toast(await window.vigie.act(g.key, action)); }
  catch (e) { toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), true); }
  finally { S.busy = false; renderDetail(); }
}

let toastT;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, err ? 8000 : 4500); }

function renderJournal(items) {
  const T = { port: ['t-port', 'Port ouvert'], internet: ['t-internet', 'Internet'], action: ['t-action', 'Action'] };
  const A = { lanOnly: 'réseau local seulement', blockOut: 'accès réseau coupé', blockIn: 'entrées bloquées', unblock: 'règles retirées', kill: 'arrêté' };
  $('#jList').innerHTML = [...items].reverse().map(e => `<div class="jitem"><time>${new Date(e.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
    <div><span class="${T[e.type]?.[0] || ''}">${T[e.type]?.[1] || esc(e.type)}</span> · <b>${esc(e.name)}</b> ${e.type === 'action' ? esc(A[e.action] || e.action) : esc(e.detail || '')}</div></div>`).join('') || '<p class="small">Aucune activité enregistrée.</p>';
}

function apply(u) {
  const now = Date.now();
  for (const g of u.programs) { const before = S.prevNet.get(g.key) ?? g.internet; if (g.internet > before) S.live.set(g.key, now + 3000); S.prevNet.set(g.key, g.internet); }
  S.programs = u.programs; S.fw = u.fw || []; S.helper = u.helper;
  renderStats(); renderList();
  if (!document.querySelector('dialog[open]')) renderDetail();
}

window.vigie.onUpdate(apply);
window.vigie.onIcons(m => { Object.assign(S.icons, m); });
window.vigie.onHelper(on => { S.helper = on; renderStats(); });
window.vigie.onJournal(renderJournal);
window.vigie.snapshot().then(u => { if (u) { Object.assign(S.icons, u.icons || {}); apply(u); } });

$('#list').addEventListener('click', e => { const r = e.target.closest('.prog'); if (!r) return; S.sel = r.dataset.key; renderList(); renderDetail(); });
$('#list').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.closest('.prog')?.click(); });
$('#detail').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (b && !b.disabled) return act(b.dataset.act);
  if (e.target.closest('[data-folder]')) window.vigie.showInFolder(S.sel);
});
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  S.filter = b.dataset.f; document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); renderList();
}));
$('#search').addEventListener('input', e => { S.q = e.target.value.trim(); renderList(); });
$('#btnJournal').addEventListener('click', async () => { renderJournal(await window.vigie.journal()); $('#journal').hidden = false; });
$('#jClose').addEventListener('click', () => { $('#journal').hidden = true; });
$('#btnSettings').addEventListener('click', async () => {
  const s = await window.vigie.getSettings();
  $('#sPorts').checked = s.notifyPorts; $('#sInternet').checked = s.notifyInternet; $('#sDns').checked = s.dns;
  const dlg = $('#settings'); dlg.returnValue = ''; dlg.showModal();
  dlg.addEventListener('close', async () => {
    if (dlg.returnValue === 'ok') { await window.vigie.setSettings({ notifyPorts: $('#sPorts').checked, notifyInternet: $('#sInternet').checked, dns: $('#sDns').checked }); toast('Réglages enregistrés.'); }
  }, { once: true });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#journal').hidden) $('#journal').hidden = true; });
