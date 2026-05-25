#!/usr/bin/env node
/**
 * Erzeugt js/app.min.js – nur Block-Kommentare entfernen (kein //-Strip, bricht Strings)
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'js', 'app.js');
const out = path.join(__dirname, '..', 'deploy', 'js', 'app.min.js');

let code = fs.readFileSync(src, 'utf8');

code = code
  .replace(/\/\*\*[\s\S]*?\*\//g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s+/g, '\n')
  .replace(/^\s+/gm, '')
  .trim();

const prelude = '/* YIS – kompiliert */\n';
fs.writeFileSync(out, prelude + code);
console.log('app.min.js erstellt');
