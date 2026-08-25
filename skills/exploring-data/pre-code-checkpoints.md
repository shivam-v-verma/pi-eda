# Pre-Code Checkpoints

What to do for `/skill:exploring-data` before you write any
code for the next question.

## Scope the analysis (once per analysis, before Peek at the data)

- Before opening the data, check in one or two sentences what is broadly in
  scope for this analysis and get the user's confirmation. This is a "what
  are we even doing here", separate from and prior to the per-question framing
  below.
- Ask the user for a report name for this analysis -- it names both the
  report file and its paired folder (see `directory-structure.md`).
  Don't pick one yourself.
- Keep it broad on purpose -- treat it as provisional, not a lock. Expect
  it to narrow or shift as the data reveals what's actually there, well
  before you reach conclusions -- confirm the new framing with the user
  when it does, same as any other question (see below). `index.md` and
  the report are written together during
  `/skill:finishing-exploratory-data-analysis`, not during exploration.

## Peek at the data (once per new dataset, before Propose/ask a question)

- Load the dataset (lazily), check schema/dtypes.
- Get null counts and basic summary stats (mean/median, min/max, std).
- Get a feel for the actual data: `.head()`, a strided sample, or a random
  sample (fixed seed).
- Read a few raw rows by eye. They catch what schema/dtype checks and basic
  stats above miss: a "numeric" column that's really a formatted string,
  an ID convention, units, or what a free-text field actually holds.
- Even raw rows and basic stats can miss duplicate rows.
- Beyond that, think about what else is cheap to calculate and might
  reveal something missed above -- e.g. sentinel/placeholder values (`-1`,
  `0`, `"unknown"`), class imbalance, or a grain mismatch after a join.

## Propose/ask a question (once per question, every time)

- Confirm the framing for *this* question/figure with the user before
  writing a script for it.
- State the new framing in a sentence before scripting it, even if a broad
  go-ahead was already given for the analysis as a whole.
- This applies to every question, including one you decide to add on your
  own after an earlier go-ahead. Approval for one question is not
  approval for the next one the user hasn't seen proposed yet.
- **A blanket "keep going" / "I trust your judgment" is not per-question
  approval.** It authorizes you to keep working on framing, not to skip
  asking about the next question's framing. Treat it the same as
  silence: propose the next question's framing in one sentence, then
  build it.
- Do not build multiple questions in one pass and hand over a "finished
  report" -- stop after each one and surface what it shows before
  moving to the next.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Opening the data before agreeing on a broad scope | State the analysis's scope/question area in a sentence and confirm before Peek at the data |
| Picking the report/subfolder name yourself instead of asking | Ask before creating it -- one name, shared by the file and its folder |
| Treating EDA as a pipeline and auto-advancing through questions without a framing check | Confirm framing per question, not once for the whole analysis |
| Adding a follow-up figure/question under an earlier blanket go-ahead without confirming its framing | State the new framing in a sentence before scripting it |
| Building the next two questions back-to-back and presenting a "complete report" because the user said "keep going" / "I trust your judgment" | That phrase covers continued work, not skipped per-question confirmation -- stop after each one |
| Skipping the raw-row eyeball and stopping at summary stats | Read a few actual rows -- aggregates hide format/unit/encoding surprises |
