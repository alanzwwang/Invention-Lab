#!/bin/bash
# Rebuilds the Deep Dive data and copies only the files the website needs into alanwang.info/public/inventions
# (no source JSON, briefs or queues). Also refreshes the Desktop copy (full, with sources and tools).
set -e
S="C:/Users/e/AppData/Local/Temp/claude/C--Users-e-repos-github-alanzwwang-alanwang-info/a0cb7c20-d149-4f7d-b0b8-e526990a52aa/scratchpad"
SITE="$S/inventions"
OUT="C:/Users/e/repos/github/alanzwwang/alanwang.info/public/inventions"
DESK="C:/Users/e/OneDrive/Desktop/Alan Stuff/Webpages/Invention Lab Webpage"

node "$S/inventions-tools/build-data.js" "$SITE" | tail -1
node "$S/inventions-tools/build-deep.js" "$SITE" | head -1

rm -rf "$OUT"
mkdir -p "$OUT/data" "$OUT/deep/data"
cp "$SITE"/index.html "$SITE"/style.css "$SITE"/script.js "$SITE"/deep.html "$SITE"/deep.css "$SITE"/deep.js "$OUT/"
cp "$SITE"/data/inventions.js "$SITE"/data/credits.js "$OUT/data/"
cp "$SITE"/deep/data/*.js "$OUT/deep/data/"
cp -r "$SITE/img" "$OUT/img"
echo "website copy: $(find "$OUT" -type f | wc -l) files, $(du -sh "$OUT" | cut -f1)"

# only the real site files + sources (helpers' scratch files sometimes land in $SITE)
cp "$SITE"/index.html "$SITE"/style.css "$SITE"/script.js "$SITE"/deep.html "$SITE"/deep.css "$SITE"/deep.js "$DESK/"
cp -r "$SITE/data" "$SITE/deep" "$SITE/img" "$DESK/"
find "$DESK" -maxdepth 1 -type f \( -name '*.json' -o -name 'fix*.js' -o -name 'dump*.js' \) -delete
cp "$S"/inventions-tools/*.js "$S"/inventions-tools/*.sh "$DESK/tools/"
echo "desktop copy refreshed"
