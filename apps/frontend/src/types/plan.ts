export type Discipline = {
  id: number;
  name: string;
  module: string;
  semester: number | null;
  hours: number;
  credits: number;
  controlForm?: string | null;
  blockName?: string | null;
  partName?: string | null;
  moduleName?: string | null;
  recordType?: string | null;
  lectureHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  independentHours?: number | null;
};

export type PlanChartBucket = {
  key: string;
  label: string;
  disciplinesCount: number;
  totalHours: number;
  credits: number;
  lectureHours: number;
  practiceHours: number;
  labHours: number;
  independentHours: number;
};

export type PlanVisualization = {
  totals: {
    disciplinesCount: number;
    totalHours: number;
    credits: number;
    lectureHours: number;
    practiceHours: number;
    labHours: number;
    independentHours: number;
    contactHours: number;
  };
  bySemester: PlanChartBucket[];
  byBlock: PlanChartBucket[];
  byPart: PlanChartBucket[];
  workload: Array<{ key: string; label: string; hours: number }>;
  controlForms: Array<{ form: string; count: number }>;
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
  visualization?: PlanVisualization;
  sourceFileName?: string;
  code?: string;
  uploadedAt?: string;
};

export type AdmissionEducationLevel = 'bachelor' | 'specialist' | 'master' | 'postgraduate';
export type AdmissionStudyForm = 'fullTime' | 'partTime' | 'evening';

export type AdmissionCategory =
  | 'software'
  | 'web'
  | 'data'
  | 'ai'
  | 'security'
  | 'systems'
  | 'robotics'
  | 'embedded'
  | 'gamedev'
  | 'xr'
  | 'mediaDesign'
  | 'businessIt'
  | 'management'
  | 'engineering'
  | 'math'
  | 'research';

export type PlanRecommendation = {
  planId: number;
  title: string;
  faculty: string;
  level: string;
  studyForm: string;
  year: number;
  duration: string;
  disciplinesCount: number;
  totalHours: number;
  credits: number;
  matchPercent: number;
  reason: string;
  matchedDisciplines: string[];
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
