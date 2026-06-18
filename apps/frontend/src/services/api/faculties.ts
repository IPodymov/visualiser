import { apiClient } from './client';

export type FacultyOption = {
  id: number;
  name: string;
  slug: string;
  _count?: {
    curricula: number;
  };
};

export const facultiesApi = {
  async list(params?: { admissionYear?: number }) {
    const response = await apiClient.get<FacultyOption[]>('/api/faculties', { params });
    return response.data;
  },
};
