import type { SelectFilterConfig } from '../types/filter';
import type { EducationPlan } from '../types/plan';

const compareNumbersDesc = (left: string, right: string) => Number(right) - Number(left);

const uniqueSortedOptions = (
  values: Array<string | number | null | undefined>,
  sort?: (left: string, right: string) => number,
) =>
  [...new Set(values.filter((value): value is string | number => value !== null && value !== undefined).map(String))]
    .sort(sort ?? ((left, right) => left.localeCompare(right, 'ru')))
    .map((value) => ({ label: value, value }));

export const buildPlanFilterConfig = (plans: EducationPlan[]): SelectFilterConfig[] => [
  {
    key: 'faculty',
    label: 'Факультет',
    placeholder: 'Факультет',
    options: uniqueSortedOptions(plans.map((plan) => plan.faculty)),
  },
  {
    key: 'level',
    label: 'Уровень',
    placeholder: 'Уровень',
    options: uniqueSortedOptions(plans.map((plan) => plan.level)),
  },
  {
    key: 'studyForm',
    label: 'Форма',
    placeholder: 'Форма',
    options: uniqueSortedOptions(plans.map((plan) => plan.studyForm)),
  },
  {
    key: 'year',
    label: 'Год',
    placeholder: 'Год',
    options: uniqueSortedOptions(
      plans.map((plan) => plan.year),
      compareNumbersDesc,
    ),
  },
];
