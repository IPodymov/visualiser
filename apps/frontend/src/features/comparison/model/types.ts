import type { Discipline, EducationPlan } from '@entities/plan/model/types';

export type CompareSummary = {
  firstDisciplinesCount: number;
  secondDisciplinesCount: number;
  commonCount: number;
  onlyFirstCount: number;
  onlySecondCount: number;
};

export type PlanComparison = {
  firstPlan: EducationPlan;
  secondPlan: EducationPlan;
  summary: CompareSummary;
  commonDisciplines: Array<{
    name: string;
    first: Discipline;
    second: Discipline;
    differences: Array<{
      field: string;
      firstValue: unknown;
      secondValue: unknown;
    }>;
  }>;
  onlyInFirst: Discipline[];
  onlyInSecond: Discipline[];
};
