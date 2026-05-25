#!/usr/bin/env node
/**
 * Kopiert Projekt-Dokumentation nach deploy/ (für GitHub-Upload).
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

const readmeSrc = path.join(ROOT, 'README.md');
const pagesBlock = `

---

## Inhalt dieses Ordners (GitHub Pages)

Dieser Ordner ist die **statische Website** für GitHub Pages.

| Datei / Ordner | Zweck |
|----------------|--------|
| \`index.html\` | Einstieg |
| \`.nojekyll\` | Jekyll auf Pages deaktivieren |
| \`LICENSE\` | MIT-Lizenz |
| \`SETUP.md\` | Einrichtung eigener Instanz |
| \`SECURITY.md\` | Sicherheitshinweise |
| \`css/\`, \`js/\`, \`fonts/\` | Frontend |
| \`*.mp3\`, \`L-W_Monogramm_n.b.png\` | Assets |

**Pages-Einstellung:** Branch \`main\`, Ordner **\`/deploy\`**.

\`js/shield.js\` hier ist ein **Platzhalter**. Für deine API lokal im Repo-Root: \`npm run build\` (gebaute Version nicht committen).
`;

if (fs.existsSync(readmeSrc)) {
  var readme = fs.readFileSync(readmeSrc, 'utf8');
  readme = readme.replace(
    /Alles für die Website liegt in \*\*`deploy\/`\*\* \(siehe \[deploy\/README\.md\]\(deploy\/README\.md\) mit Upload-Checkliste\)\.\n\n/,
    ''
  );
  fs.writeFileSync(path.join(DEPLOY, 'README.md'), readme.trim() + pagesBlock);
  console.log('Erstellt: deploy/README.md');
}
