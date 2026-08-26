---
name: eduplan-information-architecture
description: Structure EduPlan Compare pages and sections from context through evidence and interpretation to the next action. Use for page composition, navigation and information-order changes; not for isolated primitive styling.
---

# EduPlan Information Architecture

Organize educational information from general orientation to exact curriculum facts. Do not place blocks according to implementation convenience.

## Required page sequence

Use this semantic sequence for main routes:

1. `PageHeader`: breadcrumbs, object/action title.
2. `PageIntro`: what the user can accomplish and why it matters.
3. `PrimaryContent`: selector, search, overview, or other main task.
4. Evidence: the most decision-relevant metrics and visual patterns.
5. Interpretation: neutral observations that explain the evidence.
6. `SecondaryContent`: tables, semester groups, definitions and expanded detail.
7. `NextAction`: the most useful continuation.

The home route may use a product hero instead of breadcrumbs, but it still moves from promise to evidence to next action.

## Placement rules

- Keep plan identity and metadata before plan metrics.
- Keep comparison selectors before comparison results and retain A/B identity through every downstream block.
- Place search before catalog filters; place result count and active filters before result cards.
- Put chart explanations adjacent to the chart, not in a detached help section.
- Define unfamiliar educational terms at first relevant use, then use the same short label consistently.
- Keep destructive/account actions outside the primary analytical flow.

## Layout contract

Reuse the shared container, page header, page section, section header and next-action patterns. Section spacing represents hierarchy; arbitrary margins must not create a second layout system.

For a new section, name the user question it answers. Merge it with an existing section if the question is the same.

Read [the design specification](../../../docs/design-specification.md) when editing route hierarchy or complete page structure.
