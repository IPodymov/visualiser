import axios from 'axios';
import { apiClient } from '@shared/api/client';
import { type BackendCurriculum, toPlan } from './planMapper';

type ListPlansFilters = {
  faculty?: string;
};

const isNetworkProblem = (error: unknown) =>
  axios.isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED');

export const toPlansApiError = (error: unknown, fallbackMessage: string) => {
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
      backendMessage
        ? `${fallbackMessage}: ${backendMessage}`
        : `${fallbackMessage}. Повторите запрос позже.`,
    );
  }
  if (error instanceof Error) return error;
  return new Error(fallbackMessage);
};

const buildListParams = (filters?: ListPlansFilters) => {
  const params: Record<string, string | number> = {};
  const faculty = filters?.faculty;

  if (faculty && faculty !== 'all') {
    const facultyId = Number(faculty);
    if (Number.isInteger(facultyId)) {
      params.facultyId = facultyId;
    }
  }

  return params;
};

const hasCurriculumMetrics = (curriculum: BackendCurriculum) =>
  Boolean(
    curriculum.disciplines?.length ||
    curriculum.semesters?.some((semester) => semester.disciplines.length),
  );

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
          const response = await apiClient.get<BackendCurriculum>(
            `/api/curricula/${curriculum.id}`,
          );
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
  async list(filters?: ListPlansFilters) {
    try {
      const params = buildListParams(filters);
      const response = await apiClient.get<BackendCurriculum[]>('/api/curricula', { params });
      const curricula = await enrichMissingMetrics(response.data);
      return curricula.map(toPlan);
    } catch (error) {
      throw toPlansApiError(error, 'Не удалось загрузить учебные планы');
    }
  },

  async getById(id: number) {
    try {
      const response = await apiClient.get<BackendCurriculum>(`/api/curricula/${id}`);
      return toPlan(response.data);
    } catch (error) {
      throw toPlansApiError(error, 'Не удалось загрузить учебный план');
    }
  },
};
