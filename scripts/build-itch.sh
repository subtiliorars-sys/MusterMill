#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rm -rf dist/.git
rm -f dist/mustermill-itch.zip
(cd dist && zip -r mustermill-itch.zip . -x '*.map' -x '.git/*')
echo "Ready: dist/mustermill-itch.zip ($(du -h dist/mustermill-itch.zip | cut -f1))"
