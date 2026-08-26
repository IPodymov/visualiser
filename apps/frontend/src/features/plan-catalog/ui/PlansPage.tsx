import { useEffect, useMemo, useState } from 'react';
import { GitCompareArrows, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PlansPage.css';
import { PlanCard } from '@features/plan-actions/ui/PlanCard/PlanCard';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
import { EmptyState } from '@shared/ui/EmptyState/EmptyState';
import { ErrorState, LoadingState } from '@shared/ui/InterfaceState/InterfaceState';
import { NextAction, PageHeader, PageSection } from '@shared/ui/PageLayout/PageLayout';
import { Button } from '@shared/ui/button';
import { Pagination } from '@shared/ui/pagination';
import type { PlanFilters } from '../model/filter.types';
import { usePlans } from '../model/usePlans';
import { SearchFilters } from './SearchFilters/SearchFilters';

const defaultFilters: PlanFilters = {
  query: '',
  faculty: 'all',
  direction: 'all',
  profile: 'all',
  level: 'all',
  studyForm: 'all',
};

export const PlansPage = () => {
  const { plans, filteredPlans, filterConfig, filters, setFilters, loading, error, reload } =
    usePlans();
  const [visibleCount, setVisibleCount] = useState(9);
  const compareCount = useWorkspaceStore((state) => state.compareIds.filter(Boolean).length);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: keyof PlanFilters; label: string }> = [];
    if (filters.query) items.push({ key: 'query', label: `Поиск: ${filters.query}` });
    filterConfig.forEach((filter) => {
      const value = filters[filter.key];
      if (value !== 'all')
        items.push({
          key: filter.key,
          label: `${filter.label}: ${filter.options.find((option) => option.value === value)?.label ?? value}`,
        });
    });
    return items;
  }, [filterConfig, filters]);

  useEffect(() => setVisibleCount(9), [filters]);

  const reset = () => setFilters(defaultFilters);
  const removeFilter = (key: keyof PlanFilters) =>
    setFilters({ ...filters, [key]: key === 'query' ? '' : 'all' });
  const visiblePlans = filteredPlans.slice(0, visibleCount);

  return (
    <main className="page-main">
      <div className="container page-stack">
        <PageHeader
          eyebrow="Каталог учебных планов"
          title="Найдите образовательную программу"
          description="Ищите среди учебных планов 2025 года по названию или коду. Уточните факультет, направление, профиль и формат обучения."
        />

        <PageSection>
          <SearchFilters
            config={filterConfig}
            filters={filters}
            onChange={setFilters}
            onReset={reset}
            activeCount={activeFilters.length}
          />

          <div className="plans-results-bar">
            <div aria-live="polite">
              <strong>
                {loading
                  ? 'Ищем программы…'
                  : `${filteredPlans.length} ${filteredPlans.length === 1 ? 'программа' : 'программ'}`}
              </strong>
              <span>по выбранным параметрам</span>
            </div>
            {activeFilters.length > 0 && (
              <div className="plans-active-filters" aria-label="Активные фильтры">
                {activeFilters.map((filter) => (
                  <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)}>
                    {filter.label}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="visually-hidden">Сбросить фильтр</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingState label="Загружаем учебные планы" rows={6} />
          ) : error && !plans.length ? (
            <ErrorState
              title="Не удалось загрузить учебные планы"
              text="Сервис данных временно недоступен. Повторите загрузку — выбранные параметры сохранятся."
              onRetry={() => void reload(filters)}
            />
          ) : visiblePlans.length ? (
            <>
              <div className="plans-grid">
                {visiblePlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
              <Pagination
                shown={visiblePlans.length}
                total={filteredPlans.length}
                onLoadMore={() => setVisibleCount((count) => count + 9)}
              />
            </>
          ) : !plans.length ? (
            <EmptyState
              title="Учебные планы пока не загружены"
              text="Когда образовательная организация добавит планы, они появятся в этом каталоге."
            />
          ) : (
            <EmptyState
              title="По выбранным параметрам учебные планы не найдены"
              text="Измените запрос или сбросьте фильтры, чтобы увидеть больше программ."
              action={
                <Button type="button" variant="outline" onClick={reset}>
                  Сбросить фильтры
                </Button>
              }
            />
          )}
        </PageSection>

        {compareCount > 0 && (
          <NextAction className="plans-compare-next">
            <div>
              <p className="text-sm text-blue-200">Выбрано для сравнения: {compareCount} из 2</p>
              <h2 className="mt-2 text-2xl font-bold">
                {compareCount === 2
                  ? 'Программы готовы к сравнению'
                  : 'Добавьте ещё одну программу'}
              </h2>
            </div>
            <Button asChild variant="secondary">
              <Link to="/compare">
                <GitCompareArrows className="h-4 w-4" />
                Перейти к сравнению
              </Link>
            </Button>
          </NextAction>
        )}
      </div>
    </main>
  );
};
