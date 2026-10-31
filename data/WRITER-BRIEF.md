# Brief for invention writers

You are writing entries for "Invention Lab", an educational web page made by an 11-year-old (Alan) and published
publicly. Readers range from age 7 to adults, so every entry has three reading levels. Accuracy matters more than
anything: this is a school-quality reference.

Read `MASTER.md` in this folder for the full list of 140 ids (you only write your own group of 20).

## Output
Write ONE file: `data/<group>.json` (for example `data/g3.json`) — a JSON array of exactly 20 objects, in the
order of your list. It must be valid JSON (double quotes, no comments, no trailing commas). After writing it,
validate it with: `node -e "const a=JSON.parse(require('fs').readFileSync('<path>','utf8'));console.log(a.length)"`.

## Object schema (every field required)
```json
{
  "id": "printing-press",                 // exactly the id from MASTER.md
  "name": "Printing Press",               // nice display name
  "emoji": "🖨️",                          // one emoji that fits
  "year": 1440,                           // a single number for sorting; negative = BCE (e.g. -3200)
  "when": "around 1440",                  // friendly label: "around 3200 BCE", "1876", "1940s"
  "where": "Mainz, Germany",              // place or region (modern country names in brackets are fine)
  "who": "Johannes Gutenberg",            // inventor(s), or e.g. "Unknown — ancient Sumerians" / "Many inventors"
  "category": "Communication",            // exactly as given in MASTER.md for this id
  "kid": "...",                           // ages 7–10: 2–3 short, vivid, simple sentences
  "explorer": "...",                      // ages 10–14: 3–5 sentences, more detail, still friendly
  "expert": "...",                        // teens/adults: 4–7 sentences with nuance — precursors, rival claims,
                                          //   the science, economics, side effects, what's often misunderstood
  "how": "...",                           // how it works, 2–3 clear sentences
  "before": "...",                        // what people did before it, 1–2 sentences
  "impact": "...",                        // how it changed the world, 1–2 sentences
  "facts": ["...", "...", "..."],         // 3 or 4 surprising but TRUE fun facts, one sentence each
  "ledTo": ["id", "..."],                 // 0–4 ids from MASTER.md that this invention led to / made possible
  "quiz": [                               // exactly 2 multiple-choice questions about THIS invention
    { "q": "Who built the first printing press with movable metal type in Europe?",
      "a": "Johannes Gutenberg",
      "wrong": ["Thomas Edison", "Leonardo da Vinci", "Isaac Newton"] }
  ],
  "wiki": "Printing press"                // exact title of the best English Wikipedia article (used to fetch a photo)
}
```

## Accuracy rules (very important)
- Only include facts that are well established in reputable sources (encyclopedias, museums, NASA/NIH, etc.).
  If you are not sure a fact is true, leave it out — never guess numbers, names or dates.
- Use "around"/"about" for uncertain dates. Many inventions have no single inventor or have disputed credit
  (telephone, light bulb, radio, airplane "firsts", computer…): say so honestly in `expert`, and keep `who` fair
  (e.g. "Alexander Graham Bell (patent), with rival claims by Elisha Gray and Antonio Meucci").
- No made-up quotes. No myths stated as facts (e.g. Edison did not invent the light bulb from nothing; Newton's
  apple, Franklin's kite details etc. — if you mention a story, label it as a story).
- Quiz: the correct answer must be unambiguously right; wrong options must be clearly wrong but plausible;
  keep answers short (under 8 words). Vary the question types (who / when / what it does / what came first /
  where / a number).
- Kid-friendly and positive, but honest about harms where relevant (e.g. gunpowder weapons, plastic pollution)
  in a calm, age-appropriate way. No gore.
- Plain text only inside strings (no HTML, no Markdown). You may use "—" and emoji sparingly.
- `wiki` must be a real English Wikipedia article title that has a good lead photo or illustration of the
  invention itself (prefer the article about the object, e.g. "Bicycle", "Stethoscope", "Penny Black").

When done, return a short report: the file path, that it parsed with 20 entries, and any entries where facts were
genuinely uncertain and how you handled them.
