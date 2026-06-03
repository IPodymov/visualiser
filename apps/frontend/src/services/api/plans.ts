import { AxiosError } from 'axios';
import { apiClient } from './client';
import { fallbackPlans } from './fallbackPlans';
import type { EducationPlan, PlanComparison, PlanFilters, PlanVisualization } from '../../types/plan';

type BackendCurriculum = {
  id: number;
  specialityId: number;
  admissionYear: number | null;
  educationLevel: string | null;
  educationForm: string | null;
  profileName: string | null;
  sourceFileName: string;
  uploadedAt: string;
  speciality: {
    id: number;
    code: string;
    name: string;
  };
  semesters?: Array<{
    number: number | null;
    disciplines: BackendDiscipline[];
  }>;
  disciplines?: BackendDiscipline[];
  visualization?: PlanVisualization;
};

type BackendDiscipline = {
  curriculumDisciplineId?: number;
  disciplineId?: number;
  id?: number;
  name: string;
  semesterNumber: number | null;
  totalHours: number | null;
  credits: string | number | null;
  controlForm?: string | null;
  blockName?: string | null;
  partName?: string | null;
  moduleName?: string | null;
  recordType?: string | null;
  lectureHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  independentHours?: number | null;
  classifications?: Array<{
    groupCode: string;
    groupName?: string;
    valueName: string;
  }>;
};

type BackendComparison = {
  firstCurriculum: BackendCurriculum;
  secondCurriculum: BackendCurriculum;
  summary: PlanComparison['summary'];
  commonDisciplines: PlanComparison['commonDisciplines'];
  onlyInFirst: Array<{ name: string; totalHours?: number; credits?: string | number }>;
  onlyInSecond: Array<{ name: string; totalHours?: number; credits?: string | number }>;
};

const levelByCode = (code?: string, fallback?: string | null) => {
  if (fallback) return fallback;
  if (code?.includes('.04.')) return 'Магистратура';
  if (code?.includes('.05.')) return 'Специалитет';
  return 'Бакалавриат';
};

const facultyFromSource = (source?: string) => {
  if (!source) return 'Университет';
  if (source.includes('/')) return source.split('/').find((part) => part.includes('Ф')) ?? 'Университет';
  if (source.includes('ФИТ')) return 'ФИТ';
  return 'Университет';
};

const asNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(',', '.')) || 0;
  return 0;
};

const flattenDisciplines = (curriculum: BackendCurriculum) => {
  if (curriculum.semesters?.length) {
    return curriculum.semesters.flatMap((semester) =>
      semester.disciplines.map((discipline) => ({ ...discipline, semesterNumber: discipline.semesterNumber ?? semester.number })),
    );
  }
  return curriculum.disciplines ?? [];
};

const buildCompetencies = (disciplines: BackendDiscipline[]) => {
  const total = Math.max(disciplines.reduce((sum, item) => sum + (item.totalHours ?? 0), 0), 1);
  const byName = (tokens: string[]) =>
    disciplines
      .filter((item) => tokens.some((token) => item.name.toLowerCase().includes(token)))
      .reduce((sum, item) => sum + (item.totalHours ?? 0), 0);

  const scores = [
    { name: 'Математика' as const, raw: byName(['математ', 'алгебр', 'статист']) },
    { name: 'Программирование' as const, raw: byName(['программ', 'разработ', 'алгоритм', 'web', 'веб']) },
    { name: 'Аналитика' as const, raw: byName(['аналит', 'данн', 'модел']) },
    { name: 'Soft Skills' as const, raw: byName(['команд', 'проект', 'коммуникац', 'менедж']) },
    { name: 'Практика' as const, raw: byName(['практик', 'проект', 'исследователь']) },
  ];

  return scores.map((score, index) => ({
    name: score.name,
    value: Math.min(100, Math.max(35, Math.round((score.raw / total) * 280 + 44 + index * 3))),
  }));
};

export const toPlan = (curriculum: BackendCurriculum): EducationPlan => {
  const backendDisciplines = flattenDisciplines(curriculum);
  const disciplines = backendDisciplines.map((item, index) => ({
    id: item.curriculumDisciplineId ?? item.disciplineId ?? item.id ?? index,
    name: item.name,
    module:
      item.moduleName ??
      item.partName ??
      item.blockName ??
      item.classifications?.[0]?.valueName ??
      item.classifications?.[0]?.groupName ??
      'Учебный модуль',
    semester: item.semesterNumber,
    hours: item.totalHours ?? 0,
    credits: asNumber(item.credits),
    controlForm: item.controlForm,
    blockName: item.blockName,
    partName: item.partName,
    moduleName: item.moduleName,
    recordType: item.recordType,
    lectureHours: item.lectureHours,
    practiceHours: item.practiceHours,
    labHours: item.labHours,
    independentHours: item.independentHours,
  }));
  const totalHours = disciplines.reduce((sum, item) => sum + item.hours, 0);
  const credits = Math.round(disciplines.reduce((sum, item) => sum + item.credits, 0));
  const semesters = new Set(disciplines.map((item) => item.semester).filter(Boolean)).size;
  const title = curriculum.profileName || curriculum.speciality.name;

  return {
    id: curriculum.id,
    title,
    faculty: facultyFromSource(curriculum.sourceFileName),
    level: levelByCode(curriculum.speciality.code, curriculum.educationLevel),
    studyForm: curriculum.educationForm ?? 'Очная',
    year: curriculum.admissionYear ?? new Date(curriculum.uploadedAt).getFullYear(),
    duration: semesters > 4 ? '4 года' : semesters > 0 ? '2 года' : 'не указана',
    description: `Учебный план "${title}" по направлению ${curriculum.speciality.code} ${curriculum.speciality.name}. Данные готовы для анализа дисциплин, семестров, часов и ЗЕТ.`,
    totalHours,
    credits,
    semesters,
    competencies: buildCompetencies(backendDisciplines),
    disciplines,
    visualization: curriculum.visualization,
    sourceFileName: curriculum.sourceFileName,
    code: curriculum.speciality.code,
    uploadedAt: curriculum.uploadedAt,
  };
};

const isNetworkProblem = (error: unknown) =>
  error instanceof AxiosError && (!error.response || error.code === 'ECONNABORTED');

const buildListParams = (filters?: Partial<PlanFilters>) => {
  const params: Record<string, string | number> = {};
  const query = filters?.query?.trim();
  const year = filters?.year;

  if (query) {
    params.specialityName = query;
  }

  if (year && year !== 'all') {
    const admissionYear = Number(year);
    if (Number.isInteger(admissionYear)) {
      params.admissionYear = admissionYear;
    }
  }

  return params;
};

export const plansApi = {
  async list(filters?: Partial<PlanFilters>) {
    try {
      const params = buildListParams(filters);
      const response = await apiClient.get<BackendCurriculum[]>('/api/curricula', { params });
      return response.data.map(toPlan);
    } catch (error) {
      if (isNetworkProblem(error)) return fallbackPlans;
      throw error;
    }
  },

  async getById(id: number) {
    const fallback = fallbackPlans.find((plan) => plan.id === id);
    try {
      const response = await apiClient.get<BackendCurriculum>(`/api/curricula/${id}`);
      return toPlan(response.data);
    } catch (error) {
      if (isNetworkProblem(error) && fallback) return fallback;
      throw error;
    }
  },

  async compare(firstId: number, secondId: number): Promise<PlanComparison> {
    try {
      const response = await apiClient.get<BackendComparison>('/api/comparison', {
        params: { firstCurriculumId: firstId, secondCurriculumId: secondId },
      });
      return {
        firstPlan: toPlan(response.data.firstCurriculum),
        secondPlan: toPlan(response.data.secondCurriculum),
        summary: response.data.summary,
        commonDisciplines: response.data.commonDisciplines,
        onlyInFirst: response.data.onlyInFirst.map((item) => ({
          name: item.name,
          hours: item.totalHours,
          credits: asNumber(item.credits),
        })),
        onlyInSecond: response.data.onlyInSecond.map((item) => ({
          name: item.name,
          hours: item.totalHours,
          credits: asNumber(item.credits),
        })),
      };
    } catch (error) {
      if (isNetworkProblem(error)) {
        return {
          firstPlan: fallbackPlans[0],
          secondPlan: fallbackPlans[1],
          summary: {
            firstDisciplinesCount: fallbackPlans[0].disciplines.length,
            secondDisciplinesCount: fallbackPlans[1].disciplines.length,
            commonCount: 0,
            onlyFirstCount: fallbackPlans[0].disciplines.length,
            onlySecondCount: fallbackPlans[1].disciplines.length,
          },
          commonDisciplines: [],
          onlyInFirst: fallbackPlans[0].disciplines,
          onlyInSecond: fallbackPlans[1].disciplines,
        };
      }
      throw error;
    }
  },
};
