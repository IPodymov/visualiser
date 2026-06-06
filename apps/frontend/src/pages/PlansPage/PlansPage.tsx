import { AnimatePresence } from 'framer-motion';
import './PlansPage.css';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { PlanCard } from '../../components/PlanCard/PlanCard';
import { SearchFilters } from '../../components/SearchFilters/SearchFilters';
import { Skeleton } from '../../components/ui/skeleton';
import { usePlans } from '../../hooks/usePlans';

export const PlansPage = () => {
  const { filteredPlans, filterConfig, filters, setFilters, loading, error, reload } = usePlans();

  return (
    <main className="container py-10">
      <div className="mb-8 max-w-3xl">
        <span className="text-sm font-semibold uppercase text-sky-200">Каталог учебных планов</span>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-white md:text-5xl">
          Все направления в одной сетке
        </h1>
        <p className="mt-4 text-slate-300">
          Ищите по названию, фильтруйте по факультету, уровню, форме обучения и году.
        </p>
      </div>

      <SearchFilters
        config={filterConfig}
        filters={filters}
        onChange={setFilters}
        onSubmit={() => void reload(filters)}
      />

      {error && (
        <div className="mt-5 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="plans-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      ) : filteredPlans.length ? (
        <div className="plans-grid">
          <AnimatePresence>
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Ничего не найдено"
            text="Попробуйте сбросить фильтры или выполнить поиск по другому названию направления."
          />
        </div>
      )}
    </main>
  );
};
