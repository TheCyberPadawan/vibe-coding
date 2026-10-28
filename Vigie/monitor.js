// Surveillance en direct : instantanés du collecteur regroupés par programme, état du pare-feu, nouveautés.
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { spawnPS, runPS } = require('./ps');
const { classify, listenScope, strip } = require('./net');

const STATES = { 1: 'fermée', 2: 'écoute', 3: 'ouverture', 4: 'ouverture', 5: 'établie', 6: 'fermeture', 7: 'fermeture', 8: 'fermeture', 9: 'fermeture', 10: 'fermeture', 11: 'attente', 12: 'supprimée' };
const SYSTEM_NAMES = { 0: 'Processus inactif', 4: 'Système (noyau Windows)' };

const FW_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$profiles = @(Get-NetFirewallProfile | ForEach-Object { @{ n = [string]$_.Name; on = ($_.Enabled.ToString() -eq 'True'); out = $_.DefaultOutboundAction.ToString() } })
$prog = @{}
foreach ($f in Get-NetFirewallApplicationFilter) { if ($f.Program -and $f.Program -ne 'Any') { $prog[$f.InstanceID] = [Environment]::ExpandEnvironmentVariables($f.Program) } }
$rules = @()
foreach ($r in Get-NetFirewallRule -Action Block -Enabled True) {
  if ($prog.ContainsKey($r.Name)) { $rules += @{ name = [string]$r.Name; display = [string]$r.DisplayName; dir = $r.Direction.ToString(); program = $prog[$r.Name]; vigie = ($r.Group -eq 'Vigie') } }
}
[Console]::Out.WriteLine('@@' + (@{ profiles = $profiles; rules = @($rules) } | ConvertTo-Json -Depth 5 -Compress))`;

class Monitor extends EventEmitter {
  constructor() {
    super();
    this.snap = null; this.services = {}; this.fw = { profiles: [], rules: [] }; this.programs = new Map();
    this.seen = null;          // signatures déjà vues (le premier instantané sert de référence, sans alerte)
    this.child = null; this.stopped = false;
  }
  start() {
    const src = fs.readFileSync(path.join(__dirname, 'ps', 'sampler.ps1'), 'utf8');
    const run = () => {
      this.child = spawnPS(src, m => {
        if (m.t === 'snap') { this.snap = m.d; this.rebuild(); }
        else if (m.t === 'svc') this.services = m.d || {};
      }, { VIGIE_INTERVAL: '1000' });
      this.child.on('close', () => { if (!this.stopped) setTimeout(run, 2000); });   // relance si le collecteur s'arrête
    };
    run();
    this.refreshFirewall();
    this.fwTimer = setInterval(() => this.refreshFirewall(), 20000);
  }
  stop() { this.stopped = true; clearInterval(this.fwTimer); this.child?.kill(); }
  async refreshFirewall() {
    try {
      const { items } = await runPS(FW_SCRIPT);
      if (items[0]) { this.fw = { profiles: items[0].profiles || [], rules: items[0].rules || [] }; this.rebuild(); }
    } catch (e) { console.warn('pare-feu', e.message); }
  }

  rebuild() {
    const s = this.snap; if (!s) return;
    const progs = new Map(), now = Date.now();
    const get = pid => {
      const p = s.proc[pid] || null;
      const key = p ? p.toLowerCase() : `pid:${pid}`;
      if (!progs.has(key)) {
        const name = p ? path.basename(p) : SYSTEM_NAMES[pid] || `Processus ${pid}`;
        progs.set(key, { key, path: p, name, pids: new Set(), listen: [], conns: [], services: new Set() });
      }
      const g = progs.get(key); g.pids.add(pid);
      for (const sv of this.services[pid] || []) g.services.add(sv);
      return g;
    };
    for (const [la, lp, ra, rp, st, pid] of s.tcp) {
      const g = get(pid);
      if (st === 2) g.listen.push({ proto: 'TCP', addr: strip(la), port: lp, scope: listenScope(la) });
      else if (rp && st !== 11 && st !== 12) g.conns.push({ local: strip(la), lport: lp, remote: strip(ra), rport: rp, state: STATES[st] || String(st), kind: classify(ra), pid });
    }
    for (const [la, lp, pid] of s.udp) {
      if (!lp) continue;
      const scope = listenScope(la);
      if (scope !== 'local') get(pid).listen.push({ proto: 'UDP', addr: strip(la), port: lp, scope });
    }
    const rulesByProg = new Map();
    for (const r of this.fw.rules) { const k = String(r.program).toLowerCase(); if (!rulesByProg.has(k)) rulesByProg.set(k, []); rulesByProg.get(k).push(r); }
    const events = [], firstRun = !this.seen;
    if (firstRun) this.seen = new Set();
    for (const g of progs.values()) {
      const lports = new Set(g.listen.filter(l => l.proto === 'TCP').map(l => l.port));
      for (const c of g.conns) c.dir = lports.has(c.lport) ? 'entrante' : 'sortante';
      g.listen.sort((a, b) => a.port - b.port);
      g.listen = g.listen.filter((l, i, a) => i === 0 || l.port !== a[i - 1].port || l.proto !== a[i - 1].proto || l.scope !== a[i - 1].scope);
      g.rules = rulesByProg.get(g.key) || [];
      g.blockedOut = g.rules.some(r => r.dir === 'Outbound' && !/réseau local autorisé/.test(r.display));
      g.lanOnly = !g.blockedOut && g.rules.some(r => r.dir === 'Outbound');
      g.blockedIn = g.rules.some(r => r.dir === 'Inbound');
      g.internet = g.conns.filter(c => c.kind === 'internet').length;
      g.exposed = g.listen.filter(l => l.scope !== 'local').length;
      g.pids = [...g.pids]; g.services = [...g.services];
      // Nouveautés : premier contact avec Internet, nouveau port ouvert sur le réseau
      for (const c of g.conns.filter(c => c.kind === 'internet' && c.dir === 'sortante')) {
        const sig = `net|${g.key}`;
        if (!this.seen.has(sig)) { this.seen.add(sig); if (!firstRun) events.push({ t: now, type: 'internet', key: g.key, name: g.name, detail: `${c.remote}:${c.rport}` }); }
      }
      for (const l of g.listen.filter(l => l.scope !== 'local')) {
        const sig = `port|${g.key}|${l.proto}|${l.port}`;
        if (!this.seen.has(sig)) { this.seen.add(sig); if (!firstRun) events.push({ t: now, type: 'port', key: g.key, name: g.name, detail: `${l.proto} ${l.port}` }); }
      }
    }
    // Les programmes bloqués restent visibles même sans activité réseau
    for (const [k, rules] of rulesByProg) if (!progs.has(k) && rules.some(r => r.vigie)) {
      progs.set(k, { key: k, path: rules[0].program, name: path.basename(rules[0].program), pids: [], listen: [], conns: [], services: [], rules,
        blockedOut: rules.some(r => r.dir === 'Outbound' && !/réseau local autorisé/.test(r.display)), lanOnly: false, blockedIn: rules.some(r => r.dir === 'Inbound'), internet: 0, exposed: 0, idle: true });
      const g = progs.get(k); g.lanOnly = !g.blockedOut && rules.some(r => r.dir === 'Outbound');
    }
    this.programs = progs;
    this.emit('update', { programs: [...progs.values()], fw: this.fw.profiles, events });
  }
}

module.exports = { Monitor };
