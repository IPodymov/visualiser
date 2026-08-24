import { X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { EducationPlan } from '../../types/plan';
import { cn } from '../../utils/cn';
import { areEducationLevelsCompatible } from '../../utils/compareEligibility';

export const PlanSelector = ({
  side,
  value,
  plans,
  excludedId,
  requiredLevel,
  onChange,
}: {
  side: 'A' | 'B';
  value: number | null;
  plans: EducationPlan[];
  excludedId: number | null;
  requiredLevel: string | null;
  onChange: (value: number | null) => void;
}) => {
  const selected = plans.find((plan) => plan.id === value);
  const id = `compare-plan-${side.toLowerCase()}`;

  return (
    <div className={cn('plan-selector', side === 'A' ? 'plan-selector--a' : 'plan-selector--b')}>
      <div className="plan-selector__heading">
        <Badge variant={side === 'A' ? 'programA' : 'programB'}>Программа {side}</Badge>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
            Очистить
          </Button>
        )}
      </div>
      <Label htmlFor={id}>
        {requiredLevel ? `Программа уровня «${requiredLevel}»` : 'Выберите учебный план'}
      </Label>
      <Select value={value ? String(value) : ''} onValueChange={(next) => onChange(Number(next))}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Выберите программу ${side}`} />
        </SelectTrigger>
        <SelectContent>
          {plans.map((plan) => {
            const hasDifferentLevel = Boolean(
              requiredLevel && !areEducationLevelsCompatible(plan.level, requiredLevel),
            );
            return (
              <SelectItem
                key={plan.id}
                value={String(plan.id)}
                disabled={plan.id === excludedId || hasDifferentLevel}
              >
                {plan.title} · {plan.year} · {plan.code}
                {hasDifferentLevel ? ' · другой уровень' : ''}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <div className="plan-selector__summary">
        {selected ? (
          <>
            <strong>{selected.title}</strong>
            <span>
              {selected.faculty} · {selected.year} · {selected.level}
            </span>
          </>
        ) : (
          <span>
            {requiredLevel
              ? `Доступны только программы уровня «${requiredLevel}».`
              : 'Первая программа задаст уровень образования для сравнения.'}
          </span>
        )}
      </div>
    </div>
  );
};
