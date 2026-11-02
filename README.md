# Invention Lab 🔧

**Version:** V.1.3

<!-- WHATS-NEW:README:START -->
## 🆕 What's New in V.1.3

- NEW!!! This What's New pop-up: every update now tells you what changed

### Earlier updates

- **V.1.2:** All 280 Deep Dive chapters fact-checked, Discovering an invention now takes 5 minutes of reading (no more button spamming!), Chapters count as read after 5 minutes, Version badge on the pages

_When you open it, a What's New pop-up shows this once per version. Add `?whatsnew` to the address to see it again._
<!-- WHATS-NEW:README:END -->

A giant educational website about the inventions that changed the world.

- **The Lab:** 140 inventions with facts, quizzes, a timeline, games and three reading levels (Kid / Explorer / Expert).
- **The Deep Dive Library:** 14 huge stories (printing press, telescope, steam engine, railways, electricity, telephone, photography, automobile, airplane, rockets, vaccines, computer, internet, smartphone), each with 20 chapters. That's more than a million words, with photos and sources for every chapter.

Play it live at **https://alanwang.info/inventions/**

## Run it yourself
Just open `index.html` in a browser. No build step needed.

## Folders
- `index.html`, `style.css`, `script.js`: the main Lab
- `deep.html`, `deep.css`, `deep.js`: the Deep Dive reader
- `data/`: invention data and photo credits
- `deep/src/`: the story chapters (JSON); `deep/data/` is built from them
- `img/`: pictures (free-licence photos from Wikimedia Commons, credited in the site)
- `tools/`: scripts that rebuild the data (`node tools/build-deep.js .`)
