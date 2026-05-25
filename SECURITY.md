# Sicherheit

## Geheimnisse

Die folgenden Dateien gehören **ausschließlich lokal** auf deinen Rechner (siehe `.gitignore`):

| Datei | Inhalt |
|-------|--------|
| `token.txt` | API- und Login-Passwort |
| `url.txt` | Google-Web-App-URL |
| `Bereitstellungs-ID.txt` | Deployment-ID der Web-App |
| `Key.txt` | Veraltet — `token.txt` verwenden |
| `deploy/js/shield.js` | Generiert; enthält verschlüsselte API-URL |

Vor jedem Push:

```bash
npm run check-secrets
```

## Token-Richtlinien

- Mindestens 24 Zeichen, zufällig erzeugt (Passwort-Manager empfohlen)
- Identischer Wert in `token.txt` und `google-apps-script/App.gs`
- Nach einem Leak: Token an beiden Stellen ändern und die Web-App neu bereitstellen

## Öffentlicher Zugriff

Ohne Token sind nur Lesezugriffe mit bekannter Seriennummer möglich (`get`, Dateiabruf). Schreiben, Listen und Uploads erfordern das Token bzw. eine Anmeldung in der Bearbeitungsansicht.

## Meldungen

Sicherheitsprobleme bitte **nicht** als öffentliches Issue mit echten Tokens, URLs oder Screenshots sensibler Daten melden. Kontaktiere den Repository-Betreiber direkt.
