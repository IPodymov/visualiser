import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  GitCompareArrows,
  Info,
  Scale,
  WalletCards,
} from 'lucide-react';
import './ComparePage.css';
import { formatMetric, getPlanTotals, getSemesterBuckets } from '@entities/plan/lib/planAnalytics';
import type { Discipline } from '@entities/plan/model/types';
import { usePlans } from '@features/plan-catalog/model/usePlans';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
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
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Tooltip as Hint } from '@shared/ui/tooltip';
import { comparisonApi } from '../api/comparison';
import { areEducationLevelsCompatible } from '../lib/compareEligibility';
import type { PlanComparison } from '../model/types';
import { CompareTable } from './CompareTable/CompareTable';
import { ComparisonIndicator } from './ComparisonIndicator/ComparisonIndicator';
import { PlanSelector } from './PlanSelector/PlanSelector';

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  color: 'var(--color-ink)',
};

const deltaText = (first: number, second: number, unit: string, title: string) => {
  const difference = Math.abs(first - second);
  if (difference === 0) return `Одинаково: ${formatMetric(first)} ${unit}`;
  return `В «${title}» на ${formatMetric(difference)} ${unit} ${first > second ? 'больше' : 'меньше'}`;
};

const UniqueList = ({
  title,
  side,
  disciplines,
}: {
  title: string;
  side: 'A' | 'B';
  disciplines: Discipline[];
}) => (
  <Card
    className={
      side === 'A' ? 'compare-unique compare-unique--a' : 'compare-unique compare-unique--b'
    }
  >
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Badge variant={side === 'A' ? 'programA' : 'programB'}>{disciplines.length}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      {disciplines.length ? (
        <ul className="compare-unique__list" tabIndex={0} aria-label={title}>
          {disciplines.map((discipline) => (
            <li key={`${discipline.id}-${discipline.name}`}>
              <div>
                <strong>{discipline.name}</strong>
                <span>
                  {discipline.semester ? `${discipline.semester} семестр` : 'Семестр не указан'}
                </span>
              </div>
              <span>
                {discipline.hours ? `${discipline.hours} ч.` : 'часы не указаны'}
                {discipline.credits ? ` · ${discipline.credits} ЗЕТ` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Уникальных дисциплин на этой стороне нет.</p>
      )}
    </CardContent>
  </Card>
);

export const ComparePage = () => {
  const { plans, loading: plansLoading, error: plansError, reload } = usePlans();
  const compareIds = useWorkspaceStore((state) => state.compareIds);
  const compareLevels = useWorkspaceStore((state) => state.compareLevels);
  const setComparePlan = useWorkspaceStore((state) => state.setComparePlan);
  const [comparison, setComparison] = useState<PlanComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const [firstId, secondId] = compareIds;
    if (!firstId || !secondId) {
      setComparison(null);
      setError(null);
      return;
    }
    if (
      !compareLevels[0] ||
      !compareLevels[1] ||
      !areEducationLevelsCompatible(compareLevels[0], compareLevels[1])
    ) {
      setComparison(null);
      setComparing(false);
      setError('Для сравнения выберите две программы одного уровня образования.');
      return;
    }
    let active = true;
    setComparing(true);
    setError(null);
    comparisonApi
      .compare(firstId, secondId)
      .then((result) => {
        if (active) setComparison(result);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error ? requestError.message : 'Не удалось сравнить программы',
          );
      })
      .finally(() => {
        if (active) setComparing(false);
      });
    return () => {
      active = false;
    };
  }, [compareIds, compareLevels, retryKey]);

  const analytics = useMemo(() => {
    if (!comparison) return null;
    const firstTotals = getPlanTotals(comparison.firstPlan);
    const secondTotals = getPlanTotals(comparison.secondPlan);
    const denominator =
      comparison.summary.firstDisciplinesCount + comparison.summary.secondDisciplinesCount;
    const similarity = denominator
      ? Math.round(((2 * comparison.summary.commonCount) / denominator) * 100)
      : null;
    const workload = [
      { label: 'Общая нагрузка', a: firstTotals.totalHours, b: secondTotals.totalHours },
      { label: 'Лекции', a: firstTotals.lectureHours, b: secondTotals.lectureHours },
      { label: 'Практики', a: firstTotals.practiceHours, b: secondTotals.practiceHours },
      { label: 'Лабораторные', a: firstTotals.labHours, b: secondTotals.labHours },
      {
        label: 'Самостоятельная',
        a: firstTotals.independentHours,
        b: secondTotals.independentHours,
      },
    ];
    const semesters = new Map<number, { semester: number; label: string; a: number; b: number }>();
    getSemesterBuckets(comparison.firstPlan).forEach((item) => {
      const semester = Number(item.key);
      if (semester)
        semesters.set(semester, { semester, label: `${semester}`, a: item.totalHours, b: 0 });
    });
    getSemesterBuckets(comparison.secondPlan).forEach((item) => {
      const semester = Number(item.key);
      if (!semester) return;
      const current = semesters.get(semester) ?? { semester, label: `${semester}`, a: 0, b: 0 };
      current.b = item.totalHours;
      semesters.set(semester, current);
    });
    return {
      firstTotals,
      secondTotals,
      similarity,
      workload,
      hasWorkload: workload.some((item) => item.a > 0 || item.b > 0),
      semesters: [...semesters.values()].sort((left, right) => left.semester - right.semester),
      hasSemesterWorkload: [...semesters.values()].some((item) => item.a > 0 || item.b > 0),
    };
  }, [comparison]);

  const bothSelected = Boolean(compareIds[0] && compareIds[1]);
  const changePlan = (slot: 0 | 1, value: number | null) => {
    const selected = value === null ? null : plans.find((plan) => plan.id === value);
    if (value !== null && !selected) return;
    setComparePlan(slot, selected ?? null);
  };

  return (
    <main className="page-main">
      <div className="container page-stack">
        <PageHeader
          eyebrow="Сравнение учебных планов"
          title="Увидьте различия двух программ без разбора большой таблицы"
          description="Выберите две программы — EduPlan Compare покажет сходство дисциплин, разницу нагрузки, динамику по семестрам и предметы, которые есть только в одном плане."
        />

        <PageSection labelledBy="compare-selector">
          <SectionHeader
            id="compare-selector"
            title="Какие программы сравнить"
            description="Сравнивать можно программы одного уровня образования. Любой слот можно заменить, не сбрасывая второй."
          />
          {plansError && !plans.length ? (
            <ErrorState
              title="Не удалось загрузить список программ"
              text={plansError}
              onRetry={() => void reload()}
            />
          ) : plansLoading ? (
            <LoadingState label="Загружаем список программ" rows={2} />
          ) : (
            <div className="compare-selectors">
              <PlanSelector
                side="A"
                value={compareIds[0]}
                plans={plans}
                excludedId={compareIds[1]}
                requiredLevel={compareIds[1] ? compareLevels[1] : null}
                onChange={(value) => changePlan(0, value)}
              />
              <div className="compare-selectors__divider">
                <GitCompareArrows className="h-5 w-5" />
                <span>сравнить</span>
              </div>
              <PlanSelector
                side="B"
                value={compareIds[1]}
                plans={plans}
                excludedId={compareIds[0]}
                requiredLevel={compareIds[0] ? compareLevels[0] : null}
                onChange={(value) => changePlan(1, value)}
              />
            </div>
          )}
        </PageSection>

        {!bothSelected ? (
          <EmptyState
            title="Выберите две образовательные программы"
            text="Добавьте две программы одного уровня образования. Выбор сохранится, если вы вернётесь в каталог."
            action={
              <Button asChild variant="outline">
                <Link to="/plans">Открыть каталог</Link>
              </Button>
            }
          />
        ) : comparing ? (
          <LoadingState label="Сопоставляем дисциплины и нагрузку" rows={5} />
        ) : error ? (
          <ErrorState
            title="Не удалось сравнить программы"
            text={error}
            onRetry={() => setRetryKey((key) => key + 1)}
          />
        ) : comparison && analytics ? (
          <>
            <PageSection labelledBy="compare-summary">
              <SectionHeader
                id="compare-summary"
                eyebrow="Краткий ответ"
                title="Насколько программы похожи"
                description="Процент сходства учитывает совпадение названий дисциплин. Он не оценивает качество программ и не означает их полную эквивалентность."
                action={
                  <Hint content="Формула: 2 × общие дисциплины / сумма дисциплин двух программ.">
                    <button type="button" className="compare-help">
                      <Info className="h-4 w-4" />
                      Как рассчитано сходство
                    </button>
                  </Hint>
                }
              />
              <div className="compare-program-labels">
                <div>
                  <Badge variant="programA">A</Badge>
                  <span>{comparison.firstPlan.title}</span>
                </div>
                <div>
                  <Badge variant="programB">B</Badge>
                  <span>{comparison.secondPlan.title}</span>
                </div>
              </div>
              <div className="compare-summary-grid">
                <MetricCard
                  label="Сходство дисциплин"
                  value={analytics.similarity === null ? '—' : `${analytics.similarity}%`}
                  tone="shared"
                  note={
                    analytics.similarity === null
                      ? 'Недостаточно данных о дисциплинах'
                      : 'Совпадение названий предметов'
                  }
                  icon={<Scale className="h-5 w-5" />}
                />
                <MetricCard
                  label="Общие дисциплины"
                  value={comparison.summary.commonCount}
                  tone="shared"
                  icon={<BookOpenCheck className="h-5 w-5" />}
                />
                <MetricCard
                  label={`Только в «${comparison.firstPlan.title}»`}
                  value={comparison.summary.onlyFirstCount}
                  tone="programA"
                  note={`Всего дисциплин: ${comparison.summary.firstDisciplinesCount}`}
                />
                <MetricCard
                  label={`Только в «${comparison.secondPlan.title}»`}
                  value={comparison.summary.onlySecondCount}
                  tone="programB"
                  note={`Всего дисциплин: ${comparison.summary.secondDisciplinesCount}`}
                />
                <MetricCard
                  label="Разница общей нагрузки"
                  value={`${formatMetric(Math.abs(analytics.firstTotals.totalHours - analytics.secondTotals.totalHours))} ч.`}
                  note={deltaText(
                    analytics.firstTotals.totalHours,
                    analytics.secondTotals.totalHours,
                    'ч.',
                    comparison.firstPlan.title,
                  )}
                  icon={<Clock3 className="h-5 w-5" />}
                />
                <MetricCard
                  label="Разница зачётных единиц"
                  value={`${formatMetric(Math.abs(analytics.firstTotals.credits - analytics.secondTotals.credits))} ЗЕТ`}
                  note={deltaText(
                    analytics.firstTotals.credits,
                    analytics.secondTotals.credits,
                    'ЗЕТ',
                    comparison.firstPlan.title,
                  )}
                  icon={<WalletCards className="h-5 w-5" />}
                />
              </div>
            </PageSection>

            <PageSection labelledBy="compare-workload">
              <SectionHeader
                id="compare-workload"
                eyebrow="Форматы занятий"
                title="Как отличается учебная нагрузка"
                description="Сравнивайте одинаковые показатели на общей шкале. Больше часов означает больший объём, но не является оценкой качества программы."
              />
              {analytics.hasWorkload ? (
                <ChartCard
                  title="Нагрузка выбранных программ"
                  description="Для каждого формата показано точное количество академических часов."
                >
                  <div
                    className="compare-chart"
                    role="img"
                    aria-label={`Нагрузка: ${comparison.firstPlan.title} и ${comparison.secondPlan.title}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.workload}
                        layout="vertical"
                        margin={{ top: 8, right: 20, left: 24, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                          unit=" ч"
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={118}
                          tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [
                            `${Number(value ?? 0)} ч.`,
                            name === 'a' ? comparison.firstPlan.title : comparison.secondPlan.title,
                          ]}
                        />
                        <Legend
                          formatter={(value) =>
                            value === 'a' ? comparison.firstPlan.title : comparison.secondPlan.title
                          }
                        />
                        <Bar dataKey="a" fill="var(--color-program-a)" radius={[0, 5, 5, 0]} />
                        <Bar dataKey="b" fill="var(--color-program-b)" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="compare-delta-list">
                    {analytics.workload.slice(1).map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        {item.a === item.b ? (
                          <ComparisonIndicator state="equal">Одинаково</ComparisonIndicator>
                        ) : item.a > item.b ? (
                          <ComparisonIndicator state="more">
                            В «{comparison.firstPlan.title}» на {formatMetric(item.a - item.b)} ч.
                            больше
                          </ComparisonIndicator>
                        ) : (
                          <ComparisonIndicator state="less">
                            В «{comparison.firstPlan.title}» на {formatMetric(item.b - item.a)} ч.
                            меньше
                          </ComparisonIndicator>
                        )}
                      </div>
                    ))}
                  </div>
                </ChartCard>
              ) : (
                <EmptyState
                  title="Нет данных для сравнения нагрузки"
                  text="В выбранных планах не указаны часы по форматам занятий, поэтому диаграмму нагрузки нельзя построить."
                />
              )}
            </PageSection>

            <PageSection labelledBy="compare-semesters">
              <SectionHeader
                id="compare-semesters"
                eyebrow="Во времени"
                title="Нагрузка по семестрам"
                description="График показывает, в какие семестры объём дисциплин отличается сильнее всего."
              />
              {analytics.hasSemesterWorkload ? (
                <ChartCard
                  title="Динамика нагрузки выбранных программ"
                  description="По горизонтали — номер семестра, по вертикали — суммарные академические часы дисциплин."
                >
                  <div
                    className="compare-semester-chart"
                    role="img"
                    aria-label={`Нагрузка по семестрам: ${comparison.firstPlan.title} и ${comparison.secondPlan.title}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.semesters}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          label={{ value: 'Семестр', position: 'insideBottom', offset: -4 }}
                        />
                        <YAxis unit=" ч" width={58} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [
                            `${Number(value ?? 0)} ч.`,
                            name === 'a' ? comparison.firstPlan.title : comparison.secondPlan.title,
                          ]}
                        />
                        <Legend
                          formatter={(value) =>
                            value === 'a' ? comparison.firstPlan.title : comparison.secondPlan.title
                          }
                        />
                        <Bar dataKey="a" fill="var(--color-program-a)" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="b" fill="var(--color-program-b)" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : (
                <EmptyState
                  title="Нет данных о нагрузке по семестрам"
                  text="В выбранных планах не указаны часы по семестрам, поэтому динамику выбранных программ нельзя сопоставить."
                />
              )}
            </PageSection>

            <PageSection labelledBy="compare-common">
              <SectionHeader
                id="compare-common"
                eyebrow="Совпадения"
                title="Общие дисциплины"
                description="Эти предметы есть в обеих программах. Метка показывает, совпадают ли сравниваемые параметры внутри дисциплины."
              />
              {comparison.commonDisciplines.length ? (
                <Card>
                  <CardContent className="compare-common-list p-5 md:p-6">
                    {comparison.commonDisciplines.map((item) => (
                      <div key={item.name}>
                        <span>{item.name}</span>
                        {item.differences.length ? (
                          <Badge variant="warning">{item.differences.length} различий</Badge>
                        ) : (
                          <Badge variant="shared">Параметры совпадают</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  title="Общих дисциплин не найдено"
                  text="Названия дисциплин в выбранных планах не совпали. Посмотрите уникальные списки выбранных программ ниже."
                />
              )}
            </PageSection>

            <PageSection labelledBy="compare-unique">
              <SectionHeader
                id="compare-unique"
                eyebrow="Уникальная часть"
                title="Дисциплины только одной программы"
                description="Именно эти предметы сильнее всего различают содержание выбранных траекторий."
              />
              <div className="compare-unique-grid">
                <UniqueList
                  title={`Только в «${comparison.firstPlan.title}»`}
                  side="A"
                  disciplines={comparison.onlyInFirst}
                />
                <UniqueList
                  title={`Только в «${comparison.secondPlan.title}»`}
                  side="B"
                  disciplines={comparison.onlyInSecond}
                />
              </div>
            </PageSection>

            <PageSection labelledBy="compare-differences">
              <SectionHeader
                id="compare-differences"
                eyebrow="Точные изменения"
                title="Различия внутри общих дисциплин"
                description="Показаны только параметры, которые действительно отличаются. Одинаковые значения скрыты, чтобы не перегружать таблицу."
              />
              <Card>
                <CardContent className="p-4 md:p-6">
                  <CompareTable comparison={comparison} />
                </CardContent>
              </Card>
            </PageSection>

            <NextAction>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
                    Продолжить анализ
                  </p>
                  <h2 className="mt-3 text-3xl font-bold">
                    Откройте программу, чтобы изучить её по семестрам
                  </h2>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                    Сравнение показывает различия, а страница плана объясняет внутреннюю структуру
                    каждой траектории.
                  </p>
                </div>
                <div className="compare-plan-links flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link to={`/plans/${comparison.firstPlan.id}`}>
                      {comparison.firstPlan.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to={`/plans/${comparison.secondPlan.id}`}>
                      {comparison.secondPlan.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </NextAction>
          </>
        ) : null}
      </div>
    </main>
  );
};
