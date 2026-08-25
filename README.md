# pi-eda

Pi skills and subagents for interactive exploratory data analysis.

- `skills/exploring-data`: iterative analysis & plotting
- `skills/finishing-exploratory-data-analysis`: locking in analysis into a wiki-style report
- `show` extension: renders a figure to the user in the TUI without spending tokens on it

## Requires

The [`pi-subagents`](https://www.npmjs.com/package/pi-subagents) package, for
custom-agent support and the `/skill:pi-subagents` dispatch pattern the skills
reference.

## Install

```bash
pi install git:github.com/shivam-v-verma/pi-eda
pi install npm:pi-eda
```

## Matplotlib style

`skill:exploring-data` respects a matplotlib template `eda.mplstyle`,
usually located at `~/.config/matplotlib/stylelib/eda.mplstyle`.

A minimal example file `eda.mplstyle.example` is given here.
