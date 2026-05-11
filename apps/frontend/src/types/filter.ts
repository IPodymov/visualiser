import type { PlanFilters } from './plan';

export type FilterOption = {
  label: string;
  value: string;
};

export type SelectFilterConfig = {
  key: Exclude<keyof PlanFilters, 'query'>;
  label: string;
  placeholder: string;
  options: FilterOption[];
};
