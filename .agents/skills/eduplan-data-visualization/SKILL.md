---
name: eduplan-data-visualization
description: Design and review source-backed curriculum charts, metric groups and analytical observations in EduPlan Compare. Use whenever adding or changing a visualization or interpretation; not for decorative illustration.
---

# EduPlan Data Visualization

Every visualization must answer a curriculum question more quickly than a table alone.

## Chart decision

Before implementation, record:

1. The exact comparison or pattern the user should see.
2. Why a chart is better than a short metric list or table.
3. Measure, unit, grouping and source DTO field.
4. Required legend, A/B identity and missing-data behaviour.
5. One neutral conclusion the chart can support.

Do not render the chart if source values are empty or the visual encoding would imply precision the data does not have.

## Preferred mappings

- Semester workload or discipline count: line/grouped bar by ordered semester.
- Lecture/practice/lab/independent composition: proportional bar plus exact values; use a pie only when labels remain readable and parts form a meaningful whole.
- A/B workload: aligned bars with a shared zero baseline and explicit values/deltas.
- Common versus unique disciplines: counts/proportions with common, only A and only B semantics.
- Many exact discipline differences: table or mobile cards, not a chart.

## Integrity rules

- Use `visualization.totals`, `bySemester`, `workload`, `controlForms`, and discipline facts when available.
- Do not present keyword-derived competency scores as measured curriculum properties.
- Label derived similarity with its definition. Current discipline overlap formula: `2 × common / (count A + count B)`.
- Start quantitative axes at zero for bars. Preserve chronological semester order.
- Show units in tooltip and adjacent summary; do not rely on hover for essential information.
- Generate observations only from non-empty facts and use neutral language such as “наибольшая нагрузка приходится…”.
- Never conclude that more hours means better quality or that one program is universally stronger.

Each `ChartCard` should expose the question, chart, legend/values, and an optional evidence-backed observation.
