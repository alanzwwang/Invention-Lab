# Brief for Deep Dive FACT-CHECKERS

"Invention Lab" is a public educational site made by an 11-year-old (Alan), read by ages ~9 to adult. Each Deep Dive
chapter `deep/src/<slug>/part-NN.json` (~3,500 words: `summary`, `sections[].paragraphs`, `deepDive`, `funFact`,
`check`, `sources`) was written by a different writer, who had limited web access, so some facts came from memory.
Your job: make your chapters correct. Edit ONLY your own part files, in place, keeping them valid JSON and keeping the
style, voice and length (don't rewrite good text; fix sentences).

Also read `deep/src/<slug>/story.json` (`doNotSay` = myths that must not appear as fact; `people` dates).

## 1. Check the risky claims first
For each chapter, find the claims most likely to be wrong and check them with WebFetch (Do NOT use WebSearch):
exact dates and years, numbers/statistics/records, "first"/"only"/"largest" claims, quotations, who-did-what credits,
ages, places, deaths/death tolls, anything recent (2020s), and the `funFact` and `check` answer. Aim for at least
~12 checks per chapter. Use reputable pages (en.wikipedia.org articles are fine; also museums, universities, NASA/NIH/
WHO/government sites; Britannica usually returns 403).
- Wrong → fix it. Can't confirm → soften ("about", "around", "is said to", "according to one account") or cut the
  detail. Never leave a claim you believe is false. Legends must be labelled as legends.
- The `check` question: its `a` must be correct and stated in the chapter, and each `wrong` option clearly wrong.
- Keep it calm and age-appropriate (no gory detail; no medical advice).

## 2. Sources
- Open every URL in `sources` with WebFetch. Remove any that are dead (404/blank) or don't relate to the chapter.
  (403 "forbidden" from a big reputable site such as Britannica/Smithsonian can stay — it's a bot block, not a dead link.)
- Add the reputable pages you used for your checks, so each chapter keeps 4–8 sources. Only list pages you opened.

## 3. Finish
Validate each file: `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`.
Return a short report: per chapter, the number of claims checked, every change made (before → after, with the source),
and sources removed/added.
