---
name: eduplan-ux-writing
description: Write clear Russian product copy for EduPlan Compare headings, actions, definitions, states and analytical observations. Use for user-facing text; not for backend logs or developer documentation.
---

# EduPlan UX Writing

Explain educational-program data in plain Russian while preserving analytical accuracy.

## Voice

- Concrete, calm and helpful; never promotional without evidence.
- Address the user's task directly. Prefer “Найдите программу по…” over “Удобный каталог”.
- Use sentence case. Keep button labels action-oriented and specific.
- Use `ё` consistently in prose; use `ЗЕТ` and explain it at first relevant use.

## Page copy contract

- Title names the object or action.
- Subtitle explains what the user can do and which data supports it.
- CTA names the immediate result: `Найти учебный план`, `Добавить к сравнению`, `Повторить загрузку`.
- Empty state explains what happened and offers the most useful recovery.
- Error state says what failed in user terms, preserves useful context, and offers retry when possible.
- Labels remain visible after typing; placeholders show an example only.

## Analytical language

Use neutral observations:

- `Наибольшая учебная нагрузка приходится на 5-й семестр.`
- `В структуре контактных занятий больше практических часов.`
- `В программе A дисциплина начинается на два семестра раньше.`

Avoid unsupported evaluation:

- Do not say a program is better, easier, harder, more modern, or more promising based only on the curriculum facts.
- Replace “больше часов означает глубже” with “на дисциплину отведено больше часов”.
- Explain that similarity measures discipline-name overlap, not full educational equivalence.

## Avoid

- Generic welcomes, “сервис для всех”, “удобно и быстро”, “таблица различий и графики”.
- Developer language such as backend, DTO, seed, API URL or raw field names in user-facing states.
- Unexplained abbreviations and technical filter labels.
- Icon-only actions whose meaning is not immediately clear.

Review copy in its rendered context: remove repetition between eyebrow, title, subtitle and section heading.
