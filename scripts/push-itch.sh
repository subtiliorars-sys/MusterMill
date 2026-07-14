#!/usr/bin/env bash
# Push itch zip via butler when credentials exist; else print manual steps.
set -euo pipefail
cd "$(dirname "$0")/.."

npm test
npm run build:itch

if butler status "${ITCH_USER:-subtiliorars}/${ITCH_PROJECT:-mustermill}" >/dev/null 2>&1; then
  butler push dist/mustermill-itch.zip "${ITCH_USER:-subtiliorars}/${ITCH_PROJECT:-mustermill}:html"
  echo "Pushed to itch html channel."
else
  echo "Butler not logged in — manual upload:"
  echo "  dist/mustermill-itch.zip"
  echo "See docs/ITCH_UPLOAD.md"
  exit 0
fi
