# YIS – Your Inventory System – Einrichtung (eigene Instanz)

> **Hinweis:** Backend (`google-apps-script/`), Build-Tools (`tools/`) und `*.example`-Dateien liegen im **Repository-Root**. Für die Einrichtung das vollständige Repo klonen, nicht nur den Ordner `deploy/`.

Diese Anleitung richtet **deine** Kopie ein. Geheimnisse bleiben lokal und werden **nicht** ins Repository hochgeladen.

## Voraussetzungen

- Google-Konto mit Google Tabellen
- [Node.js](https://nodejs.org/) (für Build)
- Optional: GitHub-Konto für Pages

## 1. Konfiguration anlegen

```bash
npm run setup
```

Erzeugt aus den Vorlagen (falls noch nicht vorhanden):

| Datei | Inhalt |
|-------|--------|
| `token.txt` | Geheimes API-/Login-Passwort |
| `url.txt` | Web-App-URL (`…/macros/s/…/exec`) |
| `Bereitstellungs-ID.txt` | ID aus der URL (zwischen `/s/` und `/exec`) |
| `deploy/js/shield.js` | Platzhalter (wird beim Build ersetzt) |

## 2. Geheimnis festlegen

1. Wähle ein **langes, zufälliges** Passwort (z. B. 32+ Zeichen).
2. Trage es in **`token.txt`** ein (eine Zeile, ohne `#`).
3. Setze **denselben** Wert in `google-apps-script/App.gs`:

```javascript
var MEIN_GEHEIMER_TOKEN = 'DEIN_GEHEIMES_PASSWORT';
```

Das ist gleichzeitig das **Login-Passwort** der Bearbeitungsansicht.

## 3. Google Tabellen & Apps Script

1. Neue Google-Tabelle anlegen.
2. **Erweiterungen → Apps Script**
3. Inhalt von `google-apps-script/App.gs` einfügen (Token anpassen!).
4. **Speichern**
5. **Bereitstellen → Neue Bereitstellung → Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
6. URL kopieren → `url.txt`
7. Bereitstellungs-ID (Teil der URL) → `Bereitstellungs-ID.txt`

Bei jeder Änderung an `App.gs`: **neu bereitstellen** (neue Version oder neue Bereitstellung).

## 4. Frontend bauen

```bash
npm run build
```

Erzeugt:

- `deploy/js/shield.js` – verschlüsselte API-URL (lokal, **nicht committen**)
- `deploy/js/app.min.js` – Produktions-Frontend

## 5. Lokal testen

```bash
./serve.sh
```

Browser: http://127.0.0.1:8080 — **nicht** per `file://` öffnen.

## 6. GitHub Pages (optional)

1. Repository anlegen und Code pushen.
2. Vor jedem Push: `npm run check-secrets` (prüft auf versehentliche Tokens).
3. **Settings → Pages → Branch: `main`, Ordner: `/deploy`**
4. Nach URL-/Token-Änderung: `npm run build` und nur `deploy/` deployen (ohne deine `token.txt`).

### Was wird **nicht** veröffentlicht?

- `token.txt`, `url.txt`, `Bereitstellungs-ID.txt`, `Key.txt`
- Gebaute `deploy/js/shield.js` mit `configured:true` (nur Platzhalter committen)

Forks erhalten nur Platzhalter und Beispieldateien (`*.example`).

## Fehlerbehebung

| Problem | Lösung |
|--------|--------|
| „Installation nicht konfiguriert“ | `npm run setup`, Werte eintragen, `npm run build` |
| „Zugriff verweigert: Falscher Token“ | Token in `token.txt` = Token in `App.gs`, neu bereitstellen |
| Upload „Unbekannte Aktion“ | Aktuelle `App.gs` deployen, `url.txt` aktualisieren, `npm run build` |
| Login schlägt fehl | Gleiches Passwort wie in `token.txt` / `App.gs` |

## Eigene Anpassungen

- Frontend-Quellcode: `js/app.js` → danach `npm run build`
- Styling: `deploy/css/`
- Backend-Logik: `google-apps-script/App.gs`

## Schrift & Logo

- Schrift **Anurati**: Lizenz des Font-Autors beachten (siehe Font-Paket).
- Logo `L-W_Monogramm_n.b.png` im Ordner `deploy/` durch eigenes Bild ersetzen, falls gewünscht.
