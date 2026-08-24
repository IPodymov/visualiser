# EduPlan Compare — Design Specification

Status: approved implementation baseline
Scope: systematic product redesign of the existing React/Vite frontend with targeted API contract improvements; existing TypeScript/Express/Prisma architecture remains in place.

## Current problems

### Current system map

| Layer | Current implementation | Product consequence |
| --- | --- | --- |
| Routes | `/`, `/survey`, `/plans`, `/plans/:id`, `/compare`, `/profile`, `/login`, `/register` | The necessary scenarios exist, but their hierarchy and transitions are weakly expressed. |
| Home | Full-screen technical hero, synthetic “competency” preview, four tool-like metric cards, one CTA block | Explains available visualisation mechanics, but does not show what decision the user can make. |
| Plan catalog | Search, faculty/level/form/year filters, cards, loading and basic empty/error states | Search works, but there is no result summary, active filters, direction/profile filter, progressive loading, or mobile filter drawer. |
| Plan details | Metadata badges, four totals, a heuristic radar, semester/all-discipline tabs | The page behaves like a data table with a decorative chart; it does not reveal trajectory, workload composition, controls, or neutral analytical findings. |
| Comparison | Two selectors, four counts, common/unique stacked bars, changed-fields table | The central function lacks similarity, workload/credit deltas, semester dynamics, explicit A/B identity, unique lists, and directional indicators. |
| Survey | A substantial interest questionnaire with backend recommendations | It is valuable for the “which path fits me” question, but is visually and architecturally isolated from the main discovery flow. |
| Profile | Local profile card, favorite IDs and in-memory history | Backend favorites/history endpoints exist but are not used by the visible profile workflow, so data is not reliably persistent across sessions. |
| Auth | Generic centered card | The reason to create an account is absent; inputs rely on placeholders instead of persistent labels. |
| Navigation | Desktop links plus account action; full-screen custom mobile menu | Core pages are reachable, but Compare is not treated as the primary product action and the menu has incomplete dialog/focus behaviour. |

### Existing API and data map

- `GET /api/curricula` supports speciality name/code, faculty and admission year; the frontend applies some filters locally.
- `GET /api/curricula/:id` returns disciplines grouped by semester plus server-calculated totals, workload, control-form, block and part visualisation buckets.
- `GET /api/comparison` returns both curricula, common disciplines with per-field differences, and unique disciplines.
- `POST /api/curricula/recommendations` powers the admission-interest survey.
- `/api/profile/favorites` and `/api/profile/history` provide persistent account data.
- Faculty, speciality, discipline, validation, import, download and user APIs are present and remain intact.
- Prisma models cover users, faculties, specialities, curricula, disciplines, curriculum-discipline facts, classifications, favorites, view history and download history.

### UX weaknesses

1. Product meaning appears after UI mechanics. “Radar”, “Diff”, and “Live” describe implementation rather than user outcomes.
2. The first screen resembles a technical dashboard: dark grid, strong gradients, glow shadows and oversized tool metrics compete with educational content.
3. Page structures are inconsistent. Similar page intros, errors and state blocks are reimplemented rather than composed from shared layout/state components.
4. Important values are unexplained or misleading. The catalog’s “load percentage” is derived from a normative credit value, while the radar uses client-side keyword heuristics with a minimum score; both can look more authoritative than the data supports.
5. The list endpoint is enriched through multiple detail requests when metrics are missing. This preserves data but creates an N+1-style loading cost.
6. The comparison selector mutates a prepended ID list rather than replacing a defined A or B slot. Changing one selector may reorder both selected plans.
7. The comparison client mapping discards the `first` and `second` records returned for common disciplines, limiting richer comparison UI.
8. Comparison communicates counts but not interpretation: no similarity formula, signed deltas, workload composition, semester comparison or concise findings.
9. Catalog cards do not consistently expose profile, direction code, education form and useful analysis metrics before navigation.
10. Profile UI reads Zustand/local state while a separate `profileApi` is unused. In-memory history disappears on refresh; favorites are not synchronised to the backend.
11. Data states are fragmented: catalog has several states, plan detail uses a spinner/plain error, compare uses a spinner/error strip, profile has only one skeleton, and survey/auth define their own patterns.
12. Mobile tables only scroll horizontally. Dense analytical rows need compact card alternatives or clearly signposted scrolling.
13. Auth inputs do not have visible labels. Custom mobile navigation does not implement full focus trapping/restoration.
14. Numerous page-level CSS files repeat surfaces, gradients, typography and spacing; primitives also hard-code slate/sky/violet values instead of semantic tokens.

### Components to consolidate

- Replace repeated page eyebrow/title/description wrappers with `PageHeader`, `PageIntro` and `Breadcrumbs`.
- Replace `StatsCard` variants and ad-hoc metric boxes with a single `MetricCard` supporting context, comparison tone and delta.
- Replace inline red error panels and raw spinners with `ErrorState` and `LoadingState`.
- Keep one `PlanCard` for catalog, favorites, history and recommendation contexts, with explicit compact/full variants.
- Replace `GradientButton` with semantic Button variants; a product action should not require a separate primitive.
- Replace the heuristic `RadarStatsCard` with source-backed `ChartCard` visualisations.
- Keep `DisciplineTable` and `CompareTable` as domain components, but give each a mobile representation and shared table shell.
- Consolidate page containers and section spacing into a shared layout layer.

## Product principles

1. **Meaning before mechanics.** Every screen starts from the user, their question, and the decision enabled by the data.
2. **Understanding over exposure.** Raw facts are followed by a neutral interpretation, not merely displayed because an API returns them.
3. **Comparison is a first-class action.** A user can add or replace A/B plans without losing the other selection and can recognise direction at a glance.
4. **Evidence over decoration.** Charts use source-backed curriculum values. Derived values name the formula or are presented as neutral observations.
5. **General to specific.** Context, summary, visual pattern, details and next action appear in that order.
6. **One entity, one visual language.** Plans, metrics, statuses and comparison indicators retain the same semantics across routes.
7. **Progressive depth.** A first-time visitor can understand summaries; an expert can expand semesters and inspect exact values.
8. **Calm academic clarity.** Surfaces, hierarchy and typography support reading and analysis without visual spectacle.
9. **Real DTOs, strict types.** UI derives from backend fields and preserves uncertainty or absence instead of inventing content.
10. **Every remote block has a state.** Loading, empty, error and retry behaviour are designed with the normal state.

## Information architecture

### Target system map

```text
Global navigation
├── Главная /
│   ├── Product promise
│   ├── Four user outcomes
│   ├── Three-step workflow
│   ├── Realistic comparison demonstration
│   ├── Analysed data
│   ├── Audience scenarios
│   └── Next action: catalog or comparison
├── Учебные планы /plans
│   ├── Search and filters
│   ├── Result count and active filters
│   ├── Reusable plan cards
│   └── Pagination/progressive reveal
├── План /plans/:id
│   ├── Identity and metadata
│   ├── Source-backed key metrics
│   ├── Semester trajectory
│   ├── Workload composition
│   ├── Neutral analytical observations
│   ├── Searchable semester disciplines
│   └── Next action: compare
├── Сравнение /compare
│   ├── Stable A/B selectors
│   ├── Similarity and delta summary
│   ├── Workload comparison
│   ├── Semester dynamics
│   ├── Common changed disciplines
│   ├── Only A / only B
│   └── Next action: inspect or replace plan
├── Подбор по интересам /survey
│   ├── Existing questionnaire
│   └── Recommendations linking into plan analysis/comparison
└── Аккаунт
    ├── /profile: favorites and history
    ├── /login
    └── /register
```

### Shared page sequence

Every main route uses the same semantic composition:

1. `PageHeader` — breadcrumbs and object/action title.
2. `PageIntro` — what can be done and why it matters.
3. `PrimaryContent` — the main decision task.
4. `SecondaryContent` — supporting facts and detail.
5. `NextAction` — the most relevant continuation.

The home page uses the same container and section system but begins with a product hero rather than breadcrumbs.

## Design system

### Visual direction

- Light, low-noise editorial base with deep navy text, cool neutral surfaces and a restrained blue brand accent.
- Blue identifies the product and Program A; warm amber identifies Program B. Teal is reserved for shared/present/success semantics.
- Gradients are limited to subtle background accents, never used as the sole carrier of meaning.
- Shadows communicate elevation only for overlays and selected cards; ordinary content uses borders and surface contrast.

### Tokens

| Group | Scale |
| --- | --- |
| Typography | display `clamp(2.75rem, 6vw, 4.75rem)`; h1 `clamp(2.25rem, 4vw, 3.5rem)`; h2 `clamp(1.75rem, 3vw, 2.5rem)`; h3 `1.25rem`; body-lg `1.125rem`; body `1rem`; small `0.875rem`; micro `0.75rem` |
| Weight | 400 body; 500 controls/meta; 600 section/card headings; 700 page/display headings |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64, 80, 96 px |
| Container | max 1240 px; 24 px desktop padding, 20 px tablet, 16 px mobile |
| Grid | 12 columns desktop, 8 tablet, 4 mobile; 24/20/16 px gutters |
| Radius | 8 px controls, 12 px cards, 16 px feature panels, 999 px pills |
| Shadows | `sm` subtle card hover, `md` menus/dialogs only |
| Breakpoints | mobile < 640; tablet 640–1023; desktop ≥ 1024; wide ≥ 1280 |

### Surface hierarchy

1. Page background — cool off-white.
2. Base surface — white content cards.
3. Subtle surface — filters, inset summaries and table headers.
4. Strong surface — deep navy product/demo sections.
5. Overlay surface — menus, drawers and dialogs with shadow and focus boundary.

### Semantic colours

- Brand/action: blue.
- Shared/equal/success: teal.
- Program A: blue.
- Program B: amber.
- Warning: ochre.
- Error/destructive: red.
- Neutral/missing: slate.
- Every chart tone is repeated with a text label, pattern, icon or explicit A/B marker.

### Interaction states

- Hover changes border/background without layout movement.
- Focus uses a visible 3 px ring with offset on every interactive element.
- Active/selected uses a persistent filled or outlined state.
- Disabled retains readable labels and communicates non-availability.
- Loading keeps layout dimensions stable with skeletons.
- Reduced-motion users receive no non-essential transforms or animated scrolling.

### Responsive behaviour

- Header collapses below 900–1024 px; the Compare action remains visible where space allows.
- Catalog filters become a summary bar plus drawer on mobile.
- Plan and comparison metrics use 4/2/1-column layouts.
- A/B selectors become stacked but retain explicit program identity.
- Charts keep minimum plot heights and shorter axis labels; detailed values remain available in adjacent summaries.
- Dense tables provide a mobile card list; desktop tables remain horizontally scrollable as a safety fallback.

## Component inventory

### Primitives

| Component | Decision |
| --- | --- |
| `Button` | Refactor into primary, secondary, outline, ghost and destructive semantic variants; remove glow. |
| `Input` | Refactor colour/focus tokens; always pair with visible `Label`. |
| `Select` | Retain Radix primitive, refactor tokens and labels. |
| `Badge` | Add neutral, brand, A, B, shared and status variants. |
| `Card` | Refactor to base, subtle, strong and interactive surfaces. |
| `Tabs`, `Accordion`, `Table`, `Skeleton` | Retain and unify focus, density and colour tokens. |
| `Dialog`, `Drawer`, `Tooltip` | Add reusable accessible overlays where required. |

### Shared composed components

- `PageHeader`, `PageIntro`, `PageSection`, `SectionHeader`, `NextAction`.
- `Breadcrumbs`.
- `SearchField`, `FilterField`, `ActiveFilters`, mobile `FilterDrawer`.
- `MetricCard`.
- `ChartCard` with question, legend/description and insight slot.
- `ComparisonIndicator` with more/less/equal/only-A/only-B states.
- `LoadingState`, `EmptyState`, `ErrorState`.
- `Pagination` or progressive reveal control.

### Domain components

- `PlanCard` full and compact variants.
- `PlanSelector` for fixed A/B slots.
- `PlanMetadata`.
- `SemesterWorkloadChart`.
- `WorkloadComposition`.
- `DisciplineExplorer` with semester accordion and search.
- `ComparisonSummary`.
- `WorkloadComparisonChart`.
- `ComparisonDisciplineTable` and unique discipline lists.

## Page structure

### Home

- Hero answers what the service does in one sentence and offers `Найти учебный план` / `Сравнить программы`.
- A compact comparison mock demonstrates common, A-only, B-only and workload difference values without pretending they are live API data.
- Four scenario cards answer “what can I learn?”.
- Three numbered steps explain the flow.
- Analysed data is shown as a compact taxonomy, not dashboard metrics.
- Audience scenarios appear below product evidence.
- Closing action routes to catalog, comparison and the interest survey.

### Catalog

- Title: find an educational program, not browse a grid.
- Search precedes filters; result count and active filter chips provide feedback.
- Direction/profile are supported by search against the actual title/code; available backend dimensions remain strictly typed.
- Cards expose title, code, faculty, year, level, form, discipline count and useful totals where present.
- Favorites state explains sign-in requirements; compare action gives immediate feedback.
- Progressive reveal prevents an unbounded first render while preserving the existing API contract.

### Plan details

- Identity/metadata and actions are followed by seven source-backed metrics.
- Semester chart answers when workload peaks and how it changes.
- Workload composition answers how study time is distributed.
- Neutral findings are generated only from non-empty source values.
- Discipline explorer supports search, semester grouping and control/load values.
- Synthetic competency radar is removed from the authoritative overview.

### Comparison

- Plan A and B are fixed slots with replace semantics and duplicate prevention.
- Similarity = `2 × common / (discipline count A + discipline count B)`, labelled as discipline-name overlap.
- Summary shows common, unique A/B, hours and credit deltas with directional language.
- Totals and lecture/practice/lab/independent values are compared side by side.
- Semester chart uses A/B lines or grouped bars.
- Common disciplines show only changed parameters; unique disciplines are separate A/B lists.
- Tables never require users to infer which larger value belongs to which program.

### Profile and auth

- Profile loads server favorites/history for authenticated users and uses reusable plan cards.
- Guests receive an account-value explanation and clear sign-in action.
- Auth uses a split product/value layout, persistent labels, field-level hints and meaningful errors.

## User flows

### First-time exploration

`Home → understand product example → catalog → filter/search → plan overview → compare with another plan`

### Direct comparison

`Home/Header Compare → choose A → choose B → interpret summary → inspect semester/workload differences → inspect only-A/only-B disciplines → open selected plan`

### Interest-led decision

`Home secondary CTA → survey → recommendations → plan details → add recommendation to comparison`

### Returning user

`Login → profile → favorite/recent plan → continue analysis or comparison`

### Failure recovery

`Remote block error → plain explanation → retry → preserve valid filters/selections when possible`

## Redesign priorities

1. Establish tokens, layout primitives and reusable states before page-specific styling.
2. Make the home page communicate the thesis-level product value within 5–10 seconds.
3. Repair comparison selection and data mapping before expanding the central analytical screen.
4. Use existing server visualisation DTOs for plan and comparison charts.
5. Make catalog search/filter feedback visible and cards decision-ready.
6. Connect profile UI to persistent APIs while preserving safe local fallback behaviour.
7. Remove synthetic/decorative analytical claims or label any demonstration explicitly.
8. Finish with mobile table alternatives, keyboard/focus checks and a cross-route consistency audit.

## Implementation phases

### Phase 1 — Design system and layout

- Replace visual tokens, surfaces, type/spacing scale and shared container rules.
- Refactor primitives and introduce shared page, metric, chart and state components.
- Update header/footer and semantic navigation.
- Check desktop/tablet/mobile shells, focus visibility and reduced motion.

### Phase 2 — Home and product meaning

- Rebuild the hero, scenario cards, workflow, comparison demonstration, analysed-data and audience sections.
- Verify that value, objects of comparison and next actions are explicit without scrolling through a dashboard.

### Phase 3 — Catalog

- Refactor filters, results feedback, active chips, plan cards and progressive reveal.
- Add mobile drawer behaviour and consistent empty/error/loading states.

### Phase 4 — Plan details

- Add metadata, source-backed metrics, semester/workload charts, discipline exploration and neutral observations.
- Remove the heuristic radar from the primary experience.

### Phase 5 — Comparison

- Implement stable A/B selection and preserve both program DTOs.
- Add similarity, signed deltas, workload and semester comparison, common changes and unique lists.
- Verify same-plan prevention, empty states and API retry.

### Phase 6 — Profile and auth

- Load persistent favorites/history, reuse plan presentation, and add meaningful guest states.
- Redesign login/register around account value and accessible labels.

### Phase 7 — Responsive, accessibility and states

- Validate keyboard sequence, focus visibility, semantic landmarks, labels, contrast and reduced motion.
- Check mobile filters, selectors, charts, card grids and table alternatives.
- Verify loading, skeleton, empty, error, retry and success feedback for every remote flow.

### Phase 8 — Final consistency audit

- Search for duplicate component implementations and hard-coded visual tokens.
- Run lint, strict TypeScript build and backend tests.
- Verify the complete home → catalog → detail → comparison → profile/auth story at desktop and mobile widths.
- Re-answer the 12 final product questions using observed behaviour, not intention.
