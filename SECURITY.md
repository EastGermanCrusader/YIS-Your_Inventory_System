English Version below

# Sicherheit

## Konfiguration im Repository

Diese Dateien gehören zum Repository und dürfen **keine echten Geheimnisse** enthalten:

| Datei | Zweck |
|-------|--------|
| `token.txt.example` | Vorlage für API- und Login-Passwort |
| `url.txt.example` | Vorlage für die Google-Web-App-URL |
| `Bereitstellungs-ID.txt.example` | Vorlage für die Bereitstellungs-ID |
| `Key.txt.example` | Veraltete Vorlage — `token.txt.example` verwenden |
| `google-apps-script/App.gs` | Backend; Platzhalter `MEIN_GEHEIMER_TOKEN` vor Bereitstellung ersetzen |
| `deploy/js/shield.stub.js` | Unkonfigurierter Platzhalter für die API-URL |
| `deploy/js/shield.js` | Nur Platzhalter committen (`configured: false`) |
| `tools/check-no-secrets.js` | Prüfung vor dem Push |

Vor jedem Push:

```bash
npm run check-secrets
```

Das Skript `tools/check-no-secrets.js` prüft unter anderem `google-apps-script/App.gs`, `deploy/js/shield.js` und `js/app.js`.

## Token-Richtlinien

- Mindestens 24 Zeichen, zufällig erzeugt (Passwort-Manager empfohlen)
- Gleicher Wert in `token.txt.example` (nach `npm run setup` lokal ausfüllen) und `MEIN_GEHEIMER_TOKEN` in `google-apps-script/App.gs`
- Nach einem Leak: Token in `App.gs` ändern und die Web-App neu bereitstellen

## Öffentlicher Zugriff

In `google-apps-script/App.gs` sind ohne Token nur Lesezugriffe mit bekannter Seriennummer vorgesehen (`get`, Dateiabruf). Schreiben, Listen und Uploads erfordern das Token bzw. die Anmeldung in der Bearbeitungsansicht.

## Build

`tools/build-shield.js` erzeugt `deploy/js/shield.js` mit verschlüsselter URL. Commits sollten nur den Platzhalter aus `deploy/js/shield.stub.js` bzw. `configured: false` enthalten.

## Meldungen

Sicherheitsprobleme bitte **nicht** als öffentliches Issue mit echten Tokens, URLs oder Screenshots sensibler Daten melden. Kontaktiere den Repository-Betreiber direkt.

---

# Security

## Configuration in the repository

These files are part of the repository and must **not** contain real secrets:

| File | Purpose |
|------|---------|
| `token.txt.example` | Template for API and login password |
| `url.txt.example` | Template for the Google web app URL |
| `Bereitstellungs-ID.txt.example` | Template for the deployment ID |
| `Key.txt.example` | Deprecated template — use `token.txt.example` |
| `google-apps-script/App.gs` | Backend; replace placeholder `MEIN_GEHEIMER_TOKEN` before deploy |
| `deploy/js/shield.stub.js` | Unconfigured placeholder for the API URL |
| `deploy/js/shield.js` | Commit placeholder only (`configured: false`) |
| `tools/check-no-secrets.js` | Pre-push check |

Before every push:

```bash
npm run check-secrets
```

The script `tools/check-no-secrets.js` checks among others `google-apps-script/App.gs`, `deploy/js/shield.js`, and `js/app.js`.

## Token guidelines

- At least 24 characters, randomly generated (password manager recommended)
- Same value in `token.txt.example` (fill locally after `npm run setup`) and `MEIN_GEHEIMER_TOKEN` in `google-apps-script/App.gs`
- After a leak: change the token in `App.gs` and redeploy the web app

## Public access

In `google-apps-script/App.gs`, without a token only read access with a known serial number is allowed (`get`, file retrieval). Writing, listing, and uploads require the token or login in edit mode.

## Build

`tools/build-shield.js` produces `deploy/js/shield.js` with an encrypted URL. Commits should only contain the placeholder from `deploy/js/shield.stub.js` or `configured: false`.

## Reports

Please do **not** report security issues as a public issue with real tokens, URLs, or screenshots of sensitive data. Contact the repository maintainer directly.
