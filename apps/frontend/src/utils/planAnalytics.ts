import type { EducationPlan, PlanChartBucket, PlanVisualization } from '../types/plan';

const round = (value: number) => Math.round(value * 100) / 100;

export const getPlanTotals = (plan: EducationPlan): PlanVisualization['totals'] => {
  if (plan.visualization?.totals) return plan.visualization.totals;

  const totals = plan.disciplines.reduce(
    (result, discipline) => ({
      disciplinesCount: result.disciplinesCount + 1,
      totalHours: result.totalHours + discipline.hours,
      credits: round(result.credits + discipline.credits),
      lectureHours: result.lectureHours + (discipline.lectureHours ?? 0),
      practiceHours: result.practiceHours + (discipline.practiceHours ?? 0),
      labHours: result.labHours + (discipline.labHours ?? 0),
      independentHours: result.independentHours + (discipline.independentHours ?? 0),
      contactHours:
        result.contactHours +
        (discipline.lectureHours ?? 0) +
        (discipline.practiceHours ?? 0) +
        (discipline.labHours ?? 0),
    }),
    {
      disciplinesCount: 0,
      totalHours: 0,
      credits: 0,
      lectureHours: 0,
      practiceHours: 0,
      labHours: 0,
      independentHours: 0,
      contactHours: 0,
    },
  );

  return totals;
};

export const getSemesterBuckets = (plan: EducationPlan): PlanChartBucket[] => {
  if (plan.visualization?.bySemester?.length) return plan.visualization.bySemester;

  const buckets = new Map<number, PlanChartBucket>();
  plan.disciplines.forEach((discipline) => {
    const semester = discipline.semester ?? 0;
    const current = buckets.get(semester) ?? {
      key: String(semester || 'unknown'),
      label: semester ? `${semester} семестр` : 'Без семестра',
      disciplinesCount: 0,
      totalHours: 0,
      credits: 0,
      lectureHours: 0,
      practiceHours: 0,
      labHours: 0,
      independentHours: 0,
    };
    current.disciplinesCount += 1;
    current.totalHours += discipline.hours;
    current.credits = round(current.credits + discipline.credits);
    current.lectureHours += discipline.lectureHours ?? 0;
    current.practiceHours += discipline.practiceHours ?? 0;
    current.labHours += discipline.labHours ?? 0;
    current.independentHours += discipline.independentHours ?? 0;
    buckets.set(semester, current);
  });

  return [...buckets.entries()].sort(([left], [right]) => left - right).map(([, bucket]) => bucket);
};

export const getWorkload = (plan: EducationPlan) => {
  if (plan.visualization?.workload?.length) return plan.visualization.workload;
  const totals = getPlanTotals(plan);
  return [
    { key: 'lectureHours', label: 'Лекции', hours: totals.lectureHours },
    { key: 'practiceHours', label: 'Практики', hours: totals.practiceHours },
    { key: 'labHours', label: 'Лабораторные', hours: totals.labHours },
    { key: 'independentHours', label: 'Самостоятельная работа', hours: totals.independentHours },
  ];
};

export const getPlanInsights = (plan: EducationPlan) => {
  const insights: string[] = [];
  const semesters = getSemesterBuckets(plan).filter(
    (bucket) => bucket.totalHours > 0 && bucket.key !== 'unknown',
  );
  const peak = [...semesters].sort((left, right) => right.totalHours - left.totalHours)[0];
  if (peak)
    insights.push(
      `Наибольшая учебная нагрузка приходится на ${peak.label.toLowerCase()} — ${peak.totalHours} ч.`,
    );

  const workload = getWorkload(plan).filter((item) => item.hours > 0);
  const largest = [...workload].sort((left, right) => right.hours - left.hours)[0];
  if (largest)
    insights.push(
      `Самая крупная часть учтённой нагрузки — ${largest.label.toLowerCase()}: ${largest.hours} ч.`,
    );

  const control = plan.visualization?.controlForms?.[0];
  if (control)
    insights.push(
      `Чаще всего в плане встречается форма контроля «${control.form}» — ${control.count} дисциплин.`,
    );

  return insights.slice(0, 3);
};

export const formatMetric = (value: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
