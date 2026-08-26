# pi-eda

This repo is pi package for interactive EDA.
Most edits are to `.md` skill/agent files; `extensions/` has TS tool code
with vitest tests (`npm test`).

```
pi-eda/
├── package.json                  # declares pi.extensions / pi.skills / pi.subagents.agents
├── eda.mplstyle.example          # matplotlib style template (see below)
├── extensions/
│   ├── show.ts                   # `show` tool: renders an image to the user without LLM tokens
│   ├── eda-workflow-tracker.ts   # `workflow_tracker` tool: named-state workflow graph tracking
│   └── lib/eda-workflow-tracker-core.ts  # its pure logic, unit-tested
├── tests/extension/               # vitest specs for the extensions above
├── agents/
│   ├── script-checker.md         # reviews a script against stated intent pre-scale-up
│   ├── job-runner.md             # launches/monitors a cleared heavy run
│   ├── naive-reader.md           # checks a report reads standalone, cold
│   └── critical-auditor.md       # checks report/script match agreed intent
└── skills/
    ├── exploring-data/           # iteration/plotting phase
    │   ├── SKILL.md              # entry point
    │   ├── workflow.md           # stages of the skill (framing, smoke test, script-checker/job-runner dispatch)
    │   ├── directory-structure.md  # eda/ scripts+figs tree, numbering rules
    │   └── plotting.md           # chart conventions
    └── finishing-exploratory-data-analysis/  # lock-in/report phase
        ├── SKILL.md              # entry point
        └── verification-dispatch.md  # reread pass, naive-reader/critical-auditor dispatch, severity rubric
```

`package.json` update if a skill or agent file is added/removed/renamed.
Agent frontmatter (`tools`, `defaultContext`, `inheritProjectContext`) is
load-bearing: keep each agent's tool list minimal and matched to its one job.

## `skills/exploring-data`

Iteration/plotting phase, see tree above for per-file breakdown. Dispatches
`script-checker` mid-flow via `/skill:pi-subagents`. Hands off to
`finishing-exploratory-data-analysis` once a figure seems meaningful.

## `skills/finishing-exploratory-data-analysis`

Lock-in/report phase, gated behind the user confirming a figure's narrative
before anything is written. Writes/updates `index.md` and the report only
after user confirmation; runs verification dispatch (see tree above) before
offering to commit.

## Conventions when editing skills/agents

- Keep `SKILL.md` short; put narrower detail in a linked sibling file rather
  than growing `SKILL.md`.
- Every skill/agent file needs frontmatter `name`/`description` matching its
  directory/file name -- pi resolves dispatch by these.
- Match the existing "Overview" / numbered workflow / "Common Mistakes" table
  structure already used in both `SKILL.md` files.
- This package depends on `pi-subagents` (see README) for the dispatch
  pattern the skills reference -- don't remove that dependency assumption.
