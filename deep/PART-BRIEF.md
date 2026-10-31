# Brief for Deep Dive PART WRITERS

You write 2 of the 20 parts of one Deep Dive story for "Invention Lab", a public educational site made by an
11-year-old (Alan). The whole library is meant to be ENORMOUS (over a million words — weeks of reading), so each
part is a full book chapter of about 3,500 words. Readers: about age 9 to adults.

Accuracy matters most: only well-established facts, "about" for uncertain numbers, legends labelled as legends,
fair credit for disputed "firsts". Never repeat anything in the story's `doNotSay` list as fact. Length must come
from REAL content — more people, places, scenes, numbers, how-it-works explanations, consequences — never from
padding, repetition or vague filler.

First read `deep/src/<slug>/story.json` — the planner's outline, people, glossary and doNotSay list. Follow the
outline for YOUR parts exactly (cover every point in `covers` — each point can become a section — use `keyFacts`,
and end with the `hook`). Read the outline of the other 18 parts so you don't steal their topics.

## Write one file per part: `deep/src/<slug>/part-NN.json` (NN = 01…20)
Write each part in stages so no single write is too big: first create the file with the first 2–3 sections,
then add the remaining sections (re-write the whole file each time, or build it with a small node script).
```json
{
  "n": 7,
  "title": "same title as the outline",
  "when": "same as the outline",
  "summary": "2–3 short, vivid sentences for young kids (ages 7–10).",
  "sections": [
    { "heading": "A short, catchy section heading", "paragraphs": ["paragraph", "paragraph", "..."] }
    // 5–8 sections; 3,300–4,000 words in total across all sections
  ],
  "deepDive": "300–450 words for teens and adults: the science, numbers, debates, or what historians argue about.",
  "funFact": "One surprising, TRUE sentence.",
  "check": { "q": "A question answerable from this part", "a": "short correct answer",
             "wrong": ["clearly wrong but plausible", "...", "..."] },
  "sources": [
    { "title": "Page or article title", "publisher": "e.g. Britannica, Smithsonian, NASA, Science Museum, BBC", "url": "https://..." }
    // 4–8 reputable sources you actually used for THIS part
  ],
  "pics": [
    { "want": "Concrete description of a picture: a real object, person, place, document, diagram or scene from this part",
      "search": "3–6 English keywords likely to find it on Wikimedia Commons" },
    { "want": "...", "search": "..." },
    { "want": "...", "search": "..." }
  ]
}
```

## Research, sources and no plagiarism
- Research each part with WebSearch and WebFetch (load them first with ToolSearch: "select:WebSearch,WebFetch").
- Use reputable sources: encyclopedias (Britannica), museums (Smithsonian, Science Museum, Computer History Museum),
  universities, NASA/NIH/WHO and other government science agencies, major newspapers and established history sites.
- Only list a URL in `sources` if you actually opened it with WebFetch and it supports something in your part.
  Never invent or guess a URL. (Broken links will be removed automatically.)
- Write everything in your OWN words. Never copy sentences from a source. A short direct quote is OK only if it is
  clearly marked with quotation marks and says who said it.
- Pack in lots of real facts: names, dates, places, numbers, records, measurements, and how things work.

## Style
Like a brilliant museum guide talking to a curious 11-year-old who loves science: vivid, specific, friendly,
clear. Real names, places, dates, numbers and short scenes ("Imagine standing in a smoky print shop in Mainz…").
Explain hard words the first time (match the glossary). Vary paragraph length. Plain text only — no HTML,
Markdown or emoji inside paragraphs. Calm and age-appropriate about war, disease and accidents.

## Pictures
Three DIFFERENT pictures likely to exist as free images on Wikimedia Commons: museum objects, historical photos,
portraits, old engravings, patent drawings, diagrams, buildings, modern photos. No impossible photos (ask for a
period illustration of a medieval event, not a photograph).

## Check before you finish
Every file must be valid JSON. Run for each of your parts:
`node -e "const p=JSON.parse(require('fs').readFileSync('<file>','utf8'));const w=p.sections.flatMap(s=>s.paragraphs).join(' ').split(/\s+/).length;console.log(p.n,w,'words',p.sections.length,'sections',p.pics.length,'pics')"`
Each part must have at least 3,300 words, 5+ sections, 3 pics and 4+ sources. Return a short report: words per part and any
facts you were unsure about.
