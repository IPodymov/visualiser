import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import './SearchFilters.css';
import { Button } from '../ui/button';
import { Drawer } from '../ui/drawer';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { PlanFilters } from '../../types/plan';
import type { SelectFilterConfig } from '../../types/filter';

type Props = {
  config: SelectFilterConfig[];
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
  onReset: () => void;
  activeCount: number;
};

const FilterFields = ({
  config,
  filters,
  onChange,
  idPrefix,
}: Pick<Props, 'config' | 'filters' | 'onChange'> & { idPrefix: string }) => (
  <div className="search-filters__fields">
    {config.map((filter) => {
      const id = `${idPrefix}-${filter.key}`;
      return (
        <div key={filter.key} className="search-filters__field">
          <Label htmlFor={id}>{filter.label}</Label>
          <Select
            value={filters[filter.key]}
            onValueChange={(value) => onChange({ ...filters, [filter.key]: value })}
          >
            <SelectTrigger id={id} aria-label={filter.label}>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все варианты</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    })}
  </div>
);

export const SearchFilters = ({ config, filters, onChange, onReset, activeCount }: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="search-filters" aria-label="Поиск и фильтры учебных планов">
      <div className="search-filters__search-row">
        <div className="search-filters__search">
          <Label htmlFor="plans-search">Название, направление или код</Label>
          <div className="search-filters__search-control">
            <Search className="h-5 w-5" aria-hidden="true" />
            <Input
              id="plans-search"
              value={filters.query}
              placeholder="Например, веб-технологии или 09.03.04"
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
            />
          </div>
        </div>
        <Button
          className="search-filters__mobile-button"
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры{activeCount > 0 && ` · ${activeCount}`}
        </Button>
      </div>

      <div className="search-filters__desktop">
        <FilterFields
          config={config}
          filters={filters}
          onChange={onChange}
          idPrefix="filter-desktop"
        />
        {activeCount > 0 && (
          <div className="search-filters__actions">
            <Button type="button" variant="ghost" onClick={onReset}>
              <X className="h-4 w-4" />
              Сбросить
            </Button>
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Фильтры программ"
        description="Сузьте каталог по параметрам учебного плана."
      >
        <FilterFields
          config={config}
          filters={filters}
          onChange={onChange}
          idPrefix="filter-mobile"
        />
        <div className="mt-6 grid gap-2">
          <Button type="button" onClick={() => setDrawerOpen(false)}>
            Показать программы
          </Button>
          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onReset();
                setDrawerOpen(false);
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      </Drawer>
    </section>
  );
};
