# Brief for fact-checkers

"Invention Lab" is a public educational page by an 11-year-old. Each `data/gN.json` file holds 20 inventions
(schema in WRITER-BRIEF.md). Another writer produced your file; your job is to make it correct and complete.
Edit ONLY your own group file, in place, keeping it valid JSON (re-validate with node at the end).

## 1. Verify every claim
For every entry check: `year`/`when`, `where`, `who`, every sentence in `kid`, `explorer`, `expert`, `how`,
`before`, `impact`, each of the `facts`, and both `quiz` items (the correct answer must really be correct and
the three wrong options must really be wrong).
- Use WebSearch / WebFetch to confirm anything you are not completely sure of (dates, numbers, names, "firsts",
  superlatives, surprising facts). Prefer encyclopedias, museums, universities, government science agencies.
- Fix anything wrong. If a fact can't be confirmed, soften it ("about", "is said to", "one of the earliest") or
  replace it with a confirmed fact of similar interest. Never leave a claim you believe is false.
- Watch for: myths stated as fact, wrong "first" claims, over-precise numbers, mixed-up people, anachronisms,
  the kid/explorer/expert texts contradicting each other or the `when` field, and wrong spellings of names.
- Keep the voice friendly and the reading levels as they are. Plain text only.

## 2. Make the "led to" links better
`ledTo` powers an "Invention Chain" game, so richer links make a better game. For each entry in your group:
- Give it 1–4 `ledTo` ids (from MASTER.md, any group) where this invention genuinely helped make the other one
  possible or was a direct ancestor of it. Read the other groups' files (`data/g1.json` … `data/g7.json`) for
  their years. Only link FORWARD in time: the target's `year` must be later than this entry's `year`.
- Remove any existing link that is backwards in time or historically weak.
- A few entries may honestly have 0 links if nothing on the list descends from them — that's fine.

## 3. Small polish
- If an `emoji` is clearly a poor fit, swap it for a better one (duplicates across the list are OK).
- Make sure `wiki` is a real English Wikipedia article title about the invention (it is used to fetch a photo).

When finished, return a short report: how many claims you changed (list the important ones: before → after,
with the source you used), how many ledTo links the group now has, and anything still uncertain.
