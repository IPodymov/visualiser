import { apiClient } from './client';
import { toPlan } from './planMapper';
import type { EducationPlan } from '../../types/plan';

type ProfileItem = {
  curriculum?: Parameters<typeof toPlan>[0];
  curriculumId?: number;
};

const extractPlans = (data: unknown): EducationPlan[] => {
  if (!Array.isArray(data)) return [];
  const plans = data
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const profileItem = item as ProfileItem;
      return profileItem.curriculum ? toPlan(profileItem.curriculum) : null;
    })
    .filter((item): item is EducationPlan => Boolean(item));
  return [...new Map(plans.map((plan) => [plan.id, plan])).values()];
};

export const profileApi = {
  async favorites() {
    const response = await apiClient.get<unknown>('/api/profile/favorites');
    return extractPlans(response.data);
  },

  async addFavorite(planId: number) {
    await apiClient.post(`/api/profile/favorites/${planId}`);
  },

  async removeFavorite(planId: number) {
    await apiClient.delete(`/api/profile/favorites/${planId}`);
  },

  async history() {
    const response = await apiClient.get<unknown>('/api/profile/history');
    return extractPlans(response.data);
  },
};
