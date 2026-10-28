// Enrichissement des appareils découverts : fabricant (base OUI), services des ports, type d'appareil deviné.
const fs = require('fs');
const path = require('path');

let OUI = { 24: {}, 28: {}, 36: {} };
try { OUI = JSON.parse(fs.readFileSync(path.join(__dirname, 'app', 'data', 'oui.json'), 'utf8')); } catch (e) { console.warn('Base OUI absente', e.message); }

const hex = mac => String(mac || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
// Une adresse MAC « localement administrée » (2e bit du 1er octet) est souvent une MAC aléatoire de confidentialité
function isRandom(mac) { const h = hex(mac); if (h.length < 2) return false; return (parseInt(h.slice(0, 2), 16) & 0x02) !== 0; }
function vendor(mac) {
  const h = hex(mac); if (h.length < 6) return null;
  const v = OUI[36][h.slice(0, 9)] || OUI[28][h.slice(0, 7)] || OUI[24][h.slice(0, 6)] || null;
  if (v && /^private$/i.test(v)) return null;
  return v;
}

const SERVICES = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 53: 'DNS', 80: 'Site web (HTTP)', 135: 'Windows RPC', 139: 'Partage Windows', 443: 'Site web sécurisé (HTTPS)',
  445: 'Partage de fichiers (SMB)', 515: 'Imprimante', 548: 'Partage Apple (AFP)', 554: 'Flux vidéo (RTSP)', 631: 'Imprimante (IPP)', 1883: 'Objets connectés (MQTT)',
  2049: 'Partage de fichiers (NFS)', 3389: 'Bureau à distance', 5000: 'Service web', 5357: 'Découverte Windows', 7000: 'AirPlay', 8008: 'Chromecast', 8009: 'Chromecast',
  8080: 'Service web', 8443: 'Service web sécurisé', 9100: 'Imprimante (RAW)', 32400: 'Serveur multimédia Plex', 49152: 'UPnP', 62078: 'iPhone / iPad (sync)',
};
const service = p => SERVICES[p] || `Port ${p}`;

// Devine le type d'appareil (clé pour l'icône + libellé lisible), par ordre de certitude décroissante
function deviceType(h, gateway) {
  const ports = new Set(h.ports || []);
  const v = (h.vendor || '').toLowerCase();
  const name = (h.name || '').toLowerCase();
  const has = (...ps) => ps.some(p => ports.has(p));
  if (h.self) return { kind: 'self', type: 'Cet ordinateur' };
  if (h.ip === gateway) return { kind: 'router', type: 'Box / routeur' };
  if (has(62078)) return { kind: 'apple', type: 'iPhone ou iPad' };
  if (has(9100, 515, 631)) return { kind: 'printer', type: 'Imprimante' };
  if (has(8008, 8009)) return { kind: 'cast', type: 'Chromecast / Google' };
  if (/samsung|\blg\b|lgelectronic|sony|philips|tcl|hisense|vizio|panasonic/.test(v) && has(8080, 8001, 8002, 7000, 9197, 8443)) return { kind: 'tv', type: 'TV connectée' };
  const isp = /freebox|livebox|sfr|orange|bouygues|technicolor|sagemcom|arcadyan|askey|netgear|asus|tp-?link|tplink|zyxel|cisco|ubiquiti|avm|fritz/.test(v);
  if (has(554) && !has(445, 139) && !isp && !(h.ip === gateway)) return { kind: 'camera', type: 'Caméra IP' };
  if (has(554, 7000) && isp) return { kind: 'tv', type: 'Décodeur TV / box multimédia' };
  if (has(32400)) return { kind: 'nas', type: 'Serveur multimédia (Plex)' };
  if (has(2049, 548) || /synology|qnap|western digital|wd |netgear.*nas/.test(v)) return { kind: 'nas', type: 'Serveur de fichiers (NAS)' };
  if (/apple/.test(v)) return { kind: 'apple', type: has(7000, 5000, 3689) ? 'Appareil Apple (AirPlay)' : 'Appareil Apple' };
  if (has(445, 139, 135, 3389)) return { kind: 'pc', type: 'PC Windows' };
  if (/raspberry|espressif|texas instruments|tuya|sonoff|shelly|xiaomi|tp-?link|tplink|broadlink/.test(v) || has(1883)) return { kind: 'iot', type: 'Objet connecté' };
  if (has(22) && !has(80, 443, 445)) return { kind: 'linux', type: 'Appareil Linux / serveur' };
  if (isRandom(h.mac) && !ports.size) return { kind: 'phone', type: 'Téléphone ou appareil mobile' };
  if (has(80, 443, 8080)) return { kind: 'web', type: 'Appareil avec interface web' };
  return { kind: 'unknown', type: 'Appareil réseau' };
}

function enrich(h, gateway) {
  const v = vendor(h.mac);
  const out = { ...h, vendor: v, random: isRandom(h.mac), services: (h.ports || []).map(p => ({ port: p, name: service(p) })) };
  Object.assign(out, deviceType(out, gateway));
  return out;
}

module.exports = { enrich, vendor, service, isRandom };
