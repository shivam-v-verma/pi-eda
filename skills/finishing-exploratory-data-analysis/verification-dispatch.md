# Verification Dispatch

The critical checkpoint in `/skill:finishing-exploratory-data-analysis`:
reread the report/script, then dispatch subagents to check it, before
you offer to commit. Together the two dispatches establish trust in
the report: that it's clear and complete as a standalone artifact
(`naive-reader`), and that it was produced with the correct semantic
intent (`critical-auditor`). See each agent's own definition in this
package's `agents/` directory (`naive-reader.md`, `critical-auditor.md`)
for what they check and how they're configured (context, tools).

1. **Reread first.** Reread the report/script yourself for leftover
   editing artifacts (draft asides, TODO notes, contradictions) before
   dispatching -- don't hand reviewers an unread draft.
2. **Dispatch both in parallel** (`runs.all`), every lock-in, not just
   risky ones:

   ```js
   runs.all([
     {key:"naive", agent:"naive-reader", task:"<report, figures, index.md>"},
     {key:"audit", agent:"critical-auditor", task:"<report, figures, numbered scripts>"},
   ])
   ```

   If fork context isn't available for `critical-auditor`, hand it a
   written recap of this session's framing/decisions in the task instead
   -- context-free it's just a second `naive-reader`.

## Handling `naive-reader` findings by tier

| Tier | Handling |
| --- | --- |
| cosmetic | fix silently, one-line changelog note |
| confusing | fix silently (simplify/rewrite), one-line changelog note |
| clarifying | fix silently if you actually know the answer. If closing the gap means guessing or inventing a reason, don't fabricate it -- tell the user honestly instead |
| material | always surface, never silently patched -- this is a correctness signal wearing a comprehension-test disguise |

## Handling `critical-auditor` findings

Findings have no tiers: everything it reports is drift between intent
and implementation, never silently resolved -- goes into the
user-facing summary verbatim.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Skipping the `naive-reader`/`critical-auditor` dispatch because it "seems fine" | Every lock-in, no exceptions -- this is the final check before commit, and "seems fine" is exactly the curse-of-knowledge blind spot it exists to catch |
| Inventing a plausible-sounding rationale to resolve a clarifying-tier gap you don't actually know the answer to | Surface it as an open question instead -- never fabricate reasoning to make a flag disappear |
| Letting the `critical-auditor` run with no conversation context because fork wasn't available | Hand it an explicit written recap of the framing/decisions instead -- context-free, it's just a second `naive-reader` and can't catch intent drift |
| Treating a completed script/code review as satisfying this dispatch | Different gate, different artifact -- a code review checks the script; this dispatch checks the written report |
