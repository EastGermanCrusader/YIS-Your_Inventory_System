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
# token.txt, url.txt, Bereitstellungs-ID.txt und App.gs ausfüllen — siehe SETUP.md
npm run build
./serve.sh
```

Browser: **http://127.0.0.1:8080** (nicht per `file://` öffnen).

**Lokale Arbeitskopie mit Geheimnissen:** Ordner `privat/` (wird nicht auf GitHub gepusht). Einrichtung: `npm run sync-privat`, dann `cd privat && ./serve.sh`.

**Ausführliche Anleitung:** [SETUP.md](SETUP.md)

## Projektstruktur

| Pfad | Zweck |
|------|--------|
| `deploy/` | Statische Website für [GitHub Pages](https://pages.github.com/) |
| `deploy/demo.gif` | Demo-Aufnahme der Anwendung |
| `js/app.js` | Frontend-Quellcode (Entwicklung) |
| `google-apps-script/App.gs` | Backend (in Google bereitstellen) |
| `tools/` | Build und Konfiguration |
| `*.example` | Vorlagen ohne Geheimnisse |
| `token.txt`, `url.txt`, … | **Nur lokal** — in `.gitignore` |

## GitHub Pages

Der Ordner **`deploy/`** enthält die komplette Website sowie die Dokumentation (`README.md`, `LICENSE`, `SETUP.md`, `SECURITY.md`).

1. Vor dem Push: `npm run check-secrets`
2. Repository pushen
3. **Settings → Pages → Branch `main`, Ordner `/deploy`**
4. Dokumentation aktualisieren: `npm run sync-deploy` (läuft auch bei `npm run build`)
5. Eigene Instanz: `npm run build` lokal — gebaute `shield.js` mit echten Werten **nicht** committen

`deploy/js/shield.js` enthält nach dem Build eine verschlüsselte API-URL (AES-256-GCM). Im Repository liegt standardmäßig nur ein Platzhalter; jede Installation baut ihre eigene Version.

## Sicherheit

| Ebene | Beschreibung |
|--------|----------------|
| **Token** | Schützt `list`, Schreibvorgänge und Uploads (`token.txt` = `App.gs`) |
| **Öffentlich** | Nur `get?sn=…` und Dateiabruf mit gültiger Seriennummer |
| **shield.js** | API-URL verschlüsselt; Entschlüsselung nach Anmeldung |

Details: [SECURITY.md](SECURITY.md)

**Niemals** `token.txt`, `url.txt`, `Key.txt` oder ein konfiguriertes `shield.js` ins öffentliche Repository legen.

## Lizenz

[MIT](LICENSE) — freie Nutzung, Änderung und Weitergabe. Keine Gewährleistung.

## Beitragen

Forks und Pull Requests sind willkommen. Bitte keine echten Tokens, URLs oder Schlüssel in Commits.

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
# Fill in token.txt, url.txt, Bereitstellungs-ID.txt and App.gs — see SETUP.md
npm run build
./serve.sh
```

Open **http://127.0.0.1:8080** in your browser (do not use `file://`).

**Local copy with secrets:** use the `privat/` folder (not pushed to GitHub). Run `npm run sync-privat`, then `cd privat && ./serve.sh`.

**Full setup guide:** [SETUP.md](SETUP.md)

## Project structure

| Path | Purpose |
|------|---------|
| `deploy/` | Static site for [GitHub Pages](https://pages.github.com/) |
| `deploy/demo.gif` | Application demo recording |
| `js/app.js` | Frontend source (development) |
| `google-apps-script/App.gs` | Backend (deploy in Google) |
| `tools/` | Build and configuration |
| `*.example` | Templates without secrets |
| `token.txt`, `url.txt`, … | **Local only** — listed in `.gitignore` |

## GitHub Pages

The **`deploy/`** folder contains the full website and documentation (`README.md`, `LICENSE`, `SETUP.md`, `SECURITY.md`).

1. Before pushing: `npm run check-secrets`
2. Push the repository
3. **Settings → Pages → Branch `main`, folder `/deploy`**
4. Refresh docs in deploy: `npm run sync-deploy` (also runs on `npm run build`)
5. For your instance: run `npm run build` locally — do **not** commit a configured `shield.js`

After build, `deploy/js/shield.js` holds an encrypted API URL (AES-256-GCM). The public repo ships a placeholder; each operator builds their own file.

## Security

| Layer | Description |
|-------|-------------|
| **Token** | Protects `list`, writes, and uploads (`token.txt` = `App.gs`) |
| **Public** | Only `get?sn=…` and file access with a valid serial number |
| **shield.js** | Encrypted API URL; decrypted after login |

Details: [SECURITY.md](SECURITY.md)

Never commit `token.txt`, `url.txt`, `Key.txt`, or a configured `shield.js` to a public repository.

## License

[MIT](LICENSE) — use, modify, and distribute freely. No warranty.

## Contributing

Forks and pull requests are welcome. Do not include real tokens, URLs, or keys in commits.
