#!/usr/bin/env node
/**
 * Erzeugt deploy/js/shield.js – AES-256-GCM für API-URL, Login-Hash, öffentliche Deploy-ID
 * Benötigt: url.txt, Bereitstellungs-ID.txt, token.txt (siehe *.example)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

function readTrim(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8').trim();
}

function readToken() {
  const raw = readTrim('token.txt');
  if (raw) {
    const line = raw.split('\n').map(function (s) { return s.trim(); })
      .find(function (s) { return s && !s.startsWith('#'); });
    if (line) return line;
  }
  const keyFile = readTrim('Key.txt');
  const tokenMatch = keyFile.match(/MEIN_GEHEIMER_TOKEN\s*=\s*["']([^"']+)["']/);
  return tokenMatch ? tokenMatch[1] : '';
}

const apiUrl = readTrim('url.txt');
const deployId = readTrim('Bereitstellungs-ID.txt');
const token = readToken();

const PLACEHOLDER = /DEIN_|HIER$|CHANGE_ME|example/i;

function fail(msg) {
  console.error('Fehler:', msg);
  console.error('Hinweis: node tools/setup-config.js  oder *.example manuell kopieren.');
  process.exit(1);
}

if (!apiUrl || !token || !deployId) {
  fail('url.txt, Bereitstellungs-ID.txt oder token.txt fehlt oder ist leer.');
}
if (PLACEHOLDER.test(apiUrl) || PLACEHOLDER.test(deployId) || PLACEHOLDER.test(token)) {
  fail('Platzhalter in der Konfiguration – bitte echte Werte eintragen.');
}

const loginHash = crypto.createHash('sha256').update(token).digest('hex');
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(token, salt, 120000, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([cipher.update(apiUrl, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

const payload = {
  s: salt.toString('base64'),
  i: iv.toString('base64'),
  t: tag.toString('base64'),
  c: enc.toString('base64'),
  h: loginHash,
  p: Buffer.from(deployId, 'utf8').toString('base64')
};

const outPath = path.join(ROOT, 'deploy', 'js', 'shield.js');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const fixedCode = `/* YIS Shield – generiert, nicht manuell bearbeiten */
(function(g){var P=${JSON.stringify(payload)};
function b64d(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
g.YIS_SHIELD={
  configured:true,
  cfg:function(){return{loginHash:P.h,apiUrl:null};},
  publicApiUrl:function(){return'https://script.google.com/macros/s/'+atob(P.p)+'/exec';},
  unlock:async function(pw){
    var enc=new TextEncoder();
    var km=await g.crypto.subtle.importKey('raw',enc.encode(pw),{name:'PBKDF2'},false,['deriveKey']);
    var dk=await g.crypto.subtle.deriveKey({name:'PBKDF2',salt:b64d(P.s),iterations:120000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
    var ct=b64d(P.c),tg=b64d(P.t),buf=new Uint8Array(ct.length+tg.length);
    buf.set(ct,0);buf.set(tg,ct.length);
    var pt=await g.crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(P.i),tagLength:128},dk,buf);
    return new TextDecoder().decode(pt);
  }
};})(typeof window!=='undefined'?window:global);
`;

fs.writeFileSync(outPath, fixedCode);
console.log('shield.js erstellt:', outPath);
