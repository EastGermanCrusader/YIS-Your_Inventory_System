#!/usr/bin/env node
/**
 * Legt lokale Konfigurationsdateien aus *.example an (überschreibt nichts Vorhandenes).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAIRS = [
  ['url.txt.example', 'url.txt'],
  ['Bereitstellungs-ID.txt.example', 'Bereitstellungs-ID.txt'],
  ['token.txt.example', 'token.txt']
];

PAIRS.forEach(function (pair) {
  const src = path.join(ROOT, pair[0]);
  const dest = path.join(ROOT, pair[1]);
  if (!fs.existsSync(src)) {
    console.warn('Übersprungen (fehlt):', pair[0]);
    return;
  }
  if (fs.existsSync(dest)) {
    console.log('Bereits vorhanden:', pair[1]);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log('Angelegt:', pair[1], '←', pair[0]);
});

var shieldDest = path.join(ROOT, 'deploy', 'js', 'shield.js');
var shieldStub = path.join(ROOT, 'deploy', 'js', 'shield.stub.js');
if (!fs.existsSync(shieldDest) && fs.existsSync(shieldStub)) {
  fs.copyFileSync(shieldStub, shieldDest);
  console.log('Angelegt: deploy/js/shield.js ← shield.stub.js');
}

console.log('\nAls Nächstes:');
console.log('  1. token.txt + App.gs: gleiches Geheimnis setzen');
console.log('  2. Google Web-App bereitstellen → url.txt + Bereitstellungs-ID.txt');
console.log('  3. npm run build');
