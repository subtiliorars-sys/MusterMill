#!/usr/bin/env bash
# Deploy built dist/ to gh-pages branch for GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rm -rf /tmp/mustermill-pages
cp -a dist /tmp/mustermill-pages
cd /tmp/mustermill-pages
git init -b gh-pages
git add -A
git commit -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/subtiliorars-sys/MusterMill.git
git push -f origin gh-pages
echo "Live: https://subtiliorars-sys.github.io/MusterMill/"
