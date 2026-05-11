export type Discipline = {
  id: number;
  name: string;
  module: string;
  semester: number | null;
  hours: number;
  credits: number;
  controlForm?: string | null;
  lectureHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
};

export type CompetencyScore = {
  name: 'Математика' | 'Программирование' | 'Аналитика' | 'Soft Skills' | 'Практика';
  value: number;
};

export type EducationPlan = {
  id: number;
  title: string;
  faculty: string;
  level: string;
  studyForm: string;
  year: number;
  duration: string;
  description: string;
  totalHours: number;
  credits: number;
  semesters: number;
  competencies: CompetencyScore[];
  disciplines: Discipline[];
  sourceFileName?: string;
  code?: string;
  uploadedAt?: string;
};

export type PlanFilters = {
  query: string;
  faculty: string;
  level: string;
  studyForm: string;
  year: string;
};

export type CompareSummary = {
  firstDisciplinesCount: number;
  secondDisciplinesCount: number;
  commonCount: number;
  onlyFirstCount: number;
  onlySecondCount: number;
};

export type PlanComparison = {
  firstPlan: Pick<EducationPlan, 'id' | 'title' | 'faculty' | 'year'>;
  secondPlan: Pick<EducationPlan, 'id' | 'title' | 'faculty' | 'year'>;
  summary: CompareSummary;
  commonDisciplines: Array<{
    name: string;
    differences: Array<{
      field: string;
      firstValue: unknown;
      secondValue: unknown;
    }>;
  }>;
  onlyInFirst: Array<{ name: string; hours?: number; credits?: number }>;
  onlyInSecond: Array<{ name: string; hours?: number; credits?: number }>;
};

export type UserProfile = {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
};
