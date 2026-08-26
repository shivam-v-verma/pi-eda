# Workflow

Loop/flow-control for `/skill:exploring-data`.

The user drives this loop: they propose or pick the next thing to plot or
check, you build it and return what it shows. They then interpret it
and pick next steps or ask additional questions.

This is a looped pipeline, exiting only when the user decides to
lock-in an analysis.

The graph (nodes + legal edges) is `workflow.graph.json`, machine-readable
for the `workflow_tracker` tool. Call `workflow_tracker init` with that path
at skill entry, `advance` after each stage, `status` whenever you need to
know where you are instead of holding it in your head. It also shows a
one-line status widget (raw current node name) so the user can see where
things stand.

| Stage | Turn | What it looks like | See |
| --- | --- | --- | --- |
| `Start analysis` | User | User begins an EDA analysis | -- |
| `Scope the analysis` | User | State the broad scope/question area for this analysis and confirm it, once per analysis, before touching data | `pre-code-checkpoints.md` (Scope the analysis) |
| `Peek at the data` | Agent -> User | Schema/dtypes, `.head()`, a sample, eyeball raw rows, hand back for a look | `pre-code-checkpoints.md` (Peek at the data) |
| `Propose/ask a question` | User (agent may suggest) | Confirm framing for the next question, then the user picks what to plot or check | `pre-code-checkpoints.md` (Propose/ask a question) |
| `Build script/plot` | Agent | Write the script/plot, smoke test on a subset before scaling | `checking-and-running-scripts.md`, `plotting.md` |
| `Light or heavy?` | Agent | Judge from the smoke-test timing/size ratio -- "light" goes to `Reread script`, "heavy" to `Dispatch script-checker` | `checking-and-running-scripts.md` |
| `Reread script` | Agent | Light path: reread the script yourself before running -- no `script-checker` dispatch. "issues found" loops back to `Build script/plot`, "looks right" goes to `Run now, this session` | `checking-and-running-scripts.md` |
| `Run now, this session` | Agent | Light path continuation: run the smoke-tested script/plot in this session | `checking-and-running-scripts.md` |
| `Dispatch script-checker` | Agent | Heavy path: dispatch the `script-checker` and wait. "issues found" loops back to `Build script/plot`, "clean" goes to `Dispatch job-runner` | `checking-and-running-scripts.md` |
| `Dispatch job-runner` | Agent | Heavy path continuation: launch the `job-runner` only once the `script-checker` is clean | `checking-and-running-scripts.md` |
| `Summarize the answer` | Agent -> User | Interpret the figure/stats as a summary, not a conclusion -- the user decides what it means and what's next | `SKILL.md` Core principle |
| `Continue analysis or lock in?` | User | "next question" loops back to `Propose/ask a question`, "finish analysis" exits to the finishing skill | `SKILL.md` Core principle |
| `/skill:finishing-exploratory-data-analysis` | User | Figure/analysis seems meaningful, ready to write up or commit | `/skill:finishing-exploratory-data-analysis` |

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Treating any issue in scripts (via self-reread or `script-checker`) as a note to fold in later instead of a loop back to the script | Go to `Build script/plot` and fix it -- see the graph's "issues found" edges |
| Launching a heavy scale-up while the `script-checker` is still pending or has open findings | See `checking-and-running-scripts.md`'s Common Mistakes |
