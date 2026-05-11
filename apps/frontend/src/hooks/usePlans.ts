import { useEffect, useMemo, useState } from 'react';
import { plansApi } from '../services/api/plans';
import type { EducationPlan, PlanFilters } from '../types/plan';

const defaultFilters: PlanFilters = {
  query: '',
  faculty: 'all',
  level: 'all',
  studyForm: 'all',
  year: 'all',
};

export const usePlans = () => {
  const [plans, setPlans] = useState<EducationPlan[]>([]);
  const [filters, setFilters] = useState<PlanFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      setPlans(await plansApi.list(nextFilters));
    } catch {
      setError('Не удалось загрузить учебные планы. Попробуйте обновить страницу.');
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
        const matchesFaculty = filters.faculty === 'all' || plan.faculty === filters.faculty;
        const matchesLevel = filters.level === 'all' || plan.level === filters.level;
        const matchesForm = filters.studyForm === 'all' || plan.studyForm === filters.studyForm;
        const matchesYear = filters.year === 'all' || String(plan.year) === filters.year;
        return matchesQuery && matchesFaculty && matchesLevel && matchesForm && matchesYear;
      }),
    [filters, plans],
  );

  return { plans, filteredPlans, filters, setFilters, loading, error, reload: load };
};
