---
name: exploring-data
description: Use when exploring a dataset, generating plots, or iterating on data analysis scripts
---

> **Related skills:** Dispatch the `script-checker` with `/skill:pi-subagents`. Once a figure/analysis seems meaningful, use `/skill:finishing-exploratory-data-analysis` before writing it up or committing.

# Exploring Data

**Scope, small to large:**

- *plot*: a chart type/category (e.g. histogram, scatter)
- *figure*: one rendered image
- *question*: one concept to test through one or more figures
- *analysis*: one `.md` *report* file + its paired scripts/figs folder
- *project*: the whole `eda/` directory, created across many
  `/skill:exploring-data` sessions

## Overview

**Core principle:** Your job is to help the user surface hypotheses,
and suggest or build the plots that interrogate them. What a confirmed pattern
*means*, the story it tells, is the user's call: hand back a clear summary of
what the figure shows, not a conclusion dressed as a finding.

See `workflow.md` for stages of this skill. In all stages, confirm framing
with the user. Never run a batch of steps by yourself; always interleave
by checking for the user's insight/thoughts.

A good hypothesis is usually a simple, clean one -- reachable through better
framing of the question, not through aggressively slicing the dataset more ways
looking for a signal.

## Directory Structure

Default to `eda/` at the project root (ask if a different name/location is
wanted). See `directory-structure.md` for the full layout convention
(scripts/figs tree, numbering rules, shared-code placement).

## Core Data Practices

Always, whether running a numbered script or an ad hoc check (e.g.
`python -c "..."`):

- Check input file size(s) and be aware of runtime/memory.
- Set a timeout via the `timeout` param (seconds) in pi's `bash` tool
  on any check or smoke test. If it times out, reduce sample size and
  extrapolate rather than waiting for a highly accurate estimate.
- Don't delete scripts or attempts yourself unless the user explicitly
  asks to. If a script is paused or abandoned, leave a module/function
  docstring giving its status and where it was left off.
- If processing is heavy, decide with the user whether to run on the
  full dataset or a representative subset for this pass.

## Common Mistakes

The most cross-cutting/devastating failures. Each reference file above has
its own narrower table.

| Mistake | Fix |
| --- | --- |
| Running the full dataset before a smoke test | See `checking-and-running-scripts.md` -- always sample/time on a subset first |
| Auto-advancing to the next question without a framing check | See `pre-code-checkpoints.md` -- confirm framing before each new question, not once for the whole analysis |
| Picking the report/subfolder name yourself instead of asking | Ask before creating it -- one name, shared by the file and its folder |
| Launching a heavy scale-up run while the `script-checker` is still pending | See `checking-and-running-scripts.md` -- wait for it, or the expensive run finishes before a material issue could surface |
| Deleting/pruning a failed or paused script | Leave it in place with a status docstring unless the user explicitly asks to remove it |
| Treating an approval-sounding signal ("looks great", "keep going", "I trust your judgment") as done | Ask whether to move to `/skill:finishing-exploratory-data-analysis` -- don't auto-advance and don't stay silent |
| Chasing a pattern that only appears after trying many slices/cuts of the data | Multiple-comparisons risk -- go back to framing, not more cuts |
| Stating a small or non-random-sample result as a general fact | State it as a property of the sample examined ("true in this subset") until checked for generalization |
| Writing to `index.md` or the report before `/skill:finishing-exploratory-data-analysis` | Both are created/updated together at lock-in checkpoint -- confirm scope/framing conversationally during exploration instead |
