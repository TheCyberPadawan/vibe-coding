// Client de l'assistant administrateur : lancé à la première action (une seule fenêtre UAC par session),
// joint par un canal nommé au nom aléatoire, authentifié par un jeton secret transmis au lancement.
const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { launchElevated, psq } = require('./ps');
const { INTERNET_RANGES } = require('./net');

class Helper {
  // launch : lanceur du script (par défaut en administrateur ; les tests passent un lanceur sans élévation)
  constructor(sid, { launch = launchElevated } = {}) {
    if (!/^S-1-[0-9]+(-[0-9]+)+$/.test(sid)) throw new Error('Identifiant de compte invalide');
    this.sid = sid; this.launch = launch; this.sock = null; this.starting = null; this.pending = new Map(); this.seq = 0; this.onState = () => {};
  }
  get ready() { return !!this.sock; }

  async ensure() {
    if (this.sock) return;
    if (!this.starting) this.starting = this.start().finally(() => { this.starting = null; });
    return this.starting;
  }
  async start() {
    const name = 'vigie-' + crypto.randomBytes(16).toString('hex'), token = crypto.randomBytes(32).toString('hex');
    const prelude = `$PipeName = ${psq(name)}; $Token = ${psq(token)}; $ClientSid = ${psq(this.sid)}\n$InternetRanges = @(${INTERNET_RANGES.map(psq).join(', ')})\n`;
    await this.launch(prelude + fs.readFileSync(path.join(__dirname, 'ps', 'helper.ps1'), 'utf8'));
    const sock = await connect('\\\\.\\pipe\\' + name, 60000);
    let buf = '', ready = false;
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("L'assistant administrateur ne répond pas.")), 15000);
      sock.setEncoding('utf8');
      sock.on('data', d => {
        buf += d; let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          let m; try { m = JSON.parse(line); } catch { continue; }
          if (!ready && m.ready) { ready = true; clearTimeout(t); resolve(); continue; }
          const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.ok ? p.resolve(m) : p.reject(new Error(m.e || 'Échec')); }
        }
      });
      sock.on('close', () => {
        clearTimeout(t); if (!ready) reject(new Error("L'assistant administrateur s'est arrêté."));
        this.sock = null; this.onState(false);
        for (const p of this.pending.values()) p.reject(new Error("L'assistant administrateur s'est arrêté."));
        this.pending.clear();
      });
      sock.on('error', () => {});
      sock.write(token + '\n');
    });
    this.sock = sock; this.onState(true);
  }
  async call(op, args = {}) {
    await this.ensure();
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error("L'assistant administrateur ne répond pas.")); }, 60000);
      this.pending.set(id, { resolve: v => { clearTimeout(t); resolve(v); }, reject: e => { clearTimeout(t); reject(e); } });
      this.sock.write(JSON.stringify({ id, op, ...args }) + '\n');
    });
  }
  stop() { if (this.sock) this.sock.end(); }
}

// Le canal n'existe qu'une fois la fenêtre UAC acceptée : on réessaie jusqu'au délai
function connect(pipe, timeout) {
  const end = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const s = net.connect(pipe);
      s.once('connect', () => resolve(s));
      s.once('error', () => { s.destroy(); if (Date.now() > end) reject(new Error("L'assistant administrateur n'a pas démarré.")); else setTimeout(attempt, 250); });
    };
    attempt();
  });
}

module.exports = { Helper };
