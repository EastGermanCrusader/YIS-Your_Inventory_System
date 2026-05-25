# YIS – Your Inventory System

Open-Source **Inventarsystem**: HTML-Frontend, Google Tabellen als Datenbank, [Google Apps Script](https://developers.google.com/apps-script) als API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Funktionen

- **Öffentliche Ansicht**: Akte per QR / Link `?sn=SERIENNUMMER` (ohne Login)
- **Bearbeitung** (mit Passwort): Inventar pflegen, Seriennummern (`YIS-YYYYMMDD-0001`), QR-Codes
- **Anlagen** pro Akte (bis 1,5 MB, in Tabellenblatt „Anlagen“)
- UI-Sounds, Splash-Screen, Fehlerprotokoll

## Schnellstart (eigene Instanz)

```bash
git clone <dein-repo-url>
cd yis   # oder dein Klon-Ordnername
npm run setup          # *.example → lokale Config
# token.txt, url.txt, Bereitstellungs-ID.txt + App.gs ausfüllen (siehe SETUP.md)
npm run build
./serve.sh             # http://127.0.0.1:8080
```

**Ausführliche Anleitung:** [SETUP.md](SETUP.md)

## Projektstruktur

| Pfad | Zweck |
|------|--------|
| **`deploy/`** | Statische Website für GitHub Pages |
| `js/app.js` | Frontend-Quellcode (Entwicklung) |
| `google-apps-script/App.gs` | Backend (in Google deployen) |
| `tools/` | Build & Konfiguration |
| `*.example` | Vorlagen ohne Geheimnisse |
| `token.txt`, `url.txt`, … | **Lokal**, in `.gitignore` |

## GitHub Pages

Der Ordner **`deploy/`** enthält die komplette Website **und** die Dokumentation (`README.md`, `LICENSE`, `SETUP.md`, `SECURITY.md`).

1. Repository pushen (`npm run check-secrets` vorher empfohlen)
2. **Settings → Pages → Ordner `/deploy`**
3. Dokumentation nach `deploy/` aktualisieren: `npm run sync-deploy` (läuft auch bei `npm run build`)
4. Für **deine** Instanz lokal: `npm run build` – gebaute `shield.js` nicht committen

Generiertes `deploy/js/shield.js` enthält verschlüsselte URLs — standardmäßig **nicht** committen. Jeder Betreiber baut seine eigene `shield.js`.

## Sicherheit

| Ebene | Beschreibung |
|--------|----------------|
| **Token** | Schützt `list`, Schreiben, Uploads (`token.txt` = `App.gs`) |
| **Öffentlich** | Nur `get?sn=…` und Dateiabruf mit Seriennummer |
| **shield.js** | API-URL AES-256-GCM; Entschlüsselung nach Login |

**Niemals** `token.txt`, `url.txt` oder ein gebautes `shield.js` mit echten Werten ins öffentliche Repo legen.

## Lizenz

[MIT](LICENSE) — freie Nutzung, Änderung und Weitergabe. Keine Gewährleistung.

## Beitragen

Forks und Pull Requests willkommen. Bitte keine echten Tokens, URLs oder Keys in Commits.

---

## Inhalt dieses Ordners (GitHub Pages)

Dieser Ordner ist die **statische Website** für GitHub Pages.

| Datei / Ordner | Zweck |
|----------------|--------|
| `index.html` | Einstieg |
| `.nojekyll` | Jekyll auf Pages deaktivieren |
| `LICENSE` | MIT-Lizenz |
| `SETUP.md` | Einrichtung eigener Instanz |
| `SECURITY.md` | Sicherheitshinweise |
| `css/`, `js/`, `fonts/` | Frontend |
| `*.mp3`, `L-W_Monogramm_n.b.png` | Assets |

**Pages-Einstellung:** Branch `main`, Ordner **`/deploy`**.

`js/shield.js` hier ist ein **Platzhalter**. Für deine API lokal im Repo-Root: `npm run build` (gebaute Version nicht committen).
