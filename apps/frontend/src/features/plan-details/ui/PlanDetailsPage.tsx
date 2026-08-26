import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BarChart3,
  Beaker,
  BookOpen,
  CalendarRange,
  Clock3,
  GraduationCap,
  Heart,
  Search,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import './PlanDetailsPage.css';
import { plansApi } from '@entities/plan/api/plans';
import {
  formatMetric,
  getPlanInsights,
  getPlanTotals,
  getSemesterBuckets,
  getWorkload,
} from '@entities/plan/lib/planAnalytics';
import type { EducationPlan } from '@entities/plan/model/types';
import { SemesterAccordion } from '@entities/plan/ui/SemesterAccordion/SemesterAccordion';
import { areEducationLevelsCompatible } from '@features/comparison/lib/compareEligibility';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
import { Breadcrumbs } from '@shared/ui/Breadcrumbs/Breadcrumbs';
import { ChartCard } from '@shared/ui/ChartCard/ChartCard';
import { EmptyState } from '@shared/ui/EmptyState/EmptyState';
import { ErrorState, LoadingState } from '@shared/ui/InterfaceState/InterfaceState';
import { MetricCard } from '@shared/ui/MetricCard/MetricCard';
import {
  NextAction,
  PageHeader,
  PageSection,
  SectionHeader,
} from '@shared/ui/PageLayout/PageLayout';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Tooltip as Hint } from '@shared/ui/tooltip';

const chartTooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  color: 'var(--color-ink)',
};

export const PlanDetailsPage = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState<EducationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [semester, setSemester] = useState('all');
  const [controlForm, setControlForm] = useState('all');
  const user = useWorkspaceStore((state) => state.user);
  const favorites = useWorkspaceStore((state) => state.favorites);
  const toggleFavorite = useWorkspaceStore((state) => state.toggleFavorite);
  const addToCompare = useWorkspaceStore((state) => state.addToCompare);
  const compareIds = useWorkspaceStore((state) => state.compareIds);
  const compareLevels = useWorkspaceStore((state) => state.compareLevels);
  const addToHistory = useWorkspaceStore((state) => state.addToHistory);

  const load = useCallback(async () => {
    const planId = Number(id);
    if (!Number.isInteger(planId) || planId < 1) {
      setError('Адрес учебного плана указан неверно.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await plansApi.getById(planId);
      setPlan(data);
      addToHistory(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Не удалось загрузить учебный план',
      );
    } finally {
      setLoading(false);
    }
  }, [addToHistory, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const controlForms = useMemo(
    () =>
      plan
        ? [
            ...new Set(
              plan.disciplines
                .map((item) => item.controlForm)
                .filter((value): value is string => Boolean(value)),
            ),
          ].sort((a, b) => a.localeCompare(b, 'ru'))
        : [],
    [plan],
  );
  const semesters = useMemo(
    () =>
      plan
        ? [
            ...new Set(
              plan.disciplines
                .map((item) => item.semester)
                .filter((value): value is number => Boolean(value)),
            ),
          ].sort((a, b) => a - b)
        : [],
    [plan],
  );
  const filteredDisciplines = useMemo(
    () =>
      plan?.disciplines.filter((discipline) => {
        const normalized = query.trim().toLowerCase();
        return (
          (!normalized ||
            discipline.name.toLowerCase().includes(normalized) ||
            discipline.module.toLowerCase().includes(normalized)) &&
          (semester === 'all' || String(discipline.semester) === semester) &&
          (controlForm === 'all' || discipline.controlForm === controlForm)
        );
      }) ?? [],
    [controlForm, plan, query, semester],
  );

  if (loading)
    return (
      <main className="page-main plan-details-page">
        <div className="container">
          <LoadingState label="Загружаем структуру учебного плана" rows={5} />
        </div>
      </main>
    );
  if (!plan || error)
    return (
      <main className="page-main plan-details-page">
        <div className="container">
          <ErrorState
            title="Не удалось открыть учебный план"
            text={error ?? 'План не найден или больше недоступен.'}
            onRetry={() => void load()}
          />
        </div>
      </main>
    );

  const totals = getPlanTotals(plan);
  const semesterData = getSemesterBuckets(plan).filter((item) => item.key !== 'unknown');
  const hasSemesterWorkload = semesterData.some((item) => item.totalHours > 0);
  const workload = getWorkload(plan);
  const hasWorkload = workload.some((item) => item.hours > 0);
  const workloadTotal = Math.max(
    workload.reduce((sum, item) => sum + item.hours, 0),
    1,
  );
  const insights = getPlanInsights(plan);
  const semesterInsight = hasSemesterWorkload ? insights[0] : undefined;
  const workloadInsight = hasWorkload ? insights[hasSemesterWorkload ? 1 : 0] : undefined;
  const controlInsight = plan.visualization?.controlForms?.[0]
    ? insights[Number(hasSemesterWorkload) + Number(hasWorkload)]
    : undefined;
  const filteredPlan = { ...plan, disciplines: filteredDisciplines };
  const isFavorite = favorites.includes(plan.id);
  const requiredCompareLevel = compareLevels.find((level) => level !== null) ?? null;
  const isInCompare = compareIds.includes(plan.id);
  const canAddToCompare = Boolean(
    isInCompare ||
    !requiredCompareLevel ||
    areEducationLevelsCompatible(plan.level, requiredCompareLevel),
  );
  const compareHint = requiredCompareLevel
    ? `Для сравнения выберите программу уровня «${requiredCompareLevel}».`
    : '';

  return (
    <main className="page-main plan-details-page">
      <div className="container page-stack plan-details">
        <PageHeader
          title={plan.title}
          description="Изучите ключевые параметры, распределение нагрузки и дисциплины по семестрам."
          breadcrumbs={
            <Breadcrumbs
              items={[{ label: 'Учебные планы', to: '/plans' }, { label: plan.title }]}
            />
          }
          actions={
            <>
              {canAddToCompare ? (
                <Button asChild onClick={() => addToCompare(plan)}>
                  <Link to="/compare">
                    <BarChart3 className="h-4 w-4" />
                    Сравнить
                  </Link>
                </Button>
              ) : (
                <Hint content={compareHint}>
                  <Button type="button" disabled>
                    <BarChart3 className="h-4 w-4" />
                    Другой уровень
                  </Button>
                </Hint>
              )}
              {user ? (
                <Button type="button" variant="outline" onClick={() => toggleFavorite(plan.id)}>
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/login">
                    <Heart className="h-4 w-4" />
                    Сохранить программу
                  </Link>
                </Button>
              )}
            </>
          }
        />

        <PageSection className="plan-overview" labelledBy="plan-overview">
          <div className="plan-overview__heading">
            <div>
              <div className="eyebrow">Обзор</div>
              <h2 id="plan-overview" className="section-title">
                Ключевые параметры
              </h2>
            </div>
            <p>
              <strong>ЗЕТ</strong> — зачётная единица трудоёмкости; обычно соответствует 36
              академическим часам.
            </p>
          </div>
          <Card className="plan-summary-card">
            <CardContent className="plan-summary-card__content">
              <dl className="plan-metadata">
                <div>
                  <dt>Направление</dt>
                  <dd>
                    {plan.code} · {plan.direction}
                  </dd>
                </div>
                <div>
                  <dt>Профиль</dt>
                  <dd>{plan.profile ?? 'Не указан отдельно'}</dd>
                </div>
                <div>
                  <dt>Факультет</dt>
                  <dd>{plan.faculty}</dd>
                </div>
                <div>
                  <dt>Год набора</dt>
                  <dd>{plan.year}</dd>
                </div>
                <div>
                  <dt>Форма обучения</dt>
                  <dd>{plan.studyForm}</dd>
                </div>
                <div>
                  <dt>Уровень</dt>
                  <dd>{plan.level}</dd>
                </div>
              </dl>
              <div className="plan-metrics">
                <MetricCard
                  label="Дисциплины"
                  value={totals.disciplinesCount}
                  icon={<BookOpen className="h-5 w-5" />}
                  className="plan-metric"
                />
                <MetricCard
                  label="Семестры"
                  value={plan.semesters}
                  icon={<CalendarRange className="h-5 w-5" />}
                  className="plan-metric"
                />
                <MetricCard
                  label="Общая нагрузка"
                  value={`${formatMetric(totals.totalHours)} ч.`}
                  icon={<Clock3 className="h-5 w-5" />}
                  className="plan-metric"
                />
                <MetricCard
                  label="Трудоёмкость"
                  value={`${formatMetric(totals.credits)} ЗЕТ`}
                  icon={<WalletCards className="h-5 w-5" />}
                  className="plan-metric"
                />
                <MetricCard
                  label="Лекции"
                  value={`${formatMetric(totals.lectureHours)} ч.`}
                  icon={<GraduationCap className="h-5 w-5" />}
                  className="plan-metric plan-metric--secondary"
                />
                <MetricCard
                  label="Практики"
                  value={`${formatMetric(totals.practiceHours)} ч.`}
                  icon={<UsersRound className="h-5 w-5" />}
                  className="plan-metric plan-metric--secondary"
                />
                <MetricCard
                  label="Лабораторные"
                  value={`${formatMetric(totals.labHours)} ч.`}
                  icon={<Beaker className="h-5 w-5" />}
                  className="plan-metric plan-metric--secondary"
                />
              </div>
            </CardContent>
          </Card>
        </PageSection>

        <PageSection className="plan-analysis" labelledBy="plan-analysis">
          <SectionHeader
            id="plan-analysis"
            eyebrow="Структура"
            title="Нагрузка по программе"
            description="Посмотрите, на какие семестры и форматы занятий приходится учебное время."
          />
          <div className="plan-analysis__grid">
            <div className="plan-analysis__panel plan-analysis__panel--semester">
              {hasSemesterWorkload ? (
                <ChartCard
                  title="По семестрам"
                  description="Общая трудоёмкость дисциплин каждого семестра, в академических часах."
                  insight={semesterInsight}
                >
                  <div
                    className="plan-chart"
                    role="img"
                    aria-label="Столбчатый график учебной нагрузки по семестрам"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={semesterData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tickFormatter={(value: string) => value.replace(' семестр', '')}
                          tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                          unit=" ч"
                          width={54}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) => [`${Number(value ?? 0)} ч.`, 'Общая нагрузка']}
                        />
                        <Bar
                          dataKey="totalHours"
                          fill="var(--color-program-a)"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : (
                <EmptyState
                  title="Нет данных по семестрам"
                  text="В плане не указана нагрузка по семестрам."
                />
              )}
            </div>

            <div className="plan-analysis__panel plan-analysis__panel--workload">
              {hasWorkload ? (
                <ChartCard
                  title="По форматам занятий"
                  description="Часы и доля каждого формата в учтённой нагрузке."
                  insight={workloadInsight}
                >
                  <div className="workload-composition">
                    {workload.map((item) => {
                      const percent = Math.round((item.hours / workloadTotal) * 100);
                      return (
                        <div key={item.key} className="workload-composition__row">
                          <div>
                            <strong>{item.label}</strong>
                            <span>
                              {formatMetric(item.hours)} ч. · {percent}%
                            </span>
                          </div>
                          <div
                            className="workload-composition__track"
                            role="img"
                            aria-label={`${item.label}: ${formatMetric(item.hours)} часов, ${percent}%`}
                          >
                            <span style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              ) : (
                <EmptyState
                  title="Нет данных по форматам"
                  text="В плане не указаны часы для разных форматов занятий."
                />
              )}
            </div>
          </div>
          {controlInsight && (
            <div className="plan-control-insight">
              <Badge variant="shared">Форма контроля</Badge>
              <span>{controlInsight}</span>
            </div>
          )}
        </PageSection>

        <PageSection className="plan-disciplines" labelledBy="plan-disciplines">
          <SectionHeader
            id="plan-disciplines"
            eyebrow="Содержание"
            title="Дисциплины"
            description="Найдите предмет и уточните его нагрузку, семестр и форму контроля."
          />
          <Card className="plan-disciplines-card">
            <CardContent className="plan-disciplines-card__content">
              <div className="discipline-filters">
                <div>
                  <Label htmlFor="discipline-search">Поиск дисциплины</Label>
                  <div className="discipline-filters__search">
                    <Search className="h-4 w-4" />
                    <Input
                      id="discipline-search"
                      value={query}
                      placeholder="Например, математика"
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="discipline-semester">Семестр</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger id="discipline-semester">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все семестры</SelectItem>
                      {semesters.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} семестр
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discipline-control">Форма контроля</Label>
                  <Select value={controlForm} onValueChange={setControlForm}>
                    <SelectTrigger id="discipline-control">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все формы</SelectItem>
                      {controlForms.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="discipline-results-count">Дисциплины: {filteredDisciplines.length}</p>
              <div className="discipline-results">
                {filteredDisciplines.length ? (
                  <SemesterAccordion plan={filteredPlan} />
                ) : (
                  <EmptyState
                    title="Дисциплины не найдены"
                    text="Измените запрос или сбросьте фильтры дисциплин."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQuery('');
                          setSemester('all');
                          setControlForm('all');
                        }}
                      >
                        Сбросить фильтры
                      </Button>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </PageSection>

        <NextAction className="plan-next-action">
          <div className="plan-next-action__content">
            <div>
              <p className="plan-next-action__eyebrow">Следующее действие</p>
              <h2>Сравнить с другой программой</h2>
              <p>Посмотрите совпадения дисциплин и разницу в учебной нагрузке.</p>
            </div>
            {canAddToCompare ? (
              <Button asChild size="lg" variant="secondary" onClick={() => addToCompare(plan)}>
                <Link to="/compare">
                  <BarChart3 className="h-5 w-5" />
                  Выбрать программу
                </Link>
              </Button>
            ) : (
              <Hint content={compareHint}>
                <Button type="button" size="lg" variant="secondary" disabled>
                  <BarChart3 className="h-5 w-5" />
                  Другой уровень
                </Button>
              </Hint>
            )}
          </div>
        </NextAction>
      </div>
    </main>
  );
};
