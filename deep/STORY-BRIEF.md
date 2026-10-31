# Brief for Deep Dive story writers

"Invention Lab" (a public educational site made by an 11-year-old, Alan) has a library of 14 **Deep Dives**:
giant illustrated stories, each told in **20 parts**. Readers range from age ~9 to adults; the whole library is
meant to take weeks to read. You write ONE story. Accuracy matters most: this is school-quality history and
science, so only write what is well established, use "about"/"around" for uncertain dates, label legends as
legends, and treat disputed "firsts" fairly.

## Files you write
In `deep/src/<slug>/` (create it):
1. `story.json`:
```json
{ "slug": "printing-press", "title": "The Printing Press", "emoji": "🖨️",
  "tagline": "One short exciting line (max 12 words)",
  "intro": "About 120–160 words welcoming the reader and promising what the 20 parts will cover.",
  "parts": ["Part 1 title", "... 20 titles in order ..."] }
```
2. Twenty files `part-01.json` … `part-20.json` (write them one at a time):
```json
{
  "n": 1,
  "title": "Before Books Were Easy",
  "when": "3000 BCE – 1400s",                  // the time this part covers
  "summary": "2–3 short, vivid sentences for young kids (ages 7–10).",
  "story": ["paragraph 1", "paragraph 2", "..."], // 700–950 words total, 6–10 paragraphs, ages 10+
  "deepDive": "150–250 words for teens and adults: the science, numbers, debates, or what historians argue about.",
  "funFact": "One surprising, TRUE sentence.",
  "check": { "q": "A question answerable from this part", "a": "correct answer (short)",
             "wrong": ["clearly wrong but plausible", "...", "..."] },
  "pics": [
    { "want": "What this picture should show (be concrete: a real object, person, place, diagram or event in this part)",
      "search": "3–6 English keywords likely to find it on Wikimedia Commons" },
    { "want": "...", "search": "..." },
    { "want": "...", "search": "..." }
  ]
}
```

## How to plan the 20 parts
Tell the whole arc: the world before → early ideas and failures → the key breakthroughs and the people →
how it worked (science explained simply) → how it spread and changed daily life → problems and side effects →
modern versions → the future. Include real people (with fair credit), real places, real numbers. Each part should
have a clear focus and end with a little hook into the next part. Avoid repeating the same facts across parts.

## Style
Friendly, vivid and clear, like a great museum guide talking to a curious 11-year-old who loves science.
Explain any hard word the first time. Plain text only (no HTML/Markdown, no emoji inside the story paragraphs).
Calm and age-appropriate about wars, disease and accidents — honest, no gore.

## Pictures
Ask for things that are likely to exist as free photos/drawings on Wikimedia Commons: museum objects, historical
photographs, portraits of real people, old engravings/patents, diagrams, buildings, modern photos. Don't ask for
things that can't exist (e.g. a photo of an ancient event). Three DIFFERENT pictures per part.

## Checks
Every file must be valid JSON. After all 21 files are written run:
`node -e "const fs=require('fs'),d='<folder>';const s=JSON.parse(fs.readFileSync(d+'/story.json'));let w=0;for(let i=1;i<=20;i++){const p=JSON.parse(fs.readFileSync(d+'/part-'+String(i).padStart(2,'0')+'.json'));w+=p.story.join(' ').split(/\s+/).length;if(p.pics.length!==3)throw i}console.log(s.parts.length,'parts',w,'story words')"`
It must print 20 parts and at least 14,000 story words. Then return a short report: word count, and any facts you
were unsure about and how you handled them.
