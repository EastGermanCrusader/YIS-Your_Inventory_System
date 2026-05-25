#!/usr/bin/env node
/**
 * Kopiert Projekt-Dokumentation nach deploy/ (für GitHub Pages).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEPLOY = path.join(ROOT, 'deploy');

const COPY = ['LICENSE', 'SETUP.md', 'SECURITY.md'];

COPY.forEach(function (name) {
  const src = path.join(ROOT, name);
  const dest = path.join(DEPLOY, name);
  if (!fs.existsSync(src)) {
    console.warn('Übersprungen (fehlt):', name);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log('Kopiert:', name, '→ deploy/');
});

const pagesBlock = `

---

## Inhalt dieses Ordners (GitHub Pages)

Dieser Ordner ist die **statische Website** für GitHub Pages.

| Datei / Ordner | Zweck |
|----------------|--------|
| \`index.html\` | Einstiegspunkt der Anwendung |
| \`demo.gif\` | Demo-Aufnahme der Oberfläche |
| \`.nojekyll\` | Jekyll auf Pages deaktivieren |
| \`LICENSE\` | MIT-Lizenz |
| \`SETUP.md\` | Einrichtung einer eigenen Instanz |
| \`SECURITY.md\` | Sicherheitshinweise |
| \`css/\`, \`js/\` | Frontend-Assets |
| \`*.mp3\`, \`preview_Logo.png\` | Audio und Logo |

**Pages-Einstellung:** Branch \`main\`, Ordner **\`/deploy\`**.

\`js/shield.js\` ist ein **Platzhalter**. Für deine API im Repository-Root: \`npm run build\` (konfigurierte Version nicht committen).
`;

const readmeSrc = path.join(ROOT, 'README.md');
if (fs.existsSync(readmeSrc)) {
  var readme = fs.readFileSync(readmeSrc, 'utf8');
  readme = readme.replace(/deploy\/demo\.gif/g, 'demo.gif');
  fs.writeFileSync(path.join(DEPLOY, 'README.md'), readme.trim() + pagesBlock);
  console.log('Erstellt: deploy/README.md');
}
