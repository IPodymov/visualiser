export type PlanFilters = {
  query: string;
  faculty: string;
  direction: string;
  profile: string;
  level: string;
  studyForm: string;
};

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
