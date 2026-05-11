import { Link } from 'react-router-dom';
import { Heart, History, UserRound } from 'lucide-react';
import './ProfileSection.css';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAppStore } from '../../store/useAppStore';
import type { EducationPlan } from '../../types/plan';

const CompactPlan = ({ plan }: { plan: EducationPlan }) => (
  <Link to={`/plans/${plan.id}`} className="profile-card-link">
    <div className="font-semibold text-white">{plan.title}</div>
    <div className="mt-1 text-xs text-slate-400">
      {plan.faculty} · {plan.year} · {plan.disciplines.length} дисциплин
    </div>
  </Link>
);

export const ProfileSection = ({ plans }: { plans: EducationPlan[] }) => {
  const user = useAppStore((state) => state.user);
  const favorites = useAppStore((state) => state.favorites);
  const history = useAppStore((state) => state.history);
  const favoritePlans = plans.filter((plan) => favorites.includes(plan.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sky-200" />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-white/[0.06] p-4">
            <div className="text-sm text-slate-400">Пользователь</div>
            <div className="mt-1 text-lg font-semibold text-white">{user?.fullName ?? 'Гость EduPlan'}</div>
            <div className="text-sm text-slate-400">{user?.email ?? 'Войдите, чтобы сохранить избранное и историю'}</div>
          </div>
          {!user && (
            <Button asChild className="w-full">
              <Link to="/login">Авторизоваться</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-300" />
              Избранное
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {favoritePlans.length ? favoritePlans.map((plan) => <CompactPlan key={plan.id} plan={plan} />) : <p className="text-sm text-slate-400">Пока пусто.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-violet-200" />
              История просмотров
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {history.length ? history.map((plan) => <CompactPlan key={plan.id} plan={plan} />) : <p className="text-sm text-slate-400">Откройте страницу плана, и он появится здесь.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
