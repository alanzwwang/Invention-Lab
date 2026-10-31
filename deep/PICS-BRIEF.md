# Brief for Deep Dive PICTURE FINDERS

"Invention Lab" is a public educational site made by an 11-year-old (Alan), read by ages ~9 to adult. Each Deep
Dive chapter (`deep/src/<slug>/part-NN.json`) lists 3 wanted pictures in `pics`: `{ want, search }`. Your job is to
find, download and credit a real, free-licensed picture for each one, for the parts you are given.

Tool (run with node; paths below are absolute):
TOOLS = C:/Users/e/AppData/Local/Temp/claude/C--Users-e-repos-github-alanzwwang-alanwang-info/a0cb7c20-d149-4f7d-b0b8-e526990a52aa/scratchpad/inventions-tools
- `node TOOLS/commons.js search "<keywords>" [count]`  → free-licensed Wikimedia Commons candidates (title, size, license, author, description)
- `node TOOLS/commons.js info "File:Name.jpg"`          → details of one file
- `node TOOLS/commons.js get "File:Name.jpg" <out.jpg>` → downloads it (max 1000 px wide, flattened to JPEG) and prints its credit JSON
It only accepts Public Domain / CC0 / CC BY / CC BY-SA / GFDL files. Commons rate-limits: if a command fails, wait a few
seconds and retry; never run more than one command at a time.

## For each part NN in your range, for each picture K = 1, 2, 3
1. Search with the `search` keywords; if results are poor, try 2–4 other keyword sets (names, object, museum, "engraving",
   "diagram", "patent", place names). Prefer: real museum objects, historical photos/engravings/portraits, diagrams,
   documents, buildings, and clear modern photos. At least ~500 px wide.
2. Download the best match to `inventions/img/deep/<slug>/NN-K.jpg` (NN two digits, e.g. `img/deep/rockets/03-2.jpg`).
3. LOOK at the downloaded file with the Read tool. Keep it only if it really shows what you say it shows and is right for
   kids: no gore, corpses, graphic injury or war atrocity photos, no nudity, nothing frightening, no hate symbols as the
   subject (a historical WWII rocket is fine; a swastika banner is not), no watermarks covering the image, not blurry.
   If it fails, delete it and try another. If nothing suitable exists after a fair try, skip that picture (better none
   than a wrong one). A picture that fits the chapter but differs from `want` is fine — just caption it truthfully.
4. Avoid using the same Commons file twice in one story.

## Record credits
Write ONE file for your range: `inventions/deep/src/<slug>/pics-AA-BB.json` (AA-BB = your first and last part), an
object keyed "NN-K":
```json
{ "03-2": { "file": "Congreve rockets.jpg", "url": "https://commons.wikimedia.org/wiki/File:...", "author": "...",
            "license": "Public domain", "caption": "A short, TRUE caption of what the picture actually shows (max ~20 words)" } }
```
Copy file/url/author/license exactly from the `get` output; write the caption yourself from what you saw and the
file's description. Keep the file valid JSON (re-check with node at the end). Touch nothing else.

Return a short report: how many pictures saved out of how many wanted, and which were skipped and why.
