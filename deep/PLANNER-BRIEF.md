# Brief for Deep Dive PLANNERS

"Invention Lab" (a public educational site by an 11-year-old, Alan) has 14 **Deep Dives**: giant illustrated
stories, each told in **20 parts** (~900 words + 3 pictures per part). The library should take weeks to read.
Four different writers will each write 5 parts of your story, so your plan must be detailed enough that they
don't overlap, contradict each other, or leave gaps. Accuracy matters most (school-quality history & science).

## Write ONE file: `deep/src/<slug>/story.json` (create the folder)
```json
{
  "slug": "printing-press",
  "title": "The Printing Press",
  "emoji": "🖨️",
  "tagline": "One short exciting line (max 12 words)",
  "intro": "120–160 words welcoming the reader and promising what the 20 parts cover.",
  "outline": [
    {
      "n": 1,
      "title": "Before Books Were Easy",
      "when": "3000 BCE – 1400s",
      "covers": ["4–7 specific points this part MUST cover: real people, places, dates, objects, ideas"],
      "keyFacts": ["2–4 checked facts with numbers/dates the writer can use"],
      "hook": "one sentence: how this part should end to lead into part 2"
    }
    // ... 20 entries, n = 1..20
  ],
  "people": ["Every important real person in the story, with a one-line fair description and their dates"],
  "glossary": ["term — simple definition", "... 10–20 terms the writers should explain the same way"],
  "doNotSay": ["common myths/mistakes about this invention that NO part should repeat as fact"]
}
```

## Plan the full arc across 20 parts
the world before → early ideas & failures → the key breakthroughs & people (fair credit, rival claims) →
how it works (science explained simply, spread over a few parts) → how it spread and changed daily life,
work, society and other inventions → problems, side effects and controversies → modern versions → the future
→ a final part that ties everything together. Each part must have a distinct focus. Spread exciting moments
across the whole story so every part has something memorable.

Only include facts that are well established. Use "around"/"about" for uncertain dates. Label legends as
legends. Then validate: `node -e "const s=JSON.parse(require('fs').readFileSync('<path>','utf8'));console.log(s.outline.length)"`
must print 20. Return a 3-line report.
