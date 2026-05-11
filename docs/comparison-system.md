# Comparison System

The comparison system finds overlaps and differences between two curricula.

![Сравнение](./assets/screenshots/compare-page.png)

## Backend Algorithm

`ComparisonService.compare`:

1. Loads both curricula.
2. Loads disciplines for each curriculum.
3. Normalizes discipline names with trimming, lowercase, and whitespace collapsing.
4. Builds maps by normalized name.
5. Finds common disciplines.
6. Finds disciplines only in first and only in second.
7. Compares field values for common disciplines.

Compared fields:

- `semesterNumber`;
- `controlForm`;
- `totalHours`;
- `credits`;
- `lectureHours`;
- `practiceHours`;
- `labHours`.

## Response Shape

```ts
type PlanComparison = {
  summary: {
    firstDisciplinesCount: number;
    secondDisciplinesCount: number;
    commonCount: number;
    onlyFirstCount: number;
    onlySecondCount: number;
  };
  commonDisciplines: Array<{
    name: string;
    differences: Array<{
      field: string;
      firstValue: unknown;
      secondValue: unknown;
    }>;
  }>;
  onlyInFirst: Array<{ name: string }>;
  onlyInSecond: Array<{ name: string }>;
};
```

## Frontend Visualization

The compare page renders:

- select controls for two plans;
- summary statistic cards;
- Recharts `BarChart`;
- differences table through `CompareTable`.

## Radar Chart

Radar chart is used on the details page to visualize five curriculum characteristics:

- Математика;
- Программирование;
- Аналитика;
- Soft Skills;
- Практика.

![Детали плана](./assets/screenshots/plan-details-page.png)

## Extension Ideas

- Add weighted discipline matching.
- Add module-level comparison.
- Export visual diff to PDF.
- Allow comparing more than two curricula side-by-side.
