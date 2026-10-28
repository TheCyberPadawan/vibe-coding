const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUS = {
  ko: 'À corriger', warn: 'À surveiller', ok: 'Conformes', unknown: 'Non vérifiés',
};
const ONE = { ko: 'À corriger', warn: 'À surveiller', ok: 'Conforme', unknown: 'Non vérifié', na: 'Sans objet', pending: 'Vérification…' };
const ORDER = { ko: 0, warn: 1, unknown: 2, pending: 3, ok: 4, na: 5 };
const SEVW = { critique: 10, elevee: 6, moyenne: 3, faible: 1 };
const SEVO = { critique: 0, elevee: 1, moyenne: 2, faible: 3 };
const CHEV = '<svg class="chev" viewBox="0 0 20 20"><path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const state = { checks: [], res: {}, backups: new Set(), busy: new Set(), open: new Set(), filter: null, machine: {}, isAdmin: false, scanning: false };

// ───────── Note ─────────
function computeScore() {
  let got = 0, max = 0;
  for (const c of state.checks) {
    const s = state.res[c.id]?.status;
    if (!['ok', 'warn', 'ko'].includes(s)) continue;
    const w = SEVW[c.sev];
    max += w; got += s === 'ok' ? w : s === 'warn' ? w / 2 : 0;
  }
  return max ? Math.round(got / max * 100) : null;
}
const gradeOf = n => n >= 85 ? ['Solide', 'var(--ok)'] : n >= 65 ? ['Correct', 'var(--accent)'] : n >= 40 ? ['Fragile', 'var(--warn)'] : ['À risque', 'var(--ko)'];

function renderHero() {
  const n = computeScore();
  const ring = $('#ring'), C = 2 * Math.PI * 54;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = n == null ? C : C * (1 - n / 100);
  $('#score').textContent = n == null ? '–' : n;
  const done = Object.keys(state.res).length;
  if (state.scanning) {
    $('#grade').textContent = 'Analyse en cours…';
  } else if (n != null) {
    const [label, color] = gradeOf(n);
    $('#grade').textContent = `Niveau de sécurité : ${label}`;
    ring.style.stroke = color;
  }
  const m = state.machine;
  if (m.pc) $('#machine').textContent = `${m.pc} · ${m.os}${m.version ? ` ${m.version}` : ''} (build ${m.build}) · ${state.isAdmin ? 'mode administrateur' : 'mode standard'}`;
  $('#bar').style.width = `${done / state.checks.length * 100}%`;
  $('#progress').classList.toggle('done', !state.scanning);

  const count = s => state.checks.filter(c => state.res[c.id]?.status === s).length;
  $('#counters').innerHTML = Object.entries(STATUS).map(([s, label]) =>
    `<button class="counter" data-f="${s}" aria-pressed="${state.filter === s}"><span class="dot ${s}"></span><b>${count(s)}</b> ${label}</button>`).join('') +
    (state.filter ? '<button class="link" data-f="">Tout afficher</button>' : '');

  const locked = state.checks.filter(c => state.res[c.id]?.status === 'unknown' && /administrateur/.test(state.res[c.id].detail)).length;
  $('#adminBar').hidden = state.isAdmin || !locked || state.scanning;
  $('#adminText').textContent = `Mode standard : ${locked} point${locked > 1 ? 's' : ''} ne peu${locked > 1 ? 'vent' : 't'} pas être vérifié${locked > 1 ? 's' : ''} sans les droits administrateur.`;
}

// ───────── Liste ─────────
function cardHtml(c) {
  const r = state.res[c.id] || { status: state.scanning ? 'pending' : 'unknown', detail: state.scanning ? 'Vérification…' : '' };
  const s = r.status, busy = state.busy.has(c.id), saved = state.backups.has(c.id);
  const btns = [];
  if (saved) btns.push(`<button data-a="undo" ${busy ? 'disabled' : ''}>Annuler la correction</button>`);
  if ((s === 'ko' || s === 'warn') && c.fix && !saved) btns.push(`<button class="primary" data-a="fix" ${busy ? 'disabled' : ''}>${busy ? 'En cours…' : esc(c.fix.label)}</button>`);
  if ((s === 'ko' || s === 'warn') && c.open && !c.fix) btns.push(`<button data-a="open">Ouvrir le réglage</button>`);

  let fixText = '';
  if (c.fix) {
    fixText = `<h4>La correction</h4><p>${esc(c.fix.desc)}</p>` +
      (c.fix.reversible ? '<span class="tag">Réversible en un clic</span>' : c.fix.harmless ? '<span class="tag">Sans risque</span>' : '') +
      (c.fix.restart ? '<span class="tag">Redémarrage nécessaire</span>' : '') +
      (saved ? '<span class="tag saved">État d\'origine sauvegardé</span>' : '');
  } else if (c.manual) {
    fixText = `<h4>Comment corriger</h4><p>${esc(c.manual)}</p>` + (c.open ? '<p><button class="link" data-a="open" style="padding-left:0">Ouvrir le réglage Windows →</button></p>' : '');
  }
  return `<article class="check s-${s}${state.open.has(c.id) ? ' open' : ''}" data-id="${c.id}">
    <div class="row" role="button" tabindex="0" aria-expanded="${state.open.has(c.id)}">
      <span class="dot" title="${ONE[s]}"></span>
      <div><div class="title">${esc(c.title)}</div><div class="detail">${esc(r.detail)}</div></div>
      <span class="sev ${c.sev}">${esc(c.sevLabel)}</span>
      <div class="btns">${btns.join('')}</div>
      ${CHEV}
    </div>
    <div class="more"><h4>Pourquoi c'est important</h4><p>${esc(c.why)}</p>${fixText}</div>
  </article>`;
}

function renderList() {
  const cats = [...new Set(state.checks.map(c => c.cat))];
  const st = c => state.res[c.id]?.status || 'pending';
  const html = cats.map(cat => {
    let list = state.checks.filter(c => c.cat === cat && (!state.filter || st(c) === state.filter));
    if (!list.length) return '';
    if (!state.scanning) list = list.sort((a, b) => ORDER[st(a)] - ORDER[st(b)] || SEVO[a.sev] - SEVO[b.sev]);
    const bad = list.filter(c => st(c) === 'ko').length;
    return `<section class="cat"><h3>${esc(cat)} <span>${bad ? `${bad} à corriger` : ''}</span></h3><div class="list">${list.map(cardHtml).join('')}</div></section>`;
  }).join('');
  $('#cats').innerHTML = html || '<div class="empty">Aucun point dans cette catégorie.</div>';
}
const render = () => { renderHero(); renderList(); };

// ───────── Actions ─────────
let toastTimer;
function toast(msg, err) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = err ? 'err' : ''; }, err ? 7000 : 4000);
}
const cleanErr = e => String(e?.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');

function confirmFix(c) {
  const f = c.fix;
  $('#cTitle').textContent = `${f.label} : ${c.title}`;
  $('#cDesc').textContent = f.desc;
  const li = [];
  li.push(f.reversible ? "L'état actuel est sauvegardé : le bouton « Annuler la correction » le rétablira à l'identique."
    : f.harmless ? 'Opération sans risque, rien à annuler.' : "Cette correction ne peut pas être annulée automatiquement.");
  if (f.restart) li.push('Le changement prendra effet après un redémarrage du PC.');
  if (f.elevate && !state.isAdmin) li.push('Windows va demander votre autorisation administrateur.');
  $('#cList').innerHTML = li.map(x => `<li>${esc(x)}</li>`).join('');
  const dlg = $('#confirm');
  return new Promise(resolve => {
    const done = v => { dlg.close(); $('#cYes').onclick = $('#cNo').onclick = null; resolve(v); };
    $('#cYes').onclick = () => done(true);
    $('#cNo').onclick = () => done(false);
    dlg.onclose = () => resolve(false);
    dlg.showModal();
  });
}

async function act(id, a) {
  const c = state.checks.find(x => x.id === id);
  if (a === 'open') return window.rempart.openSetting(id);
  if (a === 'fix' && !(await confirmFix(c))) return;
  state.busy.add(id); renderList();
  try {
    const r = await window.rempart[a](id);
    if (r.warning) setTimeout(() => toast(r.warning, true), 4200);
    state.res[id] = r.result;
    state.backups = new Set(r.backups);
    const s = r.result?.status;
    if (a === 'fix') toast(s === 'ok' ? `Corrigé : ${c.title}.${c.fix.restart ? ' Redémarrez le PC pour terminer.' : ''}`
      : c.fix.restart ? `Appliqué. Redémarrez le PC pour que « ${c.title} » soit pris en compte.` : `Appliqué, mais le point reste ${ONE[s]?.toLowerCase()} : ${r.result.detail}`);
    else toast(`Réglage d'origine rétabli : ${c.title}.`);
  } catch (e) { toast(cleanErr(e), true); }
  state.busy.delete(id); render();
}

async function scan() {
  state.scanning = true; state.res = {}; $('#btnScan').disabled = $('#btnPdf').disabled = true;
  window.__auditDone = false;
  render();
  try {
    const r = await window.rempart.audit();
    state.machine = r.machine; state.isAdmin = r.isAdmin;
  } catch (e) { toast(`Analyse interrompue : ${cleanErr(e)}`, true); }
  state.scanning = false; $('#btnScan').disabled = $('#btnPdf').disabled = false;
  render();
  window.__auditDone = true;
}

window.rempart.onResult(r => {
  state.res[r.id] = { status: r.status, detail: r.detail };
  render();
});

document.addEventListener('click', e => {
  const f = e.target.closest('[data-f]');
  if (f) { state.filter = f.dataset.f && state.filter !== f.dataset.f ? f.dataset.f : null; return render(); }
  const b = e.target.closest('[data-a]');
  const card = e.target.closest('.check');
  if (b && card) { e.stopPropagation(); return act(card.dataset.id, b.dataset.a); }
  const row = e.target.closest('.row');
  if (row && card) {
    const id = card.dataset.id;
    state.open.has(id) ? state.open.delete(id) : state.open.add(id);
    card.classList.toggle('open'); row.setAttribute('aria-expanded', state.open.has(id));
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('row')) { e.preventDefault(); e.target.click(); }
});

$('#btnScan').onclick = scan;
$('#btnAdmin').onclick = async () => { try { await window.rempart.relaunchAdmin(); } catch (e) { toast(cleanErr(e), true); } };
$('#btnRestore').onclick = async () => {
  const b = $('#btnRestore'); b.disabled = true; b.textContent = 'Création…';
  try {
    const warn = await window.rempart.restorePoint();
    toast(warn ? `Windows n'a pas créé de nouveau point : ${warn}` : 'Point de restauration créé.', !!warn);
  } catch (e) { toast(`Point de restauration impossible : ${cleanErr(e)}. Vérifiez que la protection du système est activée.`, true); }
  b.disabled = false; b.textContent = 'Point de restauration';
};
$('#btnPdf').onclick = async () => {
  try { const p = await window.rempart.exportPdf(reportHtml()); if (p) toast('Rapport enregistré.'); } catch (e) { toast(cleanErr(e), true); }
};

// ───────── Rapport PDF ─────────
function reportHtml() {
  const n = computeScore(), [label, color] = n == null ? ['–', '#666'] : gradeOf(n);
  const col = { ok: '#1f8a4c', ko: '#c8372d', warn: '#b86e00', unknown: '#6b7480', na: '#9aa1a9' };
  const cssColor = color.replace('var(--ok)', '#1f8a4c').replace('var(--accent)', '#2f5bd3').replace('var(--warn)', '#b86e00').replace('var(--ko)', '#c8372d');
  const st = c => state.res[c.id]?.status || 'unknown';
  const m = state.machine, date = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  const cats = [...new Set(state.checks.map(c => c.cat))];
  const rows = cats.map(cat => `<h2>${esc(cat)}</h2><table>${state.checks.filter(c => c.cat === cat)
    .sort((a, b) => ORDER[st(a)] - ORDER[st(b)] || SEVO[a.sev] - SEVO[b.sev])
    .map(c => `<tr><td class="s" style="color:${col[st(c)]}">● ${ONE[st(c)]}</td><td><b>${esc(c.title)}</b><br><span>${esc(state.res[c.id]?.detail)}</span></td><td class="v">${esc(c.sevLabel)}</td></tr>`).join('')}</table>`).join('');
  const todo = state.checks.filter(c => st(c) === 'ko' || st(c) === 'warn').sort((a, b) => SEVO[a.sev] - SEVO[b.sev] || ORDER[st(a)] - ORDER[st(b)]);
  const reco = todo.length ? `<h2>Recommandations, par priorité</h2><ol>${todo.map(c => `<li><b>${esc(c.title)}</b> (${esc(c.sevLabel.toLowerCase())}) : ${esc(c.why)} ${esc(c.fix ? c.fix.desc : c.manual || '')}</li>`).join('')}</ol>` : '';
  const count = s => state.checks.filter(c => st(c) === s).length;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport Rempart</title><style>
    body { font: 11pt/1.45 "Segoe UI", sans-serif; color: #16191d; margin: 0; }
    header { display: flex; align-items: center; gap: 24px; border-bottom: 2px solid #16191d; padding-bottom: 14px; }
    .score { width: 92px; height: 92px; border-radius: 50%; border: 8px solid ${cssColor}; display: grid; place-content: center; text-align: center; font-size: 28pt; font-weight: 700; line-height: 1; }
    .score small { display: block; font-size: 8pt; font-weight: 400; color: #5f6872; }
    h1 { margin: 0; font-size: 20pt; } .sub { color: #5f6872; margin: 2px 0 0; }
    .counts { margin-top: 6px; } .counts span { margin-right: 14px; }
    h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: .05em; margin: 22px 0 6px; color: #3d4550; }
    table { width: 100%; border-collapse: collapse; } td { border-bottom: 1px solid #e3e6ea; padding: 7px 6px; vertical-align: top; }
    td span { color: #5f6872; font-size: 10pt; } td.s { width: 105px; font-weight: 600; font-size: 10pt; white-space: nowrap; } td.v { width: 70px; text-align: right; color: #5f6872; font-size: 10pt; }
    tr, li { page-break-inside: avoid; } ol { padding-left: 20px; } li { margin: 6px 0; }
    footer { margin-top: 26px; color: #8a939c; font-size: 9pt; }
  </style></head><body>
  <header><div class="score">${n ?? '–'}<small>sur 100</small></div>
    <div><h1>Rapport de sécurité : ${esc(label)}</h1>
    <p class="sub">${esc(m.pc)} · ${esc(m.os)} ${esc(m.version)} (build ${esc(m.build)}) · ${date}</p>
    <div class="counts"><span style="color:${col.ko}">● ${count('ko')} à corriger</span><span style="color:${col.warn}">● ${count('warn')} à surveiller</span><span style="color:${col.ok}">● ${count('ok')} conformes</span><span style="color:${col.unknown}">● ${count('unknown')} non vérifiés</span></div></div></header>
  ${reco}${rows}
  <footer>Généré par Rempart${state.isAdmin ? '' : ' en mode standard (certains points nécessitent les droits administrateur)'}. La note pondère chaque point selon sa gravité ; les points non vérifiés ou sans objet n'entrent pas dans le calcul.</footer>
  </body></html>`;
}

(async () => {
  const { checks, backups } = await window.rempart.getChecks();
  state.checks = checks; state.backups = new Set(backups);
  scan();
})();
