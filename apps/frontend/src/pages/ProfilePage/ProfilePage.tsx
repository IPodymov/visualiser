import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Heart, History, LogIn, UserRound } from 'lucide-react';
import './ProfilePage.css';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState, LoadingState } from '../../components/InterfaceState/InterfaceState';
import { PageHeader, PageSection, SectionHeader } from '../../components/PageLayout/PageLayout';
import { PlanCard } from '../../components/PlanCard/PlanCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { profileApi } from '../../services/api/profile';
import { useAppStore } from '../../store/useAppStore';
import type { EducationPlan } from '../../types/plan';

export const ProfilePage = () => {
  const user = useAppStore((state) => state.user);
  const setFavorites = useAppStore((state) => state.setFavorites);
  const favoriteIds = useAppStore((state) => state.favorites);
  const [favoritePlans, setFavoritePlans] = useState<EducationPlan[]>([]);
  const [historyPlans, setHistoryPlans] = useState<EducationPlan[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [favorites, history] = await Promise.all([
        profileApi.favorites(),
        profileApi.history(),
      ]);
      setFavoritePlans(favorites);
      setHistoryPlans(history);
      setFavorites(favorites.map((plan) => plan.id));
    } catch {
      setError('Не удалось загрузить сохранённые программы и историю просмотров.');
    } finally {
      setLoading(false);
    }
  }, [setFavorites, user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user)
    return (
      <main className="page-main">
        <div className="container page-stack">
          <PageHeader
            eyebrow="Личный раздел"
            title="Возвращайтесь к программам, которые вас заинтересовали"
            description="Аккаунт сохраняет избранные учебные планы и историю просмотров, чтобы продолжить анализ позже."
          />
          <Card className="profile-guest">
            <CardContent className="p-6 md:p-10">
              <div className="profile-guest__icon">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <h2>Войдите в EduPlan Compare</h2>
                <p>
                  Сохранённые программы будут доступны на любом устройстве после входа в аккаунт.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/login">
                      <LogIn className="h-4 w-4" />
                      Войти
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/register">Создать аккаунт</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );

  return (
    <main className="page-main">
      <div className="container page-stack">
        <PageHeader
          eyebrow="Личный раздел"
          title="Избранные и недавно просмотренные программы"
          description="Возвращайтесь к анализу учебных планов и добавляйте сохранённые программы в сравнение."
        />

        <Card>
          <CardContent className="profile-account p-5 md:p-6">
            <div className="profile-account__avatar">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <span>Аккаунт</span>
              <strong>{user.fullName || 'Пользователь EduPlan'}</strong>
              <small>{user.email}</small>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <LoadingState label="Загружаем личный раздел" rows={4} />
        ) : error ? (
          <ErrorState
            title="Личный раздел временно недоступен"
            text={error}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <PageSection labelledBy="profile-favorites">
              <SectionHeader
                id="profile-favorites"
                eyebrow="Сохранено"
                title="Избранные программы"
                description="Используйте те же карточки, что и в каталоге: откройте программу или сразу добавьте её к сравнению."
              />
              {favoritePlans.some((plan) => favoriteIds.includes(plan.id)) ? (
                <div className="profile-plan-grid">
                  {favoritePlans
                    .filter((plan) => favoriteIds.includes(plan.id))
                    .map((plan) => (
                      <PlanCard key={plan.id} plan={plan} variant="compact" />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Heart className="h-7 w-7" />}
                  title="В избранном пока нет программ"
                  text="Сохраните интересующий учебный план в каталоге или на странице программы."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/plans">Найти программу</Link>
                    </Button>
                  }
                />
              )}
            </PageSection>

            <PageSection labelledBy="profile-history">
              <SectionHeader
                id="profile-history"
                eyebrow="Недавняя активность"
                title="Недавно просмотренные"
                description="Здесь показаны уникальные программы, которые вы открывали последними."
              />
              {historyPlans.length ? (
                <div className="profile-plan-grid">
                  {historyPlans.slice(0, 8).map((plan) => (
                    <PlanCard key={plan.id} plan={plan} variant="compact" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<History className="h-7 w-7" />}
                  title="История просмотров пока пуста"
                  text="Откройте страницу учебного плана — после этого он появится здесь."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/plans">
                        <Clock3 className="h-4 w-4" />
                        Открыть каталог
                      </Link>
                    </Button>
                  }
                />
              )}
            </PageSection>
          </>
        )}
      </div>
    </main>
  );
};
