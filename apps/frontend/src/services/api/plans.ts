import { AxiosError } from 'axios';
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
  error instanceof AxiosError && (!error.response || error.code === 'ECONNABORTED');

const toApiError = (error: unknown, fallbackMessage: string) => {
  if (isNetworkProblem(error)) return new Error('Сервер учебных планов недоступен. Проверьте подключение и повторите запрос.');
  if (error instanceof Error) return error;
  return new Error(fallbackMessage);
};

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
