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
