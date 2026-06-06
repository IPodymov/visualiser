import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart3, BookOpen, Clock3, GraduationCap, Heart, Loader2, WalletCards } from 'lucide-react';
import './PlanDetailsPage.css';
import { DisciplineTable } from '../../components/DisciplineTable/DisciplineTable';
import { GradientButton } from '../../components/GradientButton/GradientButton';
import { RadarStatsCard } from '../../components/RadarStatsCard/RadarStatsCard';
import { SemesterAccordion } from '../../components/SemesterAccordion/SemesterAccordion';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { plansApi } from '../../services/api/plans';
import { useAppStore } from '../../store/useAppStore';
import type { EducationPlan } from '../../types/plan';

export const PlanDetailsPage = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState<EducationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addToCompare = useAppStore((state) => state.addToCompare);
  const addToHistory = useAppStore((state) => state.addToHistory);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await plansApi.getById(Number(id));
        setPlan(data);
        addToHistory(data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить учебный план');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [addToHistory, id]);

  if (loading) {
    return (
      <main className="container grid min-h-[70vh] place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-200" />
      </main>
    );
  }

  if (!plan || error) {
    return <main className="container py-12 text-red-100">{error ?? 'План не найден'}</main>;
  }

  const canUseFavorites = Boolean(user);
  const isFavorite = canUseFavorites && favorites.includes(plan.id);
  const favoriteHint = canUseFavorites
    ? isFavorite
      ? 'Убрать из избранного'
      : 'Добавить в избранное'
    : 'Авторизуйтесь, чтобы добавлять планы в избранное';

  return (
    <main className="container py-10">
      <div className="plan-details__hero">
        <section>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>{plan.faculty}</Badge>
            <Badge>{plan.level}</Badge>
            <Badge>{plan.studyForm}</Badge>
            <Badge>{plan.year}</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-normal text-white md:text-6xl">{plan.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{plan.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="plan-details__favorite-tooltip" data-tooltip={favoriteHint}>
              <GradientButton
                disabled={!canUseFavorites}
                onClick={() => toggleFavorite(plan.id)}
                aria-label={favoriteHint}
              >
                <Heart className={isFavorite ? 'h-5 w-5 fill-white' : 'h-5 w-5'} />
                {isFavorite ? 'В избранном' : 'Добавить в избранное'}
              </GradientButton>
            </span>
            <Button asChild variant="secondary" onClick={() => addToCompare(plan.id)}>
              <Link to="/compare">
                <BarChart3 className="h-5 w-5" />
                Сравнить
              </Link>
            </Button>
          </div>
        </section>
        <RadarStatsCard plan={plan} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatsCard icon={<Clock3 className="h-5 w-5" />} label="часов" value={plan.totalHours} />
        <StatsCard icon={<WalletCards className="h-5 w-5" />} label="ЗЕТ" value={plan.credits} />
        <StatsCard icon={<BookOpen className="h-5 w-5" />} label="дисциплин" value={plan.disciplines.length} />
        <StatsCard icon={<GraduationCap className="h-5 w-5" />} label="семестров" value={plan.semesters} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Дисциплины учебного плана</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="semesters">
            <TabsList>
              <TabsTrigger value="semesters">По семестрам</TabsTrigger>
              <TabsTrigger value="all">Все дисциплины</TabsTrigger>
            </TabsList>
            <TabsContent value="semesters">
              <SemesterAccordion plan={plan} />
            </TabsContent>
            <TabsContent value="all">
              <DisciplineTable disciplines={plan.disciplines} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
};
