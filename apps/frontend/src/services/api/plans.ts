import axios from 'axios';
import { apiClient } from './client';
import { asNumber, type BackendCurriculum, toPlan } from './planMapper';
import type {
  AdmissionCategory,
  AdmissionEducationLevel,
  AdmissionStudyForm,
  PlanComparison,
  PlanFilters,
  PlanRecommendation,
} from '../../types/plan';

type BackendComparison = {
  firstCurriculum: BackendCurriculum;
  secondCurriculum: BackendCurriculum;
  summary: PlanComparison['summary'];
  commonDisciplines: PlanComparison['commonDisciplines'];
  onlyInFirst: Array<{ name: string; totalHours?: number; credits?: string | number }>;
  onlyInSecond: Array<{ name: string; totalHours?: number; credits?: string | number }>;
};

const isNetworkProblem = (error: unknown) =>
  axios.isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED');

const toApiError = (error: unknown, fallbackMessage: string) => {
  if (isNetworkProblem(error)) {
    return new Error('Сервер учебных планов недоступен. Проверьте подключение и повторите запрос.');
  }

  if (axios.isAxiosError(error)) {
    const backendMessage =
      typeof error.response?.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data &&
      typeof error.response.data.message === 'string'
        ? error.response.data.message
        : null;

    return new Error(
      backendMessage ? `${fallbackMessage}: ${backendMessage}` : `${fallbackMessage}. Повторите запрос позже.`,
    );
  }
  if (error instanceof Error) return error;
  return new Error(fallbackMessage);
};

const buildListParams = (filters?: Partial<PlanFilters>) => {
  const params: Record<string, string | number> = {};
  const year = filters?.year;
  const faculty = filters?.faculty;

  if (faculty && faculty !== 'all') {
    const facultyId = Number(faculty);
    if (Number.isInteger(facultyId)) {
      params.facultyId = facultyId;
    }
  }

  if (year && year !== 'all') {
    const admissionYear = Number(year);
    if (Number.isInteger(admissionYear)) {
      params.admissionYear = admissionYear;
    }
  }

  return params;
};

const hasCurriculumMetrics = (curriculum: BackendCurriculum) =>
  Boolean(curriculum.disciplines?.length || curriculum.semesters?.some((semester) => semester.disciplines.length));

const enrichMissingMetrics = async (curricula: BackendCurriculum[]) => {
  const enriched = [...curricula];
  const missingMetrics = curricula
    .map((curriculum, index) => ({ curriculum, index }))
    .filter(({ curriculum }) => !hasCurriculumMetrics(curriculum));

  const batchSize = 4;

  for (let start = 0; start < missingMetrics.length; start += batchSize) {
    const batch = missingMetrics.slice(start, start + batchSize);
    const details = await Promise.all(
      batch.map(async ({ curriculum, index }) => {
        try {
          const response = await apiClient.get<BackendCurriculum>(`/api/curricula/${curriculum.id}`);
          return { curriculum: response.data, index };
        } catch {
          return { curriculum, index };
        }
      }),
    );

    details.forEach(({ curriculum, index }) => {
      enriched[index] = curriculum;
    });
  }

  return enriched;
};

export const plansApi = {
  async list(filters?: Partial<PlanFilters>) {
    try {
      const params = buildListParams(filters);
      const response = await apiClient.get<BackendCurriculum[]>('/api/curricula', { params });
      const curricula = await enrichMissingMetrics(response.data);
      return curricula.map(toPlan);
    } catch (error) {
      throw toApiError(error, 'Не удалось загрузить учебные планы');
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get<BackendCurriculum>(`/api/curricula/${id}`);
      return toPlan(response.data);
    } catch (error) {
      throw toApiError(error, 'Не удалось загрузить учебный план');
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
      throw toApiError(error, 'Не удалось сравнить учебные планы');
    }
  },

  async recommend(payload: {
    educationLevel?: AdmissionEducationLevel;
    studyForm?: AdmissionStudyForm;
    weights: Partial<Record<AdmissionCategory, number>>;
    limit?: number;
  }) {
    const response = await apiClient.post<PlanRecommendation[]>('/api/curricula/recommendations', payload);
    return response.data;
  },
};
