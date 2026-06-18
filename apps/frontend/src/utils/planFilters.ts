import type { SelectFilterConfig } from '../types/filter';
import type { EducationPlan } from '../types/plan';
import type { FacultyOption } from '../services/api/faculties';

const compareNumbersDesc = (left: string, right: string) => Number(right) - Number(left);

const uniqueSortedOptions = (
  values: Array<string | number | null | undefined>,
  sort?: (left: string, right: string) => number,
) =>
  [...new Set(values.filter((value): value is string | number => value !== null && value !== undefined).map(String))]
    .sort(sort ?? ((left, right) => left.localeCompare(right, 'ru')))
    .map((value) => ({ label: value, value }));

const uniqueFacultyOptions = (plans: EducationPlan[]) =>
  [
    ...new Map(
      plans
        .filter((plan) => plan.facultyId)
        .map((plan) => [String(plan.facultyId), { label: plan.faculty, value: String(plan.facultyId) }]),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label, 'ru'));

const facultyOptions = (plans: EducationPlan[], faculties?: FacultyOption[]) => {
  if (faculties?.length) {
    return faculties.map((faculty) => ({ label: faculty.name, value: String(faculty.id) }));
  }

  return uniqueFacultyOptions(plans);
};

export const buildPlanFilterConfig = (
  plans: EducationPlan[],
  faculties?: FacultyOption[],
): SelectFilterConfig[] => [
  {
    key: 'faculty',
    label: 'Факультет',
    placeholder: 'Факультет',
    options: facultyOptions(plans, faculties),
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
