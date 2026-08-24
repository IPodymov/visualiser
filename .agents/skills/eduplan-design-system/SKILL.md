---
name: eduplan-design-system
description: Maintain EduPlan Compare visual tokens, responsive layout and reusable primitives/composed components. Use when changing styles, layouts or components; do not use for backend-only tasks.
---

# EduPlan Design System

Keep the interface a calm academic analytical product. Extend the existing component system instead of creating page-specific visual dialects.

## Before adding UI

1. Search `apps/frontend/src/components/ui` for a primitive.
2. Search domain and shared components for the same entity or state.
3. Extend variants or composition when semantics match; create a component only for a distinct reusable responsibility.
4. Use semantic CSS variables instead of hard-coded slate/sky/violet values in page code.

## Core scales

- Space: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96 px.
- Radius: 8 px controls, 12 px cards, 16 px feature panels, pill only for chips/status.
- Container: 1240 px max; 24 px desktop, 20 px tablet, 16 px mobile gutters.
- Type roles: display, page title, section title, card title, body-large, body, small, micro.
- Breakpoints: mobile below 640, tablet 640–1023, desktop 1024+, wide 1280+.

## Surface and colour rules

- Use off-white page, white base surface, cool subtle surface, deep navy strong surface, and elevated overlay.
- Brand/action and Program A use blue; Program B uses amber; common/equal/success uses teal; error uses red; missing uses slate.
- Do not use colour alone for A/B, success, or deltas. Repeat identity in labels/icons/text.
- Reserve shadows for overlays and selected/interactive elevation. Avoid glow, glassmorphism and decorative gradients.

## Component invariants

- Buttons have visible text unless an adjacent accessible label and universally understood icon make icon-only operation appropriate.
- Inputs have persistent labels; placeholders are examples, not labels.
- Cards do not become clickable containers if they contain multiple nested actions.
- Tables keep semantic headers; mobile analytical tables receive a card alternative or an explicit usable scroll region.
- Focus rings are visible against every surface. Honour `prefers-reduced-motion`.
- Remote sections use the shared loading, empty and error patterns without layout collapse.

Read [the design specification](../../../docs/design-specification.md) for the full token and component inventory.
