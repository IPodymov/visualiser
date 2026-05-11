# Styling

The frontend uses a hybrid styling approach:

- Tailwind CSS for simple layout utilities;
- CSS variables for design tokens;
- colocated component CSS for maintainable visual styling;
- shadcn-style UI primitives for base controls.

## Global Styles

```text
styles/
├── variables.css
├── globals.css
├── typography.css
├── layout.css
└── index.css
```

## CSS Variables

`variables.css` defines:

- colors;
- radius values;
- spacing values;
- shadows;
- transitions;
- blur values.

Example:

```css
:root {
  --surface-glass: rgba(255, 255, 255, 0.065);
  --shadow-glass: 0 18px 80px rgba(2, 8, 23, 0.38);
  --radius-md: 0.5rem;
}
```

## Component CSS

Large components have colocated CSS:

```text
components/Header/Header.css
components/PlanCard/PlanCard.css
components/SearchFilters/SearchFilters.css
pages/PlansPage/PlansPage.css
```

## Naming Convention

Component styles use BEM-like class names:

```css
.site-header {}
.site-header__inner {}
.site-header__profile-menu {}
```

## Tailwind Strategy

Tailwind remains useful for:

- one-off flex/grid utilities;
- text sizes;
- responsive utility classes;
- icon sizing.

Core visual styling should live in CSS files when it is repeated or important for future design editing.

## Breakpoints

The app uses standard Tailwind breakpoints and plain CSS media queries:

| Breakpoint | Typical Use |
| --- | --- |
| `768px` | Tablet layout |
| `1024px` | Desktop grids |
| `1280px` | Wide catalog grids |

## Visual Theme

The interface uses:

- dark premium background;
- blue/violet gradients;
- glassmorphism cards;
- soft shadows;
- compact SaaS-style information grids.
