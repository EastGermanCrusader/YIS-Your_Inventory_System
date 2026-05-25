English Version below

# YIS – Your Inventory System

Open-Source-**Inventarsystem** mit statischem Web-Frontend, Google Tabellen als Datenbank und [Google Apps Script](https://developers.google.com/apps-script) als API — ohne eigenen Server.

![Demo der YIS-Oberfläche](deploy/demo.gif)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Funktionen

| Bereich | Beschreibung |
|--------|----------------|
| **Öffentliche Ansicht** | Akte per QR-Code oder Link `?sn=SERIENNUMMER` — ohne Anmeldung |
| **Bearbeitung** | Inventar pflegen, Seriennummern (`YIS-YYYYMMDD-0001`), QR-Codes — mit Passwort |
| **Anlagen** | Dateien pro Akte (bis 1,5 MB), gespeichert im Tabellenblatt „Anlagen“ |
| **Oberfläche** | Splash-Screen, UI-Sounds, integriertes Fehlerprotokoll |

## Schnellstart

```bash
git clone https://github.com/EastGermanCrusader/YIS-Your_Inventory_System.git
cd YIS-Your_Inventory_System
npm run setup
# Vorlagen (*.example) ausfüllen und App.gs anpassen — siehe SETUP.md
npm run build
./serve.sh
```

Browser: **http://127.0.0.1:8080** (nicht per `file://` öffnen).

**Ausführliche Anleitung:** [SETUP.md](SETUP.md)

## Projektstruktur

| Pfad | Zweck |
|------|--------|
| `deploy/` | Statische Website für [GitHub Pages](https://pages.github.com/) |
| `deploy/index.html` | Einstieg der Web-App |
| `deploy/demo.gif` | Demo-Aufnahme |
| `deploy/preview_Logo.png` | Logo |
| `deploy/css/` | Stylesheets |
| `deploy/js/` | Frontend (inkl. `shield.stub.js`, `app.min.js`) |
| `js/app.js` | Frontend-Quellcode |
| `google-apps-script/App.gs` | Backend (in Google bereitstellen) |
| `tools/` | Build-Skripte (`build-app.js`, `build-shield.js`, …) |
| `token.txt.example` | Vorlage API-/Login-Passwort |
| `url.txt.example` | Vorlage Web-App-URL |
| `Bereitstellungs-ID.txt.example` | Vorlage Bereitstellungs-ID |
| `package.json` | npm-Skripte (`setup`, `build`, `check-secrets`, …) |
| `serve.sh` | Lokaler Testserver |

## GitHub Pages

Der Ordner **`deploy/`** enthält Website und Kopien der Dokumentation (`README.md`, `LICENSE`, `SETUP.md`, `SECURITY.md`).

1. Vor dem Push: `npm run check-secrets` (siehe `tools/check-no-secrets.js`)
2. Repository pushen
3. **Settings → Pages → Branch `main`, Ordner `/deploy`**
4. Dokumentation aktualisieren: `npm run sync-deploy` (auch Teil von `npm run build`)

Im Repository liegt `deploy/js/shield.stub.js` als Platzhalter. `npm run build` erzeugt über `tools/build-shield.js` eine instanzspezifische `deploy/js/shield.js` (AES-256-GCM).

## Sicherheit

| Ebene | Datei im Repository | Beschreibung |
|--------|---------------------|----------------|
| **Token** | `token.txt.example`, `google-apps-script/App.gs` | Gleicher Wert in beiden nach dem Setup |
| **Öffentlich** | `google-apps-script/App.gs` | Nur `get?sn=…` und Dateiabruf mit Seriennummer |
| **shield.js** | `deploy/js/shield.stub.js` | Platzhalter; Build über `tools/build-shield.js` |

Details: [SECURITY.md](SECURITY.md)

## Lizenz

[MIT](LICENSE) — freie Nutzung, Änderung und Weitergabe. Keine Gewährleistung.

## Beitragen

Forks und Pull Requests sind willkommen. Keine echten Geheimnisse in `google-apps-script/App.gs`, `deploy/js/shield.js` oder anderen getrackten Dateien.

---

# English

# YIS – Your Inventory System

Open-source **inventory management** with a static web frontend, Google Sheets as the database, and [Google Apps Script](https://developers.google.com/apps-script) as the API — no dedicated server required.

![YIS application demo](deploy/demo.gif)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

| Area | Description |
|------|-------------|
| **Public view** | Access records via QR code or link `?sn=SERIAL_NUMBER` — no login |
| **Edit mode** | Manage inventory, serial numbers (`YIS-YYYYMMDD-0001`), QR codes — password protected |
| **Attachments** | Files per record (up to 1.5 MB), stored in the „Anlagen“ sheet |
| **UI** | Splash screen, UI sounds, built-in error log |

## Quick start

```bash
git clone https://github.com/EastGermanCrusader/YIS-Your_Inventory_System.git
cd YIS-Your_Inventory_System
npm run setup
# Fill in *.example templates and edit App.gs — see SETUP.md
npm run build
./serve.sh
```

Open **http://127.0.0.1:8080** in your browser (do not use `file://`).

**Full setup guide:** [SETUP.md](SETUP.md)

## Project structure

| Path | Purpose |
|------|---------|
| `deploy/` | Static site for [GitHub Pages](https://pages.github.com/) |
| `deploy/index.html` | Web app entry point |
| `deploy/demo.gif` | Demo recording |
| `deploy/preview_Logo.png` | Logo |
| `deploy/css/` | Stylesheets |
| `deploy/js/` | Frontend (incl. `shield.stub.js`, `app.min.js`) |
| `js/app.js` | Frontend source |
| `google-apps-script/App.gs` | Backend (deploy in Google) |
| `tools/` | Build scripts (`build-app.js`, `build-shield.js`, …) |
| `token.txt.example` | API/login password template |
| `url.txt.example` | Web app URL template |
| `Bereitstellungs-ID.txt.example` | Deployment ID template |
| `package.json` | npm scripts (`setup`, `build`, `check-secrets`, …) |
| `serve.sh` | Local test server |

## GitHub Pages

The **`deploy/`** folder contains the site and copies of the docs (`README.md`, `LICENSE`, `SETUP.md`, `SECURITY.md`).

1. Before pushing: `npm run check-secrets` (see `tools/check-no-secrets.js`)
2. Push the repository
3. **Settings → Pages → Branch `main`, folder `/deploy`**
4. Refresh deploy docs: `npm run sync-deploy` (also runs in `npm run build`)

The repo includes `deploy/js/shield.stub.js` as a placeholder. `npm run build` uses `tools/build-shield.js` to produce an instance-specific `deploy/js/shield.js` (AES-256-GCM).

## Security

| Layer | File in repository | Description |
|-------|-------------------|-------------|
| **Token** | `token.txt.example`, `google-apps-script/App.gs` | Same value in both after setup |
| **Public** | `google-apps-script/App.gs` | Only `get?sn=…` and file access with serial number |
| **shield.js** | `deploy/js/shield.stub.js` | Placeholder; build via `tools/build-shield.js` |

Details: [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE) — use, modify, and distribute freely. No warranty.

## Contributing

Forks and pull requests are welcome. Do not put real secrets in tracked files such as `google-apps-script/App.gs` or `deploy/js/shield.js`.
