#!/usr/bin/env bash
# Lokaler Test-Server (vermeidet file://-Probleme) – dient aus deploy/
cd "$(dirname "$0")/deploy"
echo "YIS: http://127.0.0.1:8080"
echo "Beenden mit Strg+C"
python3 -m http.server 8080 --bind 127.0.0.1
