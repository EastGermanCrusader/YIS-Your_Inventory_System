#!/usr/bin/env node
/**
 * Aktualisiert privat/ aus dem Repository-Root (lokale Arbeitskopie).
 * Geheimnisdateien werden nur kopiert, wenn sie im Root existieren.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRIVAT = path.join(ROOT, 'privat');

function cpR(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function (name) {
      if (name === 'node_modules' || name === '.git') return;
      cpR(path.join(src, name), path.join(dest, name));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const DIRS = ['deploy', 'tools', 'js', 'google-apps-script'];
const FILES = [
  'serve.sh', 'package.json', 'README.md', 'SETUP.md', 'SECURITY.md', 'LICENSE',
  'url.txt.example', 'token.txt.example', 'Bereitstellungs-ID.txt.example', 'Key.txt.example'
];
const SECRETS = ['url.txt', 'token.txt', 'Bereitstellungs-ID.txt', 'Key.txt'];

if (!fs.existsSync(PRIVAT)) fs.mkdirSync(PRIVAT, { recursive: true });

DIRS.forEach(function (d) {
  cpR(path.join(ROOT, d), path.join(PRIVAT, d));
  console.log('Sync:', d + '/');
});

FILES.forEach(function (f) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(PRIVAT, f));
    console.log('Sync:', f);
  }
});

SECRETS.forEach(function (f) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(PRIVAT, f));
    console.log('Sync (Geheimnis):', f);
  }
});

console.log('\nFertig. Optional: cd privat && npm run build && ./serve.sh');
