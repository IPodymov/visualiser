import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, History, Info } from 'lucide-react';
import './YearComparisonSection.css';
import { formatMetric, getPlanTotals, getSemesterBuckets } from '@entities/plan/lib/planAnalytics';
import type { Discipline, EducationPlan } from '@entities/plan/model/types';
import type { PlanComparison } from '@features/comparison/model/types';
import { CompareTable } from '@features/comparison/ui/CompareTable/CompareTable';
import { ComparisonIndicator } from '@features/comparison/ui/ComparisonIndicator/ComparisonIndicator';
import { EmptyState } from '@shared/ui/EmptyState/EmptyState';
import { ErrorState, LoadingState } from '@shared/ui/InterfaceState/InterfaceState';
import { MetricCard } from '@shared/ui/MetricCard/MetricCard';
import { PageSection, SectionHeader } from '@shared/ui/PageLayout/PageLayout';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import type { YearComparison } from '../../model/types';

type MetricRow = {
  key: string;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
};

type MetricGroup = { title: string; rows: MetricRow[] };

const withUnit = (value: number, unit: string) =>
  unit ? `${formatMetric(value)} ${unit}` : formatMetric(value);

const buildGroups = (current: EducationPlan, previous: EducationPlan): MetricGroup[] => {
  const currentTotals = getPlanTotals(current);
  const previousTotals = getPlanTotals(previous);
  const currentSemesters = getSemesterBuckets(current).filter((item) => item.key !== 'unknown');
  const previousSemesters = getSemesterBuckets(previous).filter((item) => item.key !== 'unknown');
  const semesterKeys = [
    ...new Set([...currentSemesters, ...previousSemesters].map((item) => item.key)),
  ].sort((left, right) => Number(left) - Number(right));
  const total = (key: keyof typeof currentTotals, label: string, unit: string): MetricRow => ({
    key,
    label,
    unit,
    current: currentTotals[key],
    previous: previousTotals[key],
  });

  return [
    {
      title: 'Объём программы',
      rows: [
        total('disciplinesCount', 'Дисциплины', ''),
        total('totalHours', 'Общая нагрузка', 'ч.'),
        total('credits', 'Трудоёмкость', 'ЗЕТ'),
      ],
    },
    {
      title: 'Форматы занятий',
      rows: [
        total('lectureHours', 'Лекции', 'ч.'),
        total('practiceHours', 'Практики и семинары', 'ч.'),
        total('labHours', 'Лабораторные', 'ч.'),
        total('independentHours', 'Самостоятельная работа', 'ч.'),
      ],
    },
    {
      title: 'Нагрузка по семестрам',
      rows: semesterKeys.map((key) => ({
        key: `semester-${key}`,
        label: `${key} семестр`,
        unit: 'ч.',
        current: currentSemesters.find((item) => item.key === key)?.totalHours ?? null,
        previous: previousSemesters.find((item) => item.key === key)?.totalHours ?? null,
      })),
    },
  ].filter((group) => group.rows.length > 0);
};

const Delta = ({
  row,
  currentYear,
  previousYear,
}: {
  row: MetricRow;
  currentYear: number;
  previousYear: number;
}) => {
  if (row.current === null && row.previous === null) {
    return <span className="year-compare__missing">Не указано</span>;
  }
  if (row.previous === null) {
    return <ComparisonIndicator state="onlyA">Только в {currentYear}</ComparisonIndicator>;
  }
  if (row.current === null) {
    return <ComparisonIndicator state="onlyB">Только в {previousYear}</ComparisonIndicator>;
  }
  const difference = Math.abs(row.current - row.previous);
  if (difference === 0)
    return <ComparisonIndicator state="equal">Без изменений</ComparisonIndicator>;
  return (
    <ComparisonIndicator state={row.current > row.previous ? 'more' : 'less'}>
      В {currentYear} на {withUnit(difference, row.unit)}{' '}
      {row.current > row.previous ? 'больше' : 'меньше'}
    </ComparisonIndicator>
  );
};

const describeChange = (value: number, unit: string, increased: string, decreased: string) => {
  if (value === 0) return null;
  return `${value > 0 ? increased : decreased} на ${withUnit(Math.abs(value), unit)}`;
};

const DisciplineList = ({ disciplines, empty }: { disciplines: Discipline[]; empty: string }) =>
  disciplines.length ? (
    <ul className="year-compare__list">
      {disciplines.map((discipline) => (
        <li key={`${discipline.id}-${discipline.name}`}>
          <strong>{discipline.name}</strong>
          <span>
            {discipline.semester ? `${discipline.semester} семестр` : 'Семестр не указан'}
            {' · '}
            {discipline.hours ? `${discipline.hours} ч.` : 'часы не указаны'}
            {discipline.credits ? ` · ${formatMetric(discipline.credits)} ЗЕТ` : ''}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="year-compare__empty-list">{empty}</p>
  );

const YearComparisonResult = ({
  comparison,
  currentYear,
  previousYear,
  candidatesCount,
  sourceFileName,
}: {
  comparison: PlanComparison;
  currentYear: number;
  previousYear: number;
  candidatesCount: number;
  sourceFileName: string;
}) => {
  const groups = buildGroups(comparison.firstPlan, comparison.secondPlan);
  const changed = comparison.commonDisciplines.filter((item) => item.differences.length > 0);
  const unchangedCount = comparison.summary.commonCount - changed.length;
  const added = comparison.onlyInFirst;
  const removed = comparison.onlyInSecond;
  const hoursDelta =
    getPlanTotals(comparison.firstPlan).totalHours -
    getPlanTotals(comparison.secondPlan).totalHours;
  const observation = [
    added.length || removed.length
      ? `В ${currentYear} году добавлено дисциплин: ${added.length}, убрано: ${removed.length}`
      : `Состав дисциплин в ${currentYear} году не изменился`,
    describeChange(hoursDelta, 'ч.', 'общая нагрузка выросла', 'общая нагрузка уменьшилась') ??
      'общая нагрузка не изменилась',
  ].join('; ');
  // CompareTable names each side by plan title, so the years become the titles.
  const yearComparison: PlanComparison = {
    ...comparison,
    firstPlan: { ...comparison.firstPlan, title: String(currentYear) },
    secondPlan: { ...comparison.secondPlan, title: String(previousYear) },
  };

  return (
    <>
      <div className="year-compare__metrics">
        <MetricCard label="Новые дисциплины" value={added.length} tone="programA" />
        <MetricCard label="Убраны" value={removed.length} tone="programB" />
        <MetricCard label="Изменились параметры" value={changed.length} />
        <MetricCard label="Без изменений" value={unchangedCount} tone="shared" />
      </div>

      <p className="year-compare__observation">
        <Info className="h-4 w-4" aria-hidden="true" />
        <span>{observation}.</span>
      </p>

      <Card className="year-compare__card">
        <CardContent className="year-compare__card-content">
          <div
            className="year-compare__scroll"
            role="region"
            aria-label={`Показатели плана ${currentYear} и ${previousYear} года`}
            tabIndex={0}
          >
            <table className="year-compare__table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Показатель</span>
                  </th>
                  <th scope="col">
                    <span className="year-compare__year">{currentYear}</span>
                    <Badge variant="programA">Этот план</Badge>
                  </th>
                  <th scope="col">
                    <span className="year-compare__year">{previousYear}</span>
                    <Badge variant="programB">Прошлый год</Badge>
                  </th>
                  <th scope="col">Изменение</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <Fragment key={group.title}>
                    <tr className="year-compare__group">
                      <th scope="colgroup" colSpan={4}>
                        {group.title}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row">{row.label}</th>
                        <td>{row.current === null ? '—' : withUnit(row.current, row.unit)}</td>
                        <td>{row.previous === null ? '—' : withUnit(row.previous, row.unit)}</td>
                        <td>
                          <Delta row={row} currentYear={currentYear} previousYear={previousYear} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="added" className="year-compare__tabs">
        <TabsList className="year-compare__tabs-list">
          <TabsTrigger value="added">Новые · {added.length}</TabsTrigger>
          <TabsTrigger value="removed">Убраны · {removed.length}</TabsTrigger>
          <TabsTrigger value="changed">Изменены · {changed.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="added">
          <DisciplineList
            disciplines={added}
            empty={`В ${currentYear} году новых дисциплин нет.`}
          />
        </TabsContent>
        <TabsContent value="removed">
          <DisciplineList
            disciplines={removed}
            empty={`Все дисциплины плана ${previousYear} года сохранились.`}
          />
        </TabsContent>
        <TabsContent value="changed">
          <CompareTable comparison={yearComparison} />
        </TabsContent>
      </Tabs>

      <p className="year-compare__note">
        Дисциплины сопоставляются по названию. Переименованная дисциплина попадёт одновременно в
        новые и в убранные.
        {candidatesCount > 1 &&
          ` За ${previousYear} год найдено несколько версий этого плана (${candidatesCount}); для сравнения выбран файл «${sourceFileName}».`}
      </p>
    </>
  );
};

export const YearComparisonSection = ({
  plan,
  state,
}: {
  plan: EducationPlan;
  state: {
    data: YearComparison | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
  };
}) => {
  const { data, loading, error, retry } = state;
  const previous = data?.versions.previous ?? null;
  const next = data?.versions.next ?? null;
  const previousYear = previous?.admissionYear ?? plan.year - 1;

  return (
    <PageSection className="year-compare" labelledBy="plan-year-comparison">
      <SectionHeader
        id="plan-year-comparison"
        eyebrow="История плана"
        title={`Изменения с ${previousYear} года`}
        description={`Сравнение с планом этой же программы и формы обучения для набора ${previousYear} года: какие дисциплины появились, какие убраны и как изменилась нагрузка.`}
        action={
          previous && (
            <Button asChild variant="outline">
              <Link to={`/plans/${previous.curriculumId}`}>
                <History className="h-4 w-4" />
                Открыть план {previous.admissionYear}
              </Link>
            </Button>
          )
        }
      />

      {data?.versions.isArchived && next && (
        <div className="year-compare__archive" role="note">
          <Badge variant="warning">Архив</Badge>
          <span>
            Это план набора {plan.year} года. Для поступления действует план {next.admissionYear}{' '}
            года.
          </span>
          <Link to={`/plans/${next.curriculumId}`}>
            Открыть план {next.admissionYear}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {loading ? (
        <LoadingState label="Сравниваем план с прошлым годом" rows={2} />
      ) : error ? (
        <ErrorState title="Не удалось сравнить с прошлым годом" text={error} onRetry={retry} />
      ) : data?.comparison && previous ? (
        <YearComparisonResult
          comparison={data.comparison}
          currentYear={plan.year}
          previousYear={previous.admissionYear}
          candidatesCount={previous.candidatesCount}
          sourceFileName={previous.sourceFileName}
        />
      ) : (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title={`План ${previousYear} года не найден`}
          text={`Среди загруженных учебных планов нет плана этой программы и формы обучения для набора ${previousYear} года, поэтому сравнивать не с чем.`}
        />
      )}
    </PageSection>
  );
};
