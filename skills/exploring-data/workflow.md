# Workflow

This file is the legend for the EDA workflow.

Use the `workflow_tracker` tool to determine what stage you're on; perform
exactly that stage of work; and then call `advance` before starting the next
stage. Call `status` whenever you need to know where you are instead of holding
it in your head.

## Stages

### `Scope the analysis` | User turn

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

### `Peek at the data` | Agent -> User turn

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

### `Propose/ask a question` | User turn (agent may suggest)

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

### `Build script/plot` | Agent turn

Write the script/plot (see `plotting.md` for chart conventions), then build
confidence in it before scaling up:

- After each nontrivial transform (groupby, join, pivot, filter, etc.), do
  a quick check (`.head()`, row counts, spot-check a few values) that the
  output matches what the transform should have done -- not just once at
  the end of the script.
- Pick a case that could actually fail, not the first one at hand --
  especially for canonicalization/ordering/matching logic, where an easy
  case can pass while hiding a real bug.
- Run on a sampled/head subset (fixed seed) and time it before running at
  full scale.
- After it runs, glance at the actual output values, not just "it
  completed in time." A fast clean run on garbage output is not a
  passing smoke test.
- Exception: a cached-read-and-plot script -- one that purely reads an
  already-validated cached table and plots it, with zero computation (no
  groupby, join, pivot, or filter). State that justification explicitly
  instead of skipping silently.

### `Light or heavy?` | Agent turn

Goal: increase iteration speed without being reckless. Either extreme
wastes the user's time -- blocking every quick diff on a check likely to
pass, or committing to a large/expensive run that turns out wrong.

- Judge from the smoke-test timing/size ratio whether the full-scale run
  will be heavy (long-running or memory-heavy relative to the sample --
  e.g. 1% took a second but full scale extrapolates to minutes).
- Rough thresholds based on estimated time: light if under ~1 minute,
  heavy if over ~5 minutes. In between is a judgment call.
- State that judgment explicitly: "sample took Xs, full run estimated ~Y,
  treating as heavy."
- "Light" goes to `Reread script`, "heavy" to `Dispatch script-checker`.

### `Reread script` | Agent turn

Light path: reread the script yourself before running -- no
`script-checker` dispatch.

- Does it match the user's stated intent/framing, does each nontrivial
  transform do what it should.
- If the reread surfaces an issue, fix it and reread again before
  running -- don't run first and raise the concern after. "Issues found"
  loops back to `Build script/plot`, "looks right" goes to `Run now, this
  session`.
- This is a deliberately lower bar than the heavy path: a light-path
  mistake is cheap to catch downstream too, since the run finishes fast
  and you're looking at the output right away. The real second-set-of-
  eyes gate for the analysis still happens at
  `/skill:finishing-exploratory-data-analysis`'s lock-in checkpoint --
  this reread isn't the last line of defense, it's a cheap intermediate
  one.

### `Run now, this session` | Agent turn

Light path continuation: run the smoke-tested script/plot in this session.

### `Dispatch script-checker` | Agent turn

Heavy path: dispatch the `script-checker` and wait, before launching.

- `subagent({agent:"script-checker", task:"<script path + stated intent/framing>"})`.
- If it's still running, wait for it (or say explicitly you're waiting)
  -- don't launch anyway planning to fold in feedback once it lands.
- Launching "in parallel while the `script-checker` runs in the
  background" still counts as launching without it -- the expensive run
  finishes and gets shown to the user before a material issue could
  surface.
- A `script-checker` pass only checks the script -- it never substitutes
  for the lock-in checkpoint in
  `/skill:finishing-exploratory-data-analysis` once a figure/question is
  ready to show the user.
- Two or more edits since the last `script-checker` dispatch count as one
  nontrivial change on their own -- dispatch again at that point, don't
  wait for it to feel big enough.
- "Issues found" loops back to `Build script/plot`, "clean" goes to
  `Dispatch job-runner`.

### `Dispatch job-runner` | Agent turn

Heavy path continuation: launch the `job-runner` only once the
`script-checker` is clean.

- `subagent({agent:"job-runner", task:"<script path + output location + estimated runtime>"})`.
  This frees the main session to keep iterating while it runs. Pass the
  runtime estimate from your smoke test (see `Light or heavy?` above)
  rather than making it re-derive it blind.
- Register a wake instead of blocking: `subagent_wait({id, nonBlocking: true})`
  after launching. Non-blocking waits allow you to continue the conversation
  with the user while waiting.

### `Summarize the answer` | Agent -> User turn

Interpret the figure/stats as a summary, not a conclusion -- the user
decides what it means and what's next (see `SKILL.md` Core principle).

### `Continue analysis or lock in?` | User turn

"Next question" loops back to `Propose/ask a question`, "finish analysis"
exits to the finishing skill.

### `/skill:finishing-exploratory-data-analysis` | User turn

Figure/analysis seems meaningful, ready to write up or commit.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Treating any issue in scripts (via self-reread or `script-checker`) as a note to fold in later instead of a loop back to the script | Go to `Build script/plot` and fix it -- see the graph's "issues found" edges |
| Opening the data before agreeing on a broad scope | State the analysis's scope/question area in a sentence and confirm before `Peek at the data` |
| Picking the report/subfolder name yourself instead of asking | Ask before creating it -- one name, shared by the file and its folder |
| Treating EDA as a pipeline and auto-advancing through questions without a framing check | Confirm framing per question, not once for the whole analysis |
| Adding a follow-up figure/question under an earlier blanket go-ahead without confirming its framing | State the new framing in a sentence before scripting it |
| Building the next two questions back-to-back and presenting a "complete report" because the user said "keep going" / "I trust your judgment" | That phrase covers continued work, not skipped per-question confirmation -- stop after each one |
| Skipping the raw-row eyeball and stopping at summary stats | Read a few actual rows -- aggregates hide format/unit/encoding surprises |
| Running the full dataset (or an ad hoc exploratory probe) before a smoke test | Always sample/time on a subset first -- applies to one-off probes too, not just numbered scripts |
| Silently skipping the smoke test on a "just read cache and plot" script | Only skip for zero-computation cached-read-and-plot, and state that justification explicitly |
| Trusting a sanity check that only ran on an easy/symmetric case | Pick a case that could actually have failed, especially for matching/ordering/canonicalization logic |
| Checking that a smoke test ran fast/clean without looking at what it produced | Glance at the actual output values -- a clean run on garbage isn't a pass |
| Running a light-path script without rereading it first because it's "just quick" | Reread against the stated intent/framing before running -- speed doesn't waive the check, it just changes who does it |
| Launching a heavy scale-up "while the `script-checker` runs in the background" instead of waiting for it | Confirm the `script-checker` came back clean before launching -- don't launch and plan to fold feedback in later |
| Letting 2+ small edits pile up on a heavy-path script since the last `script-checker` dispatch because none felt big enough alone | Dispatch again once 2+ edits have landed |
| Treating a mid-work `script-checker` pass as covering the finishing skill's lock-in checkpoint | Different gate, different artifact -- a pending or completed `script-checker` pass never substitutes for it |
