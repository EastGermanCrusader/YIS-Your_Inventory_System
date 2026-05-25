#!/usr/bin/env bash
# YIS – lokaler Entwicklungsserver (vermeidet file://-Einschränkungen)
set -euo pipefail
cd "$(dirname "$0")/deploy"
echo "YIS – Your Inventory System"
echo "  → http://127.0.0.1:8080"
echo "  Beenden: Strg+C"
exec python3 -m http.server 8080 --bind 127.0.0.1
