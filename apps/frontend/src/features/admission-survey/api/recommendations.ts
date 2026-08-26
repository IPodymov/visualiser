import { apiClient } from '@shared/api/client';
import type {
  AdmissionCategory,
  AdmissionEducationLevel,
  AdmissionStudyForm,
  PlanRecommendation,
} from '../model/types';

export const recommendationsApi = {
  async recommend(payload: {
    educationLevel?: AdmissionEducationLevel;
    studyForm?: AdmissionStudyForm;
    weights: Partial<Record<AdmissionCategory, number>>;
    limit?: number;
  }) {
    const response = await apiClient.post<PlanRecommendation[]>(
      '/api/curricula/recommendations',
      payload,
    );
    return response.data;
  },
};
