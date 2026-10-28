// Chiffrement des PDF (gestionnaire de sécurité standard) :
//  - decrypt : ouvre un PDF protégé (RC4 40 à 128 bits, AES-128, AES-256) et renvoie une version en clair ;
//  - encryptBytes : protège un PDF par mot de passe en AES-256 (révision 6, comme Acrobat).
window.AtelierCrypt = (() => {
'use strict';
const L = PDFLib;
const { PDFName, PDFDict, PDFArray, PDFRawStream, PDFStream, PDFString, PDFHexString, PDFNumber, PDFRef } = L;
const N = n => PDFName.of(n);
const subtle = crypto.subtle;
const PAD = Uint8Array.from([0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a]);

const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const rand = n => crypto.getRandomValues(new Uint8Array(n));
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');

/* ---------- MD5 et RC4 (anciens chiffrements, lecture seule) ---------- */
function md5(data) {
  const K = new Int32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0;
  const len = data.length, n = ((len + 8) >> 6) + 1, w = new Int32Array(n * 16);
  for (let i = 0; i < len; i++) w[i >> 2] |= data[i] << ((i % 4) * 8);
  w[len >> 2] |= 0x80 << ((len % 4) * 8);
  w[n * 16 - 2] = len * 8; w[n * 16 - 1] = Math.floor(len / 2 ** 29);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let j = 0; j < n * 16; j += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const t = d; d = c; c = b;
      const x = (a + f + K[i] + w[j + g]) | 0, s = S[(i >> 4) * 4 + (i % 4)];
      b = (b + ((x << s) | (x >>> (32 - s)))) | 0; a = t;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((v, i) => { for (let k = 0; k < 4; k++) out[i * 4 + k] = (v >>> (8 * k)) & 255; });
  return out;
}
function rc4(key, data) {
  const s = new Uint8Array(256); for (let i = 0; i < 256; i++) s[i] = i;
  for (let i = 0, j = 0; i < 256; i++) { j = (j + s[i] + key[i % key.length]) & 255; [s[i], s[j]] = [s[j], s[i]]; }
  const out = new Uint8Array(data.length);
  for (let k = 0, i = 0, j = 0; k < data.length; k++) {
    i = (i + 1) & 255; j = (j + s[i]) & 255; [s[i], s[j]] = [s[j], s[i]];
    out[k] = data[k] ^ s[(s[i] + s[j]) & 255];
  }
  return out;
}

/* ---------- AES (WebCrypto) ---------- */
const aesKey = (k, use) => subtle.importKey('raw', k, 'AES-CBC', false, [use]);
async function aesEnc(key, iv, data) { return new Uint8Array(await subtle.encrypt({ name: 'AES-CBC', iv }, await aesKey(key, 'encrypt'), data)); }
const aesEncNoPad = async (key, iv, data) => (await aesEnc(key, iv, data)).subarray(0, data.length);
async function aesDec(key, iv, data) { return new Uint8Array(await subtle.decrypt({ name: 'AES-CBC', iv }, await aesKey(key, 'decrypt'), data)); }
// Déchiffrement sans remplissage : on ajoute un bloc qui se déchiffre en remplissage PKCS#7 valide
async function aesDecNoPad(key, iv, data) {
  const extra = (await aesEnc(key, data.subarray(data.length - 16), new Uint8Array(16).fill(16))).subarray(0, 16);
  return aesDec(key, iv, cat(data, extra));
}
const sha = async (alg, d) => new Uint8Array(await subtle.digest(alg, d));

// Algorithme 2.B (révision 6) : hachage itératif du mot de passe
async function hash6(pw, salt, u) {
  let k = await sha('SHA-256', cat(pw, salt, u));
  let i = 0, e;
  while (i < 64 || e[e.length - 1] > i - 32) {
    const k1 = cat(pw, k, u), rep = new Uint8Array(k1.length * 64);
    for (let r = 0; r < 64; r++) rep.set(k1, r * k1.length);
    e = await aesEncNoPad(k.subarray(0, 16), k.subarray(16, 32), rep);
    let m = 0; for (let j = 0; j < 16; j++) m += e[j];
    k = await sha(['SHA-256', 'SHA-384', 'SHA-512'][m % 3], e);
    i++;
  }
  return k.subarray(0, 32);
}
const hash5 = async (pw, salt, u) => sha('SHA-256', cat(pw, salt, u));

/* ---------- Lecture du dictionnaire de chiffrement ---------- */
const bytesOf = o => o instanceof PDFString || o instanceof PDFHexString ? o.asBytes() : new Uint8Array(0);
const numOf = (d, k, def) => { const v = d.lookup(N(k)); return v instanceof PDFNumber ? v.asNumber() : def; };
const pdfPw = pw => { const b = new Uint8Array(32), s = Uint8Array.from(String(pw || ''), c => c.charCodeAt(0) & 255).subarray(0, 32); b.set(s); b.set(PAD.subarray(0, 32 - s.length), s.length); return b; };
const utf8Pw = pw => new TextEncoder().encode(String(pw || '').normalize('NFKC')).subarray(0, 127);

async function fileKey(enc, id0, password) {
  const V = numOf(enc, 'V', 0), R = numOf(enc, 'R', 2), O = bytesOf(enc.lookup(N('O'))), U = bytesOf(enc.lookup(N('U')));
  const P = numOf(enc, 'P', 0), meta = enc.lookup(N('EncryptMetadata'))?.asBoolean?.() !== false;
  if (R >= 5) {
    const pw = utf8Pw(password), h = R === 5 ? hash5 : hash6;
    if (eq(await h(pw, O.subarray(32, 40), U.subarray(0, 48)), O.subarray(0, 32)))
      return { key: await aesDecNoPad(await h(pw, O.subarray(40, 48), U.subarray(0, 48)), new Uint8Array(16), bytesOf(enc.lookup(N('OE')))), owner: true, V, R };
    if (eq(await h(pw, U.subarray(32, 40), new Uint8Array(0)), U.subarray(0, 32)))
      return { key: await aesDecNoPad(await h(pw, U.subarray(40, 48), new Uint8Array(0)), new Uint8Array(16), bytesOf(enc.lookup(N('UE')))), owner: false, V, R };
    return null;
  }
  const n = R === 2 ? 5 : numOf(enc, 'Length', 40) / 8;
  const userKey = upw => {
    const pl = new Uint8Array(4); new DataView(pl.buffer).setInt32(0, P, true);
    let h = md5(cat(pdfPw(upw), O, pl, id0, R >= 4 && !meta ? new Uint8Array([255, 255, 255, 255]) : new Uint8Array(0)));
    if (R >= 3) for (let i = 0; i < 50; i++) h = md5(h.subarray(0, n));
    return h.subarray(0, n);
  };
  const check = key => {
    if (R === 2) return eq(rc4(key, PAD), U);
    let x = rc4(key, md5(cat(PAD, id0)));
    for (let i = 1; i <= 19; i++) x = rc4(key.map(b => b ^ i), x);
    return eq(x, U.subarray(0, 16));
  };
  let key = userKey(password);
  if (check(key)) return { key, owner: false, V, R, n };
  let h = md5(pdfPw(password));                        // mot de passe propriétaire : on retrouve celui de l'utilisateur
  if (R >= 3) for (let i = 0; i < 50; i++) h = md5(h);
  const ok = h.subarray(0, n);
  let upw = O;
  if (R === 2) upw = rc4(ok, O); else for (let i = 19; i >= 0; i--) upw = rc4(ok.map(b => b ^ i), upw);
  key = userKey(String.fromCharCode(...upw));
  return check(key) ? { key, owner: true, V, R, n } : null;
}

/* ---------- Déchiffrement complet du document ---------- */
// pdf-lib analyse les flux d'objets pendant le chargement : on intercepte ce moment pour les déchiffrer d'abord
async function loadWith(bytes, onObjStm) {
  const OSP = L.PDFObjectStreamParser, Parser = L.PDFParser.prototype, Ctx = L.PDFContext.prototype;
  const forStream = OSP.forStream, header = Parser.parseIndirectObjectHeader, assign = Ctx.assign;
  const fromObjStm = new Set(); let current = null, inside = false;
  Parser.parseIndirectObjectHeader = function () { const r = header.call(this); current = r; return r; };
  Ctx.assign = function (ref, obj) { if (inside) fromObjStm.add(ref.tag); return assign.call(this, ref, obj); };
  OSP.forStream = (stream, tick) => ({ async parseIntoContext() {
    const s = await onObjStm(stream, current);
    if (!s) return;
    inside = true; try { await forStream(s, tick).parseIntoContext(); } finally { inside = false; }
  } });
  try { return { doc: await L.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false }), fromObjStm }; }
  finally { OSP.forStream = forStream; Parser.parseIndirectObjectHeader = header; Ctx.assign = assign; }
}

function isEncrypted(bytes) {
  const s = new TextDecoder('latin1').decode(bytes.length > 4e6 ? cat(bytes.subarray(0, 2e6), bytes.subarray(bytes.length - 2e6)) : bytes);
  return /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(s);
}

// Renvoie { bytes, info } en clair, ou lève une erreur { code: 'password' } si le mot de passe ne convient pas
async function decrypt(bytes, password = '') {
  const first = await loadWith(bytes, async () => null);
  const ctx0 = first.doc.context, encObj = ctx0.lookup(ctx0.trailerInfo.Encrypt);
  if (!(encObj instanceof PDFDict)) return { bytes, info: null };
  if (encObj.lookup(N('Filter'))?.asString() !== '/Standard') throw Object.assign(new Error('Sécurité non standard (certificat ou DRM)'), { code: 'handler' });
  const idArr = ctx0.lookup(ctx0.trailerInfo.ID), id0 = idArr instanceof PDFArray ? bytesOf(ctx0.lookup(idArr.get(0))) : new Uint8Array(0);
  const fk = await fileKey(encObj, id0, password);
  if (!fk) throw Object.assign(new Error('Mot de passe incorrect'), { code: 'password' });

  // Filtres de chiffrement : RC4, AES-128 ou AES-256, ou aucun (Identity) pour les flux ou les chaînes
  const cf = encObj.lookup(N('CF')), method = name => {
    if (fk.V < 4) return 'rc4';
    if (!name || name === '/Identity') return 'none';
    const m = cf instanceof PDFDict ? cf.lookup(N(name.slice(1)))?.lookup?.(N('CFM'))?.asString() : null;
    return m === '/AESV2' ? 'aes128' : m === '/AESV3' ? 'aes256' : m === '/None' ? 'none' : 'rc4';
  };
  const stmM = method(encObj.lookup(N('StmF'))?.asString()), strM = method(encObj.lookup(N('StrF'))?.asString());
  const objKey = (ref, aes) => {
    if (fk.R >= 5) return fk.key;
    const n = ref.objectNumber, g = ref.generationNumber;
    return md5(cat(fk.key, Uint8Array.of(n & 255, (n >> 8) & 255, (n >> 16) & 255, g & 255, (g >> 8) & 255), aes ? Uint8Array.of(0x73, 0x41, 0x6c, 0x54) : new Uint8Array(0)))
      .subarray(0, Math.min(fk.key.length + 5, 16));
  };
  const dec = async (m, ref, data) => {
    if (m === 'none' || !data.length) return data;
    if (m === 'rc4') return rc4(objKey(ref, false), data);
    if (data.length < 32) return new Uint8Array(0);
    const key = objKey(ref, true);
    try { return await aesDec(key, data.subarray(0, 16), data.subarray(16)); }
    catch { return aesDecNoPad(key, data.subarray(0, 16), data.subarray(16, 16 + ((data.length - 16) >> 4 << 4))); }
  };
  const meta = encObj.lookup(N('EncryptMetadata'))?.asBoolean?.() !== false;

  const second = await loadWith(bytes, async (stream, ref) => PDFRawStream.of(stream.dict, await dec(stmM, ref, stream.contents)));
  const ctx = second.doc.context, encRef = ctx.trailerInfo.Encrypt;
  const strings = async (o, ref) => {
    if (o instanceof PDFString || o instanceof PDFHexString) return PDFHexString.of(hex(await dec(strM, ref, o.asBytes())));
    if (o instanceof PDFDict) { for (const [k, v] of o.entries()) { const nv = await strings(v, ref); if (nv !== v) o.set(k, nv); } }
    else if (o instanceof PDFArray) { for (let i = 0; i < o.size(); i++) { const v = o.get(i), nv = await strings(v, ref); if (nv !== v) o.set(i, nv); } }
    return o;
  };
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (second.fromObjStm.has(ref.tag) || (encRef instanceof PDFRef && ref.tag === encRef.tag)) continue;
    if (obj instanceof PDFStream) {
      const type = obj.dict.lookup(N('Type'))?.asString();
      if (type === '/XRef') continue;
      await strings(obj.dict, ref);
      if (obj instanceof PDFRawStream && !(type === '/Metadata' && !meta)) ctx.assign(ref, PDFRawStream.of(obj.dict, await dec(stmM, ref, obj.contents)));
    } else await strings(obj, ref);
  }
  ctx.trailerInfo.Encrypt = undefined;
  if (encRef instanceof PDFRef) ctx.delete(encRef);
  const P = numOf(encObj, 'P', -1);
  const info = { revision: fk.R, owner: fk.owner, userPassword: !!password && !fk.owner,
    perms: { print: !!(P & 4), modify: !!(P & 8), copy: !!(P & 16), annotate: !!(P & 32) } };
  return { bytes: await second.doc.save({ useObjectStreams: false, updateFieldAppearances: false }), info };
}

/* ---------- Chiffrement AES-256 ---------- */
// perms : { print, modify, copy, annotate } (true = autorisé)
async function encryptBytes(bytes, { user = '', owner = '', perms = {} } = {}) {
  const doc = await L.PDFDocument.load(bytes, { updateMetadata: false });
  const ctx = doc.context;
  const fkey = rand(32), up = utf8Pw(user), op = utf8Pw(owner || hex(rand(16)));
  const uv = rand(8), uk = rand(8), ov = rand(8), ok = rand(8);
  const U = cat(await hash6(up, uv, new Uint8Array(0)), uv, uk);
  const UE = await aesEncNoPad(await hash6(up, uk, new Uint8Array(0)), new Uint8Array(16), fkey);
  const O = cat(await hash6(op, ov, U), ov, ok);
  const OE = await aesEncNoPad(await hash6(op, ok, U), new Uint8Array(16), fkey);
  let P = 0xfffff0c0;
  if (perms.print !== false) P |= 4 | 2048;
  if (perms.modify !== false) P |= 8 | 1024;
  if (perms.copy !== false) P |= 16 | 512;
  if (perms.annotate !== false) P |= 32 | 256;
  P |= 0;
  const pb = new Uint8Array(16); new DataView(pb.buffer).setInt32(0, P, true);
  pb.set([255, 255, 255, 255], 4); pb.set([0x54, 0x61, 0x64, 0x62], 8); pb.set(rand(4), 12);
  const Perms = await aesEncNoPad(fkey, new Uint8Array(16), pb);

  const enc = async d => { const iv = rand(16); return cat(iv, await aesEnc(fkey, iv, d)); };
  const strings = async o => {
    if (o instanceof PDFString || o instanceof PDFHexString) return PDFHexString.of(hex(await enc(o.asBytes())));
    if (o instanceof PDFDict) { for (const [k, v] of o.entries()) { const nv = await strings(v); if (nv !== v) o.set(k, nv); } }
    else if (o instanceof PDFArray) { for (let i = 0; i < o.size(); i++) { const v = o.get(i), nv = await strings(v); if (nv !== v) o.set(i, nv); } }
    return o;
  };
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFStream) {
      if (obj.dict.lookup(N('Type'))?.asString() === '/XRef') continue;
      await strings(obj.dict);
      const data = obj instanceof PDFRawStream ? obj.contents : obj.getContents();
      const d = obj.dict.clone(ctx); d.delete(N('Length'));
      ctx.assign(ref, PDFRawStream.of(d, await enc(data)));
    } else await strings(obj);
  }
  const hs = b => PDFHexString.of(hex(b));
  ctx.trailerInfo.Encrypt = ctx.register(ctx.obj({
    Filter: 'Standard', V: 5, R: 6, Length: 256, P,
    CF: { StdCF: { AuthEvent: 'DocOpen', CFM: 'AESV3', Length: 32 } }, StmF: 'StdCF', StrF: 'StdCF',
    O: hs(O), U: hs(U), OE: hs(OE), UE: hs(UE), Perms: hs(Perms), EncryptMetadata: true,
  }));
  const id = hs(rand(16));
  ctx.trailerInfo.ID = ctx.obj([id, id]);
  return doc.save({ useObjectStreams: false, updateFieldAppearances: false, addDefaultPage: false });
}

return { isEncrypted, decrypt, encryptBytes, _md5: md5, _rc4: rc4 };
})();
