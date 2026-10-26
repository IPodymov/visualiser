import type { PlanComparison } from '@features/comparison/model/types';

export type PlanVersion = {
  curriculumId: number;
  admissionYear: number;
  sourceFileName: string;
  candidatesCount: number;
};

export type PlanVersions = {
  curriculumId: number;
  admissionYear: number | null;
  catalogYear: number | null;
  isArchived: boolean;
  previous: PlanVersion | null;
  next: PlanVersion | null;
  versions: PlanVersion[];
};

export type YearComparison = {
  versions: PlanVersions;
  comparison: PlanComparison | null;
};
