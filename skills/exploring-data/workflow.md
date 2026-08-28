# Workflow

This file is the legend for the EDA workflow.

Use the `eda-workflow-tracker` tool to determine what stage you're on; perform
exactly that stage of work; and then call `advance` before starting the next
stage. Call `status` whenever you need to know where you are instead of holding
it in your head.

At the end of every turn, ask yourself if you have accomplished the exit
condition to `advance` to the next stage.

- If yes, `advance` should **always** be your first tool call.
- If no, keep working on the stage until you have reached the exit condition.

## Stages

### `Scope the analysis`

- Before opening the data, ask in one or two sentences what is broadly in
  scope for this analysis. This is a "what are we even doing here", at a
  high level.
- Keep interrogating until the user agrees with the framing. Do not advance
  on a partial answer or lukewarm agreement.
- Ask the user for a report name for this analysis -- it names both the
  report file and its paired folder (see `directory-structure.md`).
  Don't pick one yourself. Keep asking until they give one.
- Expect the scope to narrow or shift as the data yields a story during
  this analysis. This step is purely for you to ground yourself.
- You should **never** be running code at this stage. If the user has
  already offered a specific question/approach, it establishes the scope but
  you must confirm a report name before advancing.
- `advance` condition: the user has confirmed the scope of the analysis and has
  given a report name.

### `Peek at the data`

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
- `advance` condition: you understand the high-level structure of the data.

### `Propose/ask a question`

- Propose a framing for *this* question/figure yourself, then keep
  interrogating until the user agrees with it, before writing a script for it.
- You can refine the approach by writing/executing some code, but don't write
  any scripts in the directory yet. This is exploratory, not polish.
- The goal here is focus: work with the user to identify a specific, question
  that can be tested with data. Do not attempt many questions or approaches at
  once. Iterate one at a time with the user until it's settled.
- If the user has already proposed a specific question, confirm your
  understanding vocally and then `advance`.
- `advance` condition: You have explained what you plan to do, and the user
  agrees with the question and approach.

### `Build script/plot`

Goal: Write the script/plot (see `plotting.md` for chart conventions), then
build confidence in it:

- After each nontrivial transform (groupby, join, pivot, filter, etc.), do
  a quick check (`.head()`, row counts, spot-check a few values) that the
  output matches what the transform should have done. Don't just do this once
  at the end of the script.
- Pick a case that could actually fail, not the first one at hand.
  especially for canonicalization/ordering/matching logic, where an easy
  case can pass while hiding a real bug.
- Time the script on a small subset of the data to understand how long the
  full scale run will take
- Glance at the actual output values to sanity check the output.
- `advance` condition: the script is written and each nontrivial transform has
  been spot-checked.

### `Light or heavy?`

Goal: Decide whether the full scale run will be a light task or a heavy task.
We want to increase iteration speed and not waste user time.

- Judge from the smoke-test timing/size ratio whether the full-scale run
  will be heavy (long-running or memory-heavy relative to the sample --
  e.g. 1% took a second but full scale extrapolates to minutes).
- Rough thresholds based on estimated time: light if under ~1 minute,
  heavy if over ~5 minutes. In between is a judgment call.
- State that judgment explicitly: "sample took Xs, full run estimated ~Y,
  treating as heavy."
- `advance` condition: you understand the computational cost of the script.

### `Reread and run script`

Light path: reread the script as a sanity check, then run it in this session.

- Does it match the user's stated intent/framing, does each nontrivial
  transform do what it should?
- If the reread surfaces an issue, fix it and reread again before
  running. Don't run first and raise the concern after.
- This is a deliberately lower bar than the heavy path. A subtle mistake here
  can also be caught downstream in `/skill:finishing-exploratory-data-analysis`.
  We just want to sanity check here.
- Once the reread finds no issues, run the smoke-tested script/plot in this
  session.
- `advance` condition: you have reread the script, found no issues, and run
  it successfully on the data.

### `Dispatch script-checker`

Heavy path: dispatch the `script-checker` and wait, before launching.

- `subagent({agent:"script-checker",
  task:"<script path + stated intent/framing>"})`.
- This must be a blocking call. wait for the `script-checker` to finish. You
  don't want to surface issues after the expensive run has finished. We want to
  catch all issues here.
- Two or more edits since the last `script-checker` dispatch count as one
  nontrivial change on their own. Dispatch again at that point; don't wait for
  it to feel big enough.
- "Issues found" loops back to `Build script/plot`, "clean" goes to `Dispatch
  job-runner`.
- `advance` condition: `script-checker` has not found substantial issues, and
  all issues have been handled and rechecked.

### `Dispatch job-runner`

Heavy path continuation: launch the `job-runner` only once the
`script-checker` is clean.

- Run the `job runner` with `subagent({agent:"job-runner", task:"<script path +
  output location + estimated runtime>"})`.
- Pass the runtime estimate to the `job-runner` from your smoke test in
  `Light or heavy?` above rather than making it re-derive it blind.
- Register a wake instead of blocking: `subagent_wait({id, nonBlocking: true})`
  after launching. Non-blocking waits allow you to continue the conversation
  with the user while waiting.
- `advance` condition: `job-runner` has successfully completed the job.

### `Summarize the answer`

- `show` the figure(s) to the user, then summarize briefly with bullets.
- Core principle: the user decides the interpretation. Continue interrogating
  the user until it makes sense to you and is consistent with the dataset.
- `advance` condition: you understand the user's interpretation of the figure.

### `Continue analysis or lock in?`

- Ask the user whether to continue with another question or lock in the
  analysis; keep interrogating until they pick one. "Next question" loops back
  to `Propose/ask a question`, "finish analysis" exits to the finishing skill.
- `advance` condition: the user has decided to continue the session or finish it.

### `/skill:finishing-exploratory-data-analysis`

Figure/analysis seems meaningful, ready to write up or commit.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Getting the user's agreement on a confirmation stage, then acting on it without calling `advance` first | The agreement itself completes the stage -- `advance` is the first tool call once you have it, not a follow-up after next-stage work has already started |
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
| Running a light-path script without rereading it first because it's "just quick" | Reread against the stated intent/framing before running -- speed doesn't waive the check, it just changes who does it. Both happen in the same `Reread and run script` stage, but the reread must come first |
| Launching a heavy scale-up "while the `script-checker` runs in the background" instead of waiting for it | Confirm the `script-checker` came back clean before launching -- don't launch and plan to fold feedback in later |
| Letting 2+ small edits pile up on a heavy-path script since the last `script-checker` dispatch because none felt big enough alone | Dispatch again once 2+ edits have landed |
| Treating a mid-work `script-checker` pass as covering the finishing skill's lock-in checkpoint | Different gate, different artifact -- a pending or completed `script-checker` pass never substitutes for it |
