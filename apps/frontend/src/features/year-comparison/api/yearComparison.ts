import { toPlansApiError } from '@entities/plan/api/plans';
import { comparisonApi } from '@features/comparison/api/comparison';
import { apiClient } from '@shared/api/client';
import type { PlanVersions, YearComparison } from '../model/types';

export const yearComparisonApi = {
  async versions(planId: number) {
    try {
      const response = await apiClient.get<PlanVersions>(`/api/curricula/${planId}/versions`);
      return response.data;
    } catch (error) {
      throw toPlansApiError(error, 'Не удалось найти планы прошлых лет');
    }
  },

  async load(planId: number): Promise<YearComparison> {
    const versions = await yearComparisonApi.versions(planId);
    if (!versions.previous) return { versions, comparison: null };

    const comparison = await comparisonApi.compare(planId, versions.previous.curriculumId);
    return { versions, comparison };
  },
};
