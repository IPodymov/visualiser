import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock3, Heart, LibraryBig } from 'lucide-react';
import { motion } from 'framer-motion';
import './PlanCard.css';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useAppStore } from '../../store/useAppStore';
import type { EducationPlan } from '../../types/plan';
import { cn } from '../../utils/cn';

export const PlanCard = ({ plan }: { plan: EducationPlan }) => {
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCompare = useAppStore((state) => state.addToCompare);
  const isFavorite = favorites.includes(plan.id);

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="plan-card group">
        <CardHeader>
          <div className="plan-card__badges">
            <Badge>{plan.faculty}</Badge>
            <Badge className="bg-sky-400/15 text-sky-100">{plan.year}</Badge>
            <Badge className="bg-violet-400/15 text-violet-100">{plan.level}</Badge>
          </div>
          <CardTitle className="line-clamp-2 min-h-14">{plan.title}</CardTitle>
        </CardHeader>
        <CardContent className="plan-card__content">
          <p className="plan-card__description">{plan.description}</p>
          <div className="plan-card__metrics">
            <div className="plan-card__metric">
              <LibraryBig className="mb-2 h-4 w-4 text-sky-200" />
              <b className="text-white">{plan.disciplines.length}</b>
              <span className="block text-xs text-slate-400">дисциплин</span>
            </div>
            <div className="plan-card__metric">
              <Clock3 className="mb-2 h-4 w-4 text-violet-200" />
              <b className="text-white">{plan.totalHours}</b>
              <span className="block text-xs text-slate-400">часов</span>
            </div>
            <div className="plan-card__metric">
              <BarChart3 className="mb-2 h-4 w-4 text-cyan-200" />
              <b className="text-white">{plan.credits}</b>
              <span className="block text-xs text-slate-400">ЗЕТ</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="plan-card__footer">
          <Button asChild>
            <Link to={`/plans/${plan.id}`}>
              Подробнее
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => toggleFavorite(plan.id)}
            aria-label="Добавить в избранное"
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-rose-400 text-rose-400')} />
          </Button>
          <Button type="button" size="icon" variant="secondary" onClick={() => addToCompare(plan.id)} aria-label="Сравнить">
            <BarChart3 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
