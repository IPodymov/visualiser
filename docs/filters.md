# Filters

Filters are generated from the loaded curriculum list so the UI stays aligned with real database values.

## Config Shape

`usePlans` builds select filter config with `buildPlanFilterConfig(plans)` from:

```text
apps/frontend/src/utils/planFilters.ts
```

The generated config describes visible select filters:

```ts
export type SelectFilterConfig = {
  key: 'faculty' | 'level' | 'studyForm' | 'year';
  label: string;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
};
```

## Component API

`SearchFilters` receives config and state via props:

```tsx
const { filterConfig, filters, setFilters, reload } = usePlans();

<SearchFilters
  config={filterConfig}
  filters={filters}
  onChange={setFilters}
  onSubmit={() => reload(filters)}
/>
```

## Search

The search input is a clean text field without an icon. It filters locally by:

- plan title;
- faculty;
- speciality code.

## Backend Query Parameters

The backend accepts:

| Frontend State | Backend Parameter |
| --- | --- |
| `query` | `specialityName` |
| `year` | `admissionYear` |

The frontend does not send:

- `undefined`;
- `null`;
- empty strings;
- `all`;
- non-numeric year values.

This prevents backend validation errors such as `admissionYear=all`.

## Local and Server Filtering

The frontend fetches a list from backend, then applies local UI filters for faculty, level, study form, and year. The server still supports `specialityName`, `specialityCode`, and `admissionYear` for efficient filtering.
