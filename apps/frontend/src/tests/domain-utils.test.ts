import { describe, expect, it } from 'vitest';
import { defaultFaculty } from '../constants/curriculum';
import {
  asNumber,
  facultyFromSource,
  levelByCode,
  toPlan,
} from '../services/api/planMapper';
import { cn } from '../utils/cn';
import {
  areEducationLevelsCompatible,
  getEducationLevelKey,
} from '../utils/compareEligibility';
import { getCreditsNorm, getCreditsPercent, getCreditsSummary } from '../utils/credits';
import {
  formatMetric,
  getPlanInsights,
  getPlanTotals,
  getSemesterBuckets,
  getWorkload,
} from '../utils/planAnalytics';
import { buildPlanFilterConfig } from '../utils/planFilters';
import { backendCurriculum, backendDiscipline, plan } from './fixtures';

describe('curriculum mapping', () => {
  it('normalizes numbers, education levels and faculty source paths', () => {
    expect(asNumber(4.5)).toBe(4.5);
    expect(asNumber('4,5')).toBe(4.5);
    expect(asNumber('not-a-number')).toBe(0);
    expect(asNumber(null)).toBe(0);

    expect(levelByCode('09.04.01')).toBe('Магистратура');
    expect(levelByCode('10.05.01')).toBe('Специалитет');
    expect(levelByCode('09.03.04')).toBe('Бакалавриат');
    expect(levelByCode('09.03.04', 'Пользовательский уровень')).toBe('Пользовательский уровень');

    expect(facultyFromSource()).toBe(defaultFaculty);
    expect(facultyFromSource('/plans/2025/ФИТ/plan.xlsx')).toBe('ФИТ');
    expect(facultyFromSource('/plans/2025/no-faculty/plan.xlsx')).toBe(defaultFaculty);
    expect(facultyFromSource('archive-ФИТ-plan.xlsx')).toBe('ФИТ');
    expect(facultyFromSource('archive-plan.xlsx')).toBe(defaultFaculty);
  });

  it('flattens semester DTOs and covers every discipline fallback', () => {
    const disciplines = [
      backendDiscipline({ curriculumDisciplineId: 1, moduleName: 'Модуль', semesterNumber: null }),
      backendDiscipline({ curriculumDisciplineId: undefined, disciplineId: 2, moduleName: null, partName: 'Часть' }),
      backendDiscipline({ curriculumDisciplineId: undefined, disciplineId: undefined, id: 3, moduleName: null, partName: null, blockName: 'Блок' }),
      backendDiscipline({ curriculumDisciplineId: undefined, disciplineId: undefined, id: undefined, name: undefined, discipline: { name: 'Базы данных' }, moduleName: null, partName: null, blockName: null, classifications: [{ groupCode: 'G', valueName: 'Классификация' }] }),
      backendDiscipline({ curriculumDisciplineId: undefined, disciplineId: undefined, id: undefined, name: undefined, discipline: undefined, moduleName: null, partName: null, blockName: null, classifications: [{ groupCode: 'G', valueName: undefined as never, groupName: 'Группа' }] }),
      backendDiscipline({ curriculumDisciplineId: undefined, disciplineId: undefined, id: undefined, moduleName: null, partName: null, blockName: null, classifications: [] }),
    ];
    const mapped = toPlan(
      backendCurriculum({
        faculty: null,
        educationLevel: null,
        educationForm: null,
        admissionYear: null,
        profileName: null,
        sourceFilePath: undefined,
        sourceFileName: 'archive-ФИТ.xlsx',
        speciality: { id: 2, code: '09.04.01', name: 'Информатика' },
        uploadedAt: '2024-05-01T00:00:00.000Z',
        disciplines: undefined,
        semesters: [{ number: 2, disciplines }],
      }),
    );

    expect(mapped).toMatchObject({
      title: 'Информатика',
      faculty: 'ФИТ',
      level: 'Магистратура',
      studyForm: 'Очная',
      year: 2024,
      duration: '2 года',
      semesters: 2,
    });
    expect(mapped.disciplines.map((item) => item.id)).toEqual([1, 2, 3, 3, 4, 5]);
    expect(mapped.disciplines.map((item) => item.module)).toEqual([
      'Модуль',
      'Часть',
      'Блок',
      'Классификация',
      'Группа',
      'Учебный модуль',
    ]);
    expect(mapped.disciplines[0].semester).toBe(2);
    expect(mapped.disciplines[3].name).toBe('Базы данных');
    expect(mapped.disciplines[4].name).toBe('Дисциплина');
  });

  it('maps long and empty plans with source-backed visualization intact', () => {
    const long = toPlan(
      backendCurriculum({
        disciplines: Array.from({ length: 5 }, (_, index) =>
          backendDiscipline({ curriculumDisciplineId: index + 1, semesterNumber: index + 1 }),
        ),
        visualization: {
          totals: {
            disciplinesCount: 5,
            totalHours: 720,
            credits: 20,
            lectureHours: 180,
            practiceHours: 90,
            labHours: 90,
            independentHours: 360,
            contactHours: 360,
          },
          bySemester: [],
          byBlock: [],
          byPart: [],
          workload: [],
          controlForms: [],
        },
      }),
    );
    const empty = toPlan(backendCurriculum({ disciplines: [], semesters: [] }));

    expect(long.duration).toBe('4 года');
    expect(long.visualization?.totals.totalHours).toBe(720);
    expect(empty.duration).toBe('не указана');

    const absentCollections = toPlan(
      backendCurriculum({
        disciplines: undefined,
        semesters: undefined,
      }),
    );
    expect(absentCollections.disciplines).toEqual([]);

    const missingHours = toPlan(
      backendCurriculum({
        disciplines: [backendDiscipline({ totalHours: undefined })],
        semesters: undefined,
      }),
    );
    expect(missingHours.disciplines[0].hours).toBe(0);
  });
});

describe('plan analytics', () => {
  it('uses backend visualization whenever present', () => {
    const source = plan({
      visualization: {
        totals: {
          disciplinesCount: 1,
          totalHours: 100,
          credits: 3,
          lectureHours: 20,
          practiceHours: 10,
          labHours: 5,
          independentHours: 65,
          contactHours: 35,
        },
        bySemester: [
          { key: '1', label: '1 семестр', disciplinesCount: 1, totalHours: 100, credits: 3, lectureHours: 20, practiceHours: 10, labHours: 5, independentHours: 65 },
        ],
        byBlock: [],
        byPart: [],
        workload: [{ key: 'lectureHours', label: 'Лекции', hours: 20 }],
        controlForms: [{ form: 'Экзамен', count: 1 }],
      },
    });

    expect(getPlanTotals(source)).toBe(source.visualization?.totals);
    expect(getSemesterBuckets(source)).toBe(source.visualization?.bySemester);
    expect(getWorkload(source)).toBe(source.visualization?.workload);
    expect(getPlanInsights(source)).toHaveLength(3);
  });

  it('derives rounded totals, semester buckets, workload and insights from disciplines', () => {
    const source = plan({
      disciplines: [
        { id: 1, name: 'A', module: 'M', semester: 2, hours: 100, credits: 1.234, lectureHours: 20, practiceHours: 10, labHours: 5, independentHours: 65 },
        { id: 2, name: 'B', module: 'M', semester: null, hours: 50, credits: 2.345 },
        { id: 3, name: 'C', module: 'M', semester: 1, hours: 200, credits: 3 },
      ],
      visualization: undefined,
    });

    expect(getPlanTotals(source)).toMatchObject({ totalHours: 350, credits: 6.58, contactHours: 35 });
    expect(getSemesterBuckets(source).map((item) => item.key)).toEqual(['unknown', '1', '2']);
    expect(getWorkload(source).map((item) => item.hours)).toEqual([20, 10, 5, 65]);
    expect(getPlanInsights(source)).toEqual([
      'Наибольшая учебная нагрузка приходится на 1 семестр — 200 ч.',
      'Самая крупная часть учтённой нагрузки — самостоятельная работа: 65 ч.',
    ]);
    expect(formatMetric(1234.567)).toMatch(/1\s234,57/);
  });

  it('returns no insights for a plan without measurable evidence', () => {
    expect(getPlanInsights(plan({ disciplines: [], visualization: undefined }))).toEqual([]);
  });
});

describe('filters, comparisons and formatting', () => {
  it('builds unique sorted filters from plans or authoritative faculty options', () => {
    const plans = [
      plan({ id: 1, facultyId: 2, faculty: 'ЯФ', direction: 'Б', profile: undefined, level: 'Магистратура', year: 2024 }),
      plan({ id: 2, facultyId: 1, faculty: 'АФ', direction: 'А', profile: 'Профиль', level: 'Бакалавриат', year: 2025 }),
      plan({ id: 3, facultyId: undefined, faculty: 'Без id', direction: 'А', profile: null as never, year: 2025 }),
    ];
    const fallback = buildPlanFilterConfig(plans);
    const authoritative = buildPlanFilterConfig(plans, [
      { id: 9, name: 'Факультет 9', slug: 'f9' },
    ]);

    expect(fallback[0].options.map((item) => item.label)).toEqual(['АФ', 'ЯФ']);
    expect(fallback[1].options.map((item) => item.label)).toEqual(['А', 'Б']);
    expect(fallback.map((filter) => filter.key)).toEqual(['faculty', 'direction', 'profile', 'level', 'studyForm']);
    expect(authoritative[0].options).toEqual([{ label: 'Факультет 9', value: '9' }]);
    expect(buildPlanFilterConfig(plans, [])[0].options).toEqual(fallback[0].options);
  });

  it('normalizes every supported education level and custom labels', () => {
    expect(getEducationLevelKey(' БАКАЛАВРИАТ ')).toBe('bachelor');
    expect(getEducationLevelKey('магистратура')).toBe('master');
    expect(getEducationLevelKey('специалитет')).toBe('specialist');
    expect(getEducationLevelKey('аспирантура')).toBe('postgraduate');
    expect(getEducationLevelKey('  Высшее   образование ')).toBe('высшее образование');
    expect(areEducationLevelsCompatible('Бакалавриат', 'бакалавр')).toBe(true);
    expect(areEducationLevelsCompatible('Бакалавриат', 'Магистратура')).toBe(false);
  });

  it('formats credit progress and merges class names', () => {
    expect(getCreditsNorm('Специалитет')).toBe(300);
    expect(getCreditsNorm('Бакалавриат')).toBe(240);
    expect(getCreditsPercent(400, 'Бакалавриат')).toBe(100);
    expect(getCreditsSummary(120, 'Бакалавриат')).toBe('50% нагрузки (120 ЗЕТ из 240)');
    expect(cn('p-2', false && 'hidden', 'p-4')).toBe('p-4');
  });
});
