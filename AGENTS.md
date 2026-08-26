# EduPlan Compare project rules

Canonical project skills live in `.codex/skills`; `.agents/skills` contains the discovery symlinks required by Codex. Use these skills for frontend product work:

- Load `eduplan-product-meaning`, `eduplan-information-architecture`, and `eduplan-ux-writing` when creating or materially changing a page.
- Load `eduplan-design-system` before adding a primitive, composed UI component, layout pattern, or visual token.
- Load `eduplan-data-visualization` before adding or changing a chart, metric interpretation, or analytical observation.
- Load `eduplan-comparison-ux` for any comparison selector, summary, delta, A/B visual, or discipline-difference UI.

Before adding a component, search `apps/frontend/src/shared/ui`, `entities/*/ui`, `features/*/ui`, and `widgets` for an existing primitive or domain equivalent. Preserve the React/Vite + TypeScript frontend, Express/Prisma backend, and current DTOs unless a targeted contract change is necessary for the user journey.

Treat `docs/design-specification.md` as the redesign baseline. A page must progress from context to main task, evidence, interpretation, detail, and next action. Do not present heuristic or synthetic values as source-backed curriculum facts.
