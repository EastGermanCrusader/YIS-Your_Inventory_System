# Sicherheit

## Geheimnisse

Diese Dateien gehören **nur lokal** auf deinen Rechner (siehe `.gitignore`):

- `token.txt` – API- und Login-Passwort
- `url.txt` – Google Web-App-URL
- `Bereitstellungs-ID.txt` – Deployment-ID
- `deploy/js/shield.js` – generiert, enthält verschlüsselte URL

Vor einem Push: `npm run check-secrets`

## Token-Richtlinien

- Mindestens 24 Zeichen, zufällig (Passwort-Manager)
- Gleicher Wert in `token.txt` und `google-apps-script/App.gs`
- Nach Leak: Token in beiden Stellen ändern und Web-App neu bereitstellen

## Meldungen

Sicherheitsprobleme bitte nicht als öffentliches Issue mit echten Tokens posten.
