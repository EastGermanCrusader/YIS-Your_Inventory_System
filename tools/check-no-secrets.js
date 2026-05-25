#!/usr/bin/env node
/**
 * Prüft, ob versehentlich Geheimnisse committed würden (für CI / vor Push).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BAD_PATTERNS = [
  /17032006LW_Inventory/,
  /AKfycbwcwVZCh812/,
  /!#!.*!#!/
];

const SCAN_FILES = [
  'deploy/js/shield.stub.js',
  'google-apps-script/App.gs',
  'js/app.js',
  'deploy/js/app.min.js'
];

var shieldPath = path.join(ROOT, 'deploy/js/shield.js');
if (fs.existsSync(shieldPath)) {
  SCAN_FILES.push('deploy/js/shield.js');
}

var failed = false;

SCAN_FILES.forEach(function (rel) {
  var p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return;
  var text = fs.readFileSync(p, 'utf8');
  BAD_PATTERNS.forEach(function (re) {
    if (re.test(text)) {
      console.error('Geheimnis-Verdacht in', rel, ':', re.toString());
      failed = true;
    }
  });
  if (rel === 'deploy/js/shield.js' && text.indexOf('configured:true') >= 0) {
    console.error('deploy/js/shield.js ist gebaut (configured:true) – vor Push: Platzhalter wiederherstellen (shield.stub.js) oder nicht committen.');
    failed = true;
  }
});

if (failed) process.exit(1);
console.log('OK: keine bekannten Geheimnisse in Quellcode gefunden.');
