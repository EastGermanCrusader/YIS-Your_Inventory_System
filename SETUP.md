# YIS – Einrichtung (eigene Instanz)

> **Hinweis:** Backend (`google-apps-script/`), Build-Tools (`tools/`) und `*.example`-Dateien liegen im **Repository-Root**. Klone das vollständige Repository — nicht nur den Ordner `deploy/`.

Diese Anleitung richtet **deine** Installation ein. Geheimnisse bleiben auf deinem Rechner und werden **nicht** ins Repository hochgeladen.

## Voraussetzungen

- Google-Konto mit Zugriff auf [Google Tabellen](https://sheets.google.com/)
- [Node.js](https://nodejs.org/) 18 oder neuer (für den Build)
- Optional: GitHub-Konto für GitHub Pages

## 1. Konfiguration anlegen

```bash
npm run setup
```

Erzeugt aus den Vorlagen (bestehende Dateien werden nicht überschrieben):

| Datei | Inhalt |
|-------|--------|
| `token.txt` | Geheimes API- und Login-Passwort |
| `url.txt` | Web-App-URL (`…/macros/s/…/exec`) |
| `Bereitstellungs-ID.txt` | ID aus der URL (zwischen `/s/` und `/exec`) |
| `deploy/js/shield.js` | Platzhalter (wird beim Build ersetzt) |

## 2. Geheimnis festlegen

1. Wähle ein **langes, zufälliges** Passwort (empfohlen: mindestens 32 Zeichen).
2. Trage es in **`token.txt`** ein (eine Zeile, ohne führendes `#`).
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
6. Bereitgestellte URL kopieren → `url.txt`
7. Bereitstellungs-ID (Teil der URL) → `Bereitstellungs-ID.txt`

Nach jeder Änderung an `App.gs`: Web-App **neu bereitstellen** (neue Version oder neue Bereitstellung).

## 4. Frontend bauen

```bash
npm run build
```

Erzeugt:

- `deploy/js/shield.js` — verschlüsselte API-URL (lokal, **nicht committen**)
- `deploy/js/app.min.js` — Produktions-Frontend

## 5. Lokal testen

```bash
./serve.sh
```

Browser: **http://127.0.0.1:8080** — die App nicht per `file://` öffnen.

## 6. GitHub Pages (optional)

1. Repository anlegen und Code pushen.
2. Vor jedem Push: `npm run check-secrets`
3. **Settings → Pages → Branch: `main`, Ordner: `/deploy`**
4. Nach Änderungen an URL oder Token: `npm run build` und nur den Inhalt von `deploy/` veröffentlichen.

### Was wird nicht veröffentlicht?

- `token.txt`, `url.txt`, `Bereitstellungs-ID.txt`, `Key.txt`
- Gebaute `deploy/js/shield.js` mit `configured:true` (nur Platzhalter committen)

Forks erhalten ausschließlich Platzhalter und Beispieldateien (`*.example`).

## Fehlerbehebung

| Problem | Lösung |
|--------|--------|
| „Installation nicht konfiguriert“ | `npm run setup`, Werte eintragen, `npm run build` |
| „Zugriff verweigert: Falscher Token“ | Token in `token.txt` = Token in `App.gs`, Web-App neu bereitstellen |
| Upload „Unbekannte Aktion“ | Aktuelle `App.gs` bereitstellen, `url.txt` aktualisieren, `npm run build` |
| Login schlägt fehl | Gleiches Passwort wie in `token.txt` / `App.gs` |

## Anpassungen

| Bereich | Datei |
|---------|--------|
| Frontend-Logik | `js/app.js` → danach `npm run build` |
| Styling | `deploy/css/` |
| Backend | `google-apps-script/App.gs` |
| Logo | `deploy/preview_Logo.png` ersetzen |

## Schrift

Die Schrift **Anurati** ist lokal im Font-Paket enthalten — Lizenz des Autors beachten (siehe Font-Verzeichnis).
