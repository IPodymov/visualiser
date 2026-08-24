import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock3,
  GitCompareArrows,
  Heart,
  LibraryBig,
  WalletCards,
} from 'lucide-react';
import './PlanCard.css';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/tooltip';
import { useAppStore } from '../../store/useAppStore';
import type { EducationPlan } from '../../types/plan';
import { cn } from '../../utils/cn';
import { areEducationLevelsCompatible } from '../../utils/compareEligibility';

export const PlanCard = ({
  plan,
  variant = 'full',
}: {
  plan: EducationPlan;
  variant?: 'full' | 'compact';
}) => {
  const user = useAppStore((state) => state.user);
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCompare = useAppStore((state) => state.addToCompare);
  const removeFromCompare = useAppStore((state) => state.removeFromCompare);
  const compareIds = useAppStore((state) => state.compareIds);
  const compareLevels = useAppStore((state) => state.compareLevels);
  const isInCompare = compareIds.includes(plan.id);
  const isFavorite = favorites.includes(plan.id);
  const requiredLevel = compareLevels.find((level) => level !== null) ?? null;
  const isCompareCompatible = Boolean(
    isInCompare || !requiredLevel || areEducationLevelsCompatible(plan.level, requiredLevel),
  );

  const toggleCompare = () => (isInCompare ? removeFromCompare(plan.id) : addToCompare(plan));
  const compareButton = (
    <Button
      type="button"
      size="sm"
      variant={isInCompare ? 'secondary' : 'outline'}
      disabled={!isCompareCompatible}
      onClick={toggleCompare}
    >
      {isInCompare ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
      {isInCompare ? 'В сравнении' : isCompareCompatible ? 'К сравнению' : 'Другой уровень'}
    </Button>
  );

  return (
    <article className={cn('plan-card', variant === 'compact' && 'plan-card--compact')}>
      <div className="plan-card__badges">
        <Badge variant="brand">{plan.code ?? 'Код не указан'}</Badge>
        <Badge>{plan.year}</Badge>
        <Badge>{plan.level}</Badge>
      </div>

      <div>
        <h3 className="plan-card__title">
          <Link to={`/plans/${plan.id}`}>{plan.title}</Link>
        </h3>
        {plan.profile && plan.direction !== plan.profile && (
          <p className="plan-card__direction">Направление: {plan.direction}</p>
        )}
      </div>

      <dl className="plan-card__metadata">
        <div>
          <dt>Факультет</dt>
          <dd>{plan.faculty}</dd>
        </div>
        <div>
          <dt>Форма обучения</dt>
          <dd>{plan.studyForm}</dd>
        </div>
      </dl>

      {variant === 'full' && (
        <div className="plan-card__metrics">
          <div>
            <LibraryBig className="h-4 w-4" />
            <strong>{plan.disciplines.length}</strong>
            <span>дисциплин</span>
          </div>
          <div>
            <Clock3 className="h-4 w-4" />
            <strong>{plan.totalHours || '—'}</strong>
            <span>часов</span>
          </div>
          <div>
            <WalletCards className="h-4 w-4" />
            <strong>{plan.credits || '—'}</strong>
            <span>ЗЕТ</span>
          </div>
        </div>
      )}

      <div className="plan-card__actions">
        <Button asChild size="sm">
          <Link to={`/plans/${plan.id}`}>
            Подробнее
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {isCompareCompatible || !requiredLevel ? (
          compareButton
        ) : (
          <Tooltip content={`Для сравнения выберите программу уровня «${requiredLevel}».`}>
            {compareButton}
          </Tooltip>
        )}
        {user ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => toggleFavorite(plan.id)}>
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            {isFavorite ? 'Сохранено' : 'В избранное'}
          </Button>
        ) : (
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">
              <Heart className="h-4 w-4" />
              Сохранить
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
};
