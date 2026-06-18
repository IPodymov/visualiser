import { useEffect, useMemo, useState } from 'react';
import { facultiesApi, type FacultyOption } from '../services/api/faculties';
import { plansApi } from '../services/api/plans';
import type { EducationPlan, PlanFilters } from '../types/plan';
import { buildPlanFilterConfig } from '../utils/planFilters';

const defaultFilters: PlanFilters = {
  query: '',
  faculty: 'all',
  level: 'all',
  studyForm: 'all',
  year: 'all',
};

export const usePlans = () => {
  const [plans, setPlans] = useState<EducationPlan[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [filters, setFilters] = useState<PlanFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const [nextPlans, nextFaculties] = await Promise.all([
        plansApi.list(nextFilters),
        facultiesApi.list(),
      ]);
      setPlans(nextPlans);
      setFaculties(nextFaculties);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить учебные планы. Попробуйте обновить страницу.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredPlans = useMemo(
    () =>
      plans.filter((plan) => {
        const query = filters.query.trim().toLowerCase();
        const matchesQuery =
          !query ||
          plan.title.toLowerCase().includes(query) ||
          plan.faculty.toLowerCase().includes(query) ||
          plan.code?.toLowerCase().includes(query);
        const matchesFaculty = filters.faculty === 'all' || String(plan.facultyId) === filters.faculty;
        const matchesLevel = filters.level === 'all' || plan.level === filters.level;
        const matchesForm = filters.studyForm === 'all' || plan.studyForm === filters.studyForm;
        const matchesYear = filters.year === 'all' || String(plan.year) === filters.year;
        return matchesQuery && matchesFaculty && matchesLevel && matchesForm && matchesYear;
      }),
    [filters, plans],
  );

  const filterConfig = useMemo(() => buildPlanFilterConfig(plans, faculties), [plans, faculties]);

  return { plans, filteredPlans, filterConfig, filters, setFilters, loading, error, reload: load };
};
