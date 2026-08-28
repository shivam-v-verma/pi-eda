# Directory Structure

Layout convention for `/skill:exploring-data`.

Default to `eda/` at the project root (ask if a different name/location is
wanted).

```text
eda/
  .gitignore                  # containing `outputs/`
  index.md                    # landing pad for readers -- what's been done,
                               # links to each report below
  outputs/                    # gitignored data/caches, can be shared across analyses
  customer_churn.md           # a report -- lives directly under eda/
  customer_churn/             # paired folder, same stem as the report file
    scripts/
      common_data.py          # unnumbered: shared code, not an analysis step
      01_description.py
      02_description.py
    figs/
      01_description.png
      01_description_b.png    # one script can produce many figures
      02_description.png
```

- `index.md` is a skimmable document for first-time readers, briefly
  describing what analyses have been done, with links to the reports.
- A report (`<name>.md`) is the analysis's confirmed write-up -- its
  questions, each with approach/results/figures, and a conclusion.
- The report file and its folder must share the exact same stem -- that's
  the only thing that pairs them, no manifest or frontmatter needed.
- `index.md` and the report are only created/updated during
  `/skill:finishing-exploratory-data-analysis`, and not during exploration.
- No strict 1:1 between scripts, figures, and a report's *Questions* -- number for
  correlation, don't enforce it.
- Numbered scripts (`NN_description.py`) can't import each other.
- Shared code (data loading, plotting helpers, constants) goes in an
  unnumbered `common_<topic>.py` and gets imported from there instead --
  never import one numbered script from another.
- `eda/outputs/` is a top-level, shared cache. Any script can read from or
  write to it. No substructure required inside it. Scripts that produce
  data caches should check-or-recompute so it can be repopulated if needed.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Naming the report file and its folder with different stems | They must match exactly -- that's the only thing that pairs them |
| Importing one numbered script from another | Shared code goes in `common_<topic>.py` instead |
