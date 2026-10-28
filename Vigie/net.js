// Classement des adresses IP et plages « Internet » pour les règles du pare-feu.
const net = require('net');

const v4 = s => s.split('.').reduce((n, x) => n * 256 + (+x), 0);
const inV4 = (ip, cidr) => { const [base, bits] = cidr.split('/'); const size = 2 ** (32 - +bits); return Math.floor(v4(ip) / size) === Math.floor(v4(base) / size); };

// Adresses qui ne sortent pas sur Internet : machine locale, réseaux privés, VPN (100.64/10, ex. Tailscale), lien local
const LOCAL_V4 = ['127.0.0.0/8'];
const LAN_V4 = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10', '169.254.0.0/16', '224.0.0.0/4', '255.255.255.255/32', '0.0.0.0/8'];

function strip(ip) { return String(ip || '').replace(/^::ffff:/i, '').replace(/%.*$/, ''); }

// 'local' (cette machine), 'lan' (réseau local ou VPN), 'internet'
function classify(ip) {
  ip = strip(ip);
  if (net.isIPv4(ip)) {
    if (LOCAL_V4.some(c => inV4(ip, c))) return 'local';
    if (LAN_V4.some(c => inV4(ip, c))) return 'lan';
    return 'internet';
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::1') return 'local';
    if (l === '::') return 'lan';
    if (/^(fe[89ab]|fc|fd|ff)/.test(l)) return 'lan';   // lien local, adresses uniques locales, multidiffusion
    return /^[23]/.test(l) ? 'internet' : 'lan';        // 2000::/3 : adresses publiques
  }
  return 'lan';
}

// Portée d'un port en écoute : 'all' (toutes les interfaces), 'local' (cette machine seulement), 'lan' (une interface précise)
function listenScope(ip) {
  ip = strip(ip);
  if (ip === '0.0.0.0' || ip === '::') return 'all';
  return classify(ip) === 'local' ? 'local' : 'lan';
}

// Plages bloquées par « réseau local seulement » : tout l'Internet public, IPv4 et IPv6
const INTERNET_RANGES = [
  '1.0.0.0-9.255.255.255', '11.0.0.0-100.63.255.255', '100.128.0.0-126.255.255.255', '128.0.0.0-169.253.255.255',
  '169.255.0.0-172.15.255.255', '172.32.0.0-192.167.255.255', '192.169.0.0-223.255.255.255', '2000::/3',
];

module.exports = { classify, listenScope, INTERNET_RANGES, strip };
