# Plotting Preferences

Style conventions and the figure-production process for
`/skill:exploring-data`. Defaults below apply to every plot
type; subsections add rules for a specific type. If a plot type has no
subsection yet, follow Defaults and ask if unsure -- don't invent a
per-type rule that hasn't been stated.

## Process

- Generate figures with matplotlib, saved as PNG, following the conventions
  below.
- Apply the user's `eda.mplstyle` at the top of the script
  (`plt.style.use("eda")`) and respect user defaults.
- Visually inspect every figure with the `read` tool before treating it as a
  result -- never make hypotheses from a figure you haven't looked at.
- `read` is for your own inspection. When you're ready to show the figure to
  the user (the "Summarize the answer" handoff), use `show` to display it.
  This will render the PNG to the user without spending your tokens
  rereading it.
- Check specifically for: overlapping/clipped labels, indistinguishable
  traces/series, and rendering artifacts (banding, gaps) that don't reflect
  real structure in the data.
- Save a table alongside the figure if it's built from a compact aggregate
  (roughly <=20 distinct values) rather than a full-row plot -- cheap at that
  size, and it avoids guessing what the report will cite.

## Defaults

If the user has not set up `eda.mplstyle` or has not offered opinions
on plot style, use these defaults:

- Colors: `eda.mplstyle` (see the repo-root `eda.mplstyle.example`) defaults to
  `lightsteelblue` for one color and `Blues`
  for a colormap -- pick something else only if needed to convey a point, e.g.
  categorical comparison.
- Gridlines: none. Spines / ticks: matplotlib defaults -- don't add or strip
  either.
- Titles: Be brief -- words must earn their space. Detailed descriptions belong
  in report prose, not the title.
- Axis labels and legends: always present, be terse.
- Sample size: prefer density/percentage over raw counts unless there's a
  specific reason to show counts.

## Bar-shaped Plots (Bar Charts, Histograms)

- Aspect ratio: 8:3 (wide).
- Shaded (filled) bars, not an unfilled outline/step line.
- **Histograms only**:
  - For continuous variables or integer variables with >= 30 bins,
      suggest KDE smoothing with filled plots. Never start with smoothing;
      instead, show an initial histogram without smoothing and suggest it.
  - For integer variables/PMF plots that are graphed without smoothing,
      ensure the number of bins aligns with the x range. Graph with shaded
      bars only.

## Square-aspect Plots (Scatter Plots, 2D Histograms)

- Aspect ratio: 1:1 (square).
- **2D Histograms only** -- include a colorbar sized to the height of
  the histogram for visual clarity.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Describing what a figure shows without having looked at the PNG | Always `read` the figure before writing anything about what it shows |
| Summarizing a figure in prose only, without the user seeing it | `show` the PNG to the user as part of the handoff, then summarize |
| Building a plot from a compact aggregate (<=20 values) with no saved table | Save the underlying table alongside the figure -- cheap at that size |
| Inventing a per-type styling rule for a plot type with no subsection yet | Follow Defaults and ask -- don't guess a convention that hasn't been stated |
| Adding a KDE overlay to a discrete-variable histogram | KDE implies continuous density -- shaded bars only, even at cleanup time |
| Histogram bars show banding or an every-other-bar artifact | Try a different bin width/count, or overlay a KDE to check if the shape is real or a binning artifact |
| Comparing multiple histograms on one axes with different bin edges per series | Use identical bin edges across all series being compared |
| A scatter plot has so many overlapping points it's an unreadable blob | Switch to `hist2d`/hexbin (density) or drop alpha significantly, instead of a plain scatter |
