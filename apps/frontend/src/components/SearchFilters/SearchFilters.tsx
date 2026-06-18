import { SlidersHorizontal } from 'lucide-react';
import './SearchFilters.css';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { SelectFilterConfig } from '../../types/filter';
import type { PlanFilters } from '../../types/plan';

type Props = {
  filters: PlanFilters;
  config: SelectFilterConfig[];
  onChange: (filters: PlanFilters) => void;
  onSubmit: () => void;
};

export const SearchFilters = ({ filters, config, onChange, onSubmit }: Props) => {
  return (
    <div className="search-filters">
      <div className="search-filters__grid">
        <div className="search-filters__query">
          <label className="search-filters__label" htmlFor="plans-search">
            Поиск
          </label>
          <Input
            id="plans-search"
            className="search-filters__input"
            value={filters.query}
            placeholder="Название или код"
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
          />
        </div>
        {config.map((filter) => (
          <div key={filter.key} className="search-filters__field">
            <span className="search-filters__label">{filter.label}</span>
            <Select
              value={filters[filter.key]}
              onValueChange={(value) => onChange({ ...filters, [filter.key]: value })}
            >
              <SelectTrigger aria-label={filter.label}>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={onSubmit}>
          <SlidersHorizontal className="h-4 w-4" />
          Применить
        </Button>
      </div>
    </div>
  );
};
