English Version below

# YIS – Einrichtung (eigene Instanz)

> **Hinweis:** Backend (`google-apps-script/`), Build-Tools (`tools/`) und `*.example`-Dateien liegen im **Repository-Root**. Klone das vollständige Repository — nicht nur den Ordner `deploy/`.

Diese Anleitung nutzt ausschließlich Dateien aus dem Repository. Nach `npm run setup` trägst du Werte in die erzeugten lokalen Kopien der Vorlagen ein (diese Kopien sind nicht Teil des Repositories).

## Voraussetzungen

- Google-Konto mit Zugriff auf [Google Tabellen](https://sheets.google.com/)
- [Node.js](https://nodejs.org/) 18 oder neuer
- Optional: GitHub-Konto für GitHub Pages

## 1. Konfiguration anlegen

```bash
npm run setup
```

Das Skript `tools/setup-config.js` legt aus den Vorlagen an (falls noch nicht vorhanden):

| Vorlage im Repository | Inhalt |
|-----------------------|--------|
| `token.txt.example` | API- und Login-Passwort |
| `url.txt.example` | Web-App-URL (`…/macros/s/…/exec`) |
| `Bereitstellungs-ID.txt.example` | ID zwischen `/s/` und `/exec` |
| `deploy/js/shield.stub.js` | Basis für `deploy/js/shield.js` |

## 2. Geheimnis festlegen

1. Wähle ein **langes, zufälliges** Passwort (empfohlen: mindestens 32 Zeichen).
2. Trage es in die aus `token.txt.example` erzeugte lokale Datei ein (eine Zeile, ohne `#`).
3. Setze **denselben** Wert in `google-apps-script/App.gs`:

```javascript
var MEIN_GEHEIMER_TOKEN = 'DEIN_GEHEIMES_PASSWORT';
```

Dieser Wert ist gleichzeitig das **Login-Passwort** der Bearbeitungsansicht.

## 3. Google Tabellen und Apps Script

1. Neue Google-Tabelle anlegen.
2. **Erweiterungen → Apps Script**
3. Inhalt von `google-apps-script/App.gs` einfügen (Token anpassen).
4. **Speichern**
5. **Bereitstellen → Neue Bereitstellung → Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
6. URL in die aus `url.txt.example` erzeugte lokale Datei eintragen
7. Bereitstellungs-ID in die aus `Bereitstellungs-ID.txt.example` erzeugte lokale Datei eintragen

Nach jeder Änderung an `App.gs`: Web-App **neu bereitstellen**.

## 4. Frontend bauen

```bash
npm run build
```

Führt aus: `tools/sync-deploy-docs.js`, `tools/build-shield.js`, `tools/build-app.js`

Ergebnis:

- `deploy/js/shield.js` — aus `tools/build-shield.js` (verschlüsselte API-URL)
- `deploy/js/app.min.js` — aus `tools/build-app.js` (gebündeltes Frontend aus `js/app.js`)

## 5. Lokal testen

```bash
./serve.sh
```

Startet einen Server im Ordner `deploy/`. Browser: **http://127.0.0.1:8080**

## 6. GitHub Pages (optional)

1. Repository pushen
2. Vor dem Push: `npm run check-secrets` (`tools/check-no-secrets.js`)
3. **Settings → Pages → Branch: `main`, Ordner: `/deploy`**
4. Nach Änderungen an URL oder Token: `npm run build`

### Was im Repository bleibt

- `token.txt.example`, `url.txt.example`, `Bereitstellungs-ID.txt.example`
- `deploy/js/shield.stub.js` bzw. `deploy/js/shield.js` mit `configured: false`
- `google-apps-script/App.gs` nur mit Platzhalter-Token

## Fehlerbehebung

| Problem | Lösung |
|--------|--------|
| „Installation nicht konfiguriert“ | `npm run setup`, Vorlagen ausfüllen, `npm run build` |
| „Zugriff verweigert: Falscher Token“ | Token in Vorlage/`App.gs` angleichen, Web-App neu bereitstellen |
| Upload „Unbekannte Aktion“ | Aktuelle `App.gs` bereitstellen, `url.txt.example`-Kopie aktualisieren, `npm run build` |
| Login schlägt fehl | Gleiches Passwort wie in `token.txt.example`-Kopie und `App.gs` |

## Anpassungen

| Bereich | Datei im Repository |
|---------|---------------------|
| Frontend-Logik | `js/app.js` → `npm run build` |
| Styling | `deploy/css/app.css`, `deploy/css/splash.css` |
| Backend | `google-apps-script/App.gs` |
| Logo | `deploy/preview_Logo.png` |
| Sounds | `deploy/hover.mp3`, `deploy/input.mp3`, `deploy/loading.mp3`, `deploy/press.mp3` |

---

# YIS – Setup (your own instance)

> **Note:** Backend (`google-apps-script/`), build tools (`tools/`), and `*.example` files are in the **repository root**. Clone the full repository — not only the `deploy/` folder.

This guide uses only files from the repository. After `npm run setup`, enter values in the local copies of the templates (those copies are not part of the repository).

## Requirements

- Google account with access to [Google Sheets](https://sheets.google.com/)
- [Node.js](https://nodejs.org/) 18 or newer
- Optional: GitHub account for GitHub Pages

## 1. Create configuration

```bash
npm run setup
```

The script `tools/setup-config.js` creates from templates (if not already present):

| Template in repository | Content |
|------------------------|---------|
| `token.txt.example` | API and login password |
| `url.txt.example` | Web app URL (`…/macros/s/…/exec`) |
| `Bereitstellungs-ID.txt.example` | ID between `/s/` and `/exec` |
| `deploy/js/shield.stub.js` | Base for `deploy/js/shield.js` |

## 2. Set secret

1. Choose a **long, random** password (recommended: at least 32 characters).
2. Enter it in the local file created from `token.txt.example` (one line, no leading `#`).
3. Set the **same** value in `google-apps-script/App.gs`:

```javascript
var MEIN_GEHEIMER_TOKEN = 'YOUR_SECRET_PASSWORD';
```

This value is also the **login password** for edit mode.

## 3. Google Sheets and Apps Script

1. Create a new Google spreadsheet.
2. **Extensions → Apps Script**
3. Paste content from `google-apps-script/App.gs` (adjust token).
4. **Save**
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Paste URL into the local file created from `url.txt.example`
7. Paste deployment ID into the local file created from `Bereitstellungs-ID.txt.example`

After any change to `App.gs`: **redeploy** the web app.

## 4. Build frontend

```bash
npm run build
```

Runs: `tools/sync-deploy-docs.js`, `tools/build-shield.js`, `tools/build-app.js`

Output:

- `deploy/js/shield.js` — from `tools/build-shield.js` (encrypted API URL)
- `deploy/js/app.min.js` — from `tools/build-app.js` (bundled frontend from `js/app.js`)

## 5. Test locally

```bash
./serve.sh
```

Starts a server in `deploy/`. Browser: **http://127.0.0.1:8080**

## 6. GitHub Pages (optional)

1. Push the repository
2. Before push: `npm run check-secrets` (`tools/check-no-secrets.js`)
3. **Settings → Pages → Branch: `main`, folder: `/deploy`**
4. After URL or token changes: `npm run build`

### What stays in the repository

- `token.txt.example`, `url.txt.example`, `Bereitstellungs-ID.txt.example`
- `deploy/js/shield.stub.js` or `deploy/js/shield.js` with `configured: false`
- `google-apps-script/App.gs` with placeholder token only

## Troubleshooting

| Issue | Solution |
|-------|----------|
| „Installation not configured“ | `npm run setup`, fill templates, `npm run build` |
| „Access denied: wrong token“ | Align token in template/`App.gs`, redeploy web app |
| Upload „Unknown action“ | Deploy current `App.gs`, update `url.txt.example` copy, `npm run build` |
| Login fails | Same password in `token.txt.example` copy and `App.gs` |

## Customization

| Area | File in repository |
|------|-------------------|
| Frontend logic | `js/app.js` → `npm run build` |
| Styling | `deploy/css/app.css`, `deploy/css/splash.css` |
| Backend | `google-apps-script/App.gs` |
| Logo | `deploy/preview_Logo.png` |
| Sounds | `deploy/hover.mp3`, `deploy/input.mp3`, `deploy/loading.mp3`, `deploy/press.mp3` |
