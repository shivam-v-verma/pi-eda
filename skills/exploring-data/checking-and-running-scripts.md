# Checking and Running Scripts

Building confidence in a script for `/skill:exploring-data`, then deciding
how to run it. See `workflow.md` for where this fits in the full loop
(the light/heavy fork is inlined there, each branch with its own check
step and loop-back on findings).

## Sanity Checking a Script

- After each nontrivial transform (groupby, join, pivot, filter, etc.), do
  a quick check (`.head()`, row counts, spot-check a few values) that the
  output matches what the transform should have done -- not just once at
  the end of the script.
- Pick a case that could actually fail, not the first one at hand --
  especially for canonicalization/ordering/matching logic, where an easy
  case can pass while hiding a real bug.

## Smoke Testing a Script

- Run on a sampled/head subset (fixed seed) and time it before running at
  full scale.
- After it runs, glance at the actual output values, not just "it
  completed in time." A fast clean run on garbage output is not a
  passing smoke test.
- Exception: a cached-read-and-plot script -- one that purely reads an
  already-validated cached table and plots it, with zero computation (no
  groupby, join, pivot, or filter). State that justification explicitly
  instead of skipping silently.

## Judging Heavy vs. Light Scale-up

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

## Light Scale-up

- No `script-checker` dispatch -- reread the script yourself before
  running: does it match the user's stated intent/framing, does each
  nontrivial transform do what it should.
- If the reread surfaces an issue, fix it and reread again before
  running -- don't run first and raise the concern after.
- This is a deliberately lower bar than the heavy path: a light-path
  mistake is cheap to catch downstream too, since the run finishes fast
  and you're looking at the output right away. The real second-set-of-
  eyes gate for the analysis still happens at
  `/skill:finishing-exploratory-data-analysis`'s lock-in checkpoint --
  this reread isn't the last line of defense, it's a cheap intermediate
  one.

## Heavy Scale-up

- Dispatch the `script-checker` before launching:
  `subagent({agent:"script-checker", task:"<script path + stated intent/framing>"})`.
- Do not launch until it has returned and come back clean.
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

### Dispatching the `job-runner`

- Once clear to launch:
  `subagent({agent:"job-runner", task:"<script path + output location + estimated runtime>"})`.
  This frees the main session to keep iterating while it runs. Pass the
  runtime estimate from your smoke test (see "Judging Heavy vs. Light
  Scale-up" above) rather than making it re-derive it blind.
- Register a wake instead of blocking: `subagent_wait({id, nonBlocking: true})`
  after launching. Non-blocking waits allow you to continue the conversation
  with the user while waiting.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Running the full dataset (or an ad hoc exploratory probe) before a smoke test | Always sample/time on a subset first -- applies to one-off probes too, not just numbered scripts |
| Silently skipping the smoke test on a "just read cache and plot" script | Only skip for zero-computation cached-read-and-plot, and state that justification explicitly |
| Trusting a sanity check that only ran on an easy/symmetric case | Pick a case that could actually have failed, especially for matching/ordering/canonicalization logic |
| Checking that a smoke test ran fast/clean without looking at what it produced | Glance at the actual output values -- a clean run on garbage isn't a pass |
| Running a light-path script without rereading it first because it's "just quick" | Reread against the stated intent/framing before running -- speed doesn't waive the check, it just changes who does it |
| Launching a heavy scale-up "while the `script-checker` runs in the background" instead of waiting for it | Confirm the `script-checker` came back clean before launching -- don't launch and plan to fold feedback in later |
| Letting 2+ small edits pile up on a heavy-path script since the last `script-checker` dispatch because none felt big enough alone | Dispatch again once 2+ edits have landed |
| Treating a mid-work `script-checker` pass as covering the finishing skill's lock-in checkpoint | Different gate, different artifact -- a pending or completed `script-checker` pass never substitutes for it |
