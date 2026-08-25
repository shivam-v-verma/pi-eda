---
name: finishing-exploratory-data-analysis
description: Use when a figure or EDA analysis seems meaningful and ready to summarize, write into a report, or commit
---

> **Related skills:** Use `/skill:exploring-data` for the exploration/plotting phase this follows. Use `/skill:verification-before-completion` before treating any figure as a finished result. Use `/skill:pi-subagents` (`runs.all`, `context: "fresh"`/`"fork"`) for the two dispatches in `verification-dispatch.md`.

# Finishing Exploratory Data Analysis

## Overview

Locking in a figure/analysis is a sequential, one-at-a-time gate, not a
batch step at the end of a session.

**Core principle:** never write to the report or commit from your own
read of a figure -- confirm the story with the user first, every time. A
broader go-ahead, or the user saying "ship it" about the figure itself,
confirms the figure's story -- not this unrun verification step.

Once the report is written or updated, don't skip straight to offering to
commit -- run the verification dispatch (step 4) first. A completed code
review doesn't count (see Common Mistakes).

## Lock-in Checkpoint (do this once a figure/analysis seems meaningful)

1. **Walk through the figures with the user.** `show` each figure and
   re-examine it together to confirm the narrative -- no written artifact
   yet.
2. **Summarize and wait.** Give the user a ~4 sentence written summary
   of the agreed narrative. Wait for confirmation before proceeding.
3. **Write the report and `index.md`.** Once confirmed, add or update
   the `index.md` and report (`<report_name>.md`, sibling to its paired
   `<report_name>/` scripts/figs folder). Create them here if necessary.
   - Writing style: clear sentences. No run-ons, reduce em/en-dash
     (`--`/`—`) as a sentence joiner. Split into two sentences or use a
     comma/colon instead.
   - `index.md` contents -- a brief description (no figures) containing:
       - *Link to report*
       - *Brief summary*
       - *Scope of analysis*
       - *Dataset description*
       - *Open questions*, if any
   - Report contents -- at minimum:
       - *Scope of analysis*
       - *Data source(s) used*
       - *Questions*, grouped when closely related:
         - *Approach* in prose, with key equations if nontrivial
         - *Results*, with the embedded figure(s)
       - *Conclusion*
4. **Reread, then dispatch verification.** See `verification-dispatch.md`
   for the reread pass, the `naive-reader`/`critical-auditor` dispatch, and
   the severity rubric for findings.
5. **Integrate findings and modify the report.** Apply silent fixes per
   the rubric; surface material-tier and `critical-auditor` findings
   verbatim, flagged unresolved if not yet addressed. If the fix is
   substantive, ask the user whether to rerun verification.
6. **Ask before committing.** Explicitly ask if the user is ready to
   commit -- don't commit on your own judgment.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Writing to the report from your own interpretation of a figure | Confirm with a ~4 sentence summary first |
| Putting figures/results into `index.md` | Keep it a skimmable summary of what's been done -- figures and results belong in the report files |
| Dispatching verification before the report is written | Verification checks the written report against the figures/script -- write first (step 3), then dispatch (step 4) |
| Stating a correlation as if it were causal | Hedge appropriately in report prose; correlation is not causation |
| Silently patching a material-tier or `critical-auditor` finding before telling the user | Always surface these verbatim in the summary, even unresolved -- only cosmetic/confusing/non-fabricated-clarifying fixes get silently applied |
| Treating a completed script/code review as satisfying this checkpoint's dispatch | Different gate, different artifact -- a code review checks the script, this checkpoint checks the written report. See `verification-dispatch.md` |
| Saying an analysis is "done and reviewed" once code review passes, before the lock-in checkpoint has run | Say so explicitly ("script validated; report still needs the lock-in checkpoint") rather than a blanket "done" that could be read as covering sign-off too |
