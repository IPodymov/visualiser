import { useEffect, useMemo, useState } from 'react';
import { facultiesApi, type FacultyOption } from '@entities/faculty/api/faculties';
import { plansApi } from '@entities/plan/api/plans';
import type { EducationPlan } from '@entities/plan/model/types';
import type { PlanFilters } from './filter.types';
import { buildPlanFilterConfig } from './planFilters';

const defaultFilters: PlanFilters = {
  query: '',
  faculty: 'all',
  direction: 'all',
  profile: 'all',
  level: 'all',
  studyForm: 'all',
};

export const usePlans = () => {
  const [plans, setPlans] = useState<EducationPlan[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [filters, setFilterState] = useState<PlanFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setFilters = (nextFilters: PlanFilters) => {
    setFilterState((previous) => {
      if (previous.level === nextFilters.level) return nextFilters;
      const next = { ...nextFilters };
      for (const filter of buildPlanFilterConfig(plans, faculties, next.level)) {
        if (
          filter.key !== 'level' &&
          next[filter.key] !== 'all' &&
          !filter.options.some((option) => option.value === next[filter.key])
        ) {
          next[filter.key] = 'all';
        }
      }
      return next;
    });
  };

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
          plan.direction.toLowerCase().includes(query) ||
          plan.profile?.toLowerCase().includes(query) ||
          plan.faculty.toLowerCase().includes(query) ||
          plan.code?.toLowerCase().includes(query);
        const matchesFaculty =
          filters.faculty === 'all' || String(plan.facultyId) === filters.faculty;
        const matchesDirection =
          filters.direction === 'all' || plan.direction === filters.direction;
        const matchesProfile = filters.profile === 'all' || plan.profile === filters.profile;
        const matchesLevel = filters.level === 'all' || plan.level === filters.level;
        const matchesForm = filters.studyForm === 'all' || plan.studyForm === filters.studyForm;
        return (
          matchesQuery &&
          matchesFaculty &&
          matchesDirection &&
          matchesProfile &&
          matchesLevel &&
          matchesForm
        );
      }),
    [filters, plans],
  );

  const filterConfig = useMemo(
    () => buildPlanFilterConfig(plans, faculties, filters.level),
    [plans, faculties, filters.level],
  );

  return { plans, filteredPlans, filterConfig, filters, setFilters, loading, error, reload: load };
};
