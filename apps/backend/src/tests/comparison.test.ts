import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma', () => {
  const first = {
    id: 1,
    speciality: { id: 1, code: '09.03.04', name: 'Software Engineering' },
  };
  const second = {
    id: 2,
    speciality: { id: 2, code: '09.03.01', name: 'Computer Science' },
  };
  const disciplines = [
    {
      id: 1,
      curriculumId: 1,
      disciplineId: 1,
      semesterNumber: 1,
      controlForm: 'exam',
      totalHours: 144,
      credits: 4,
      lectureHours: null,
      practiceHours: null,
      labHours: null,
      externalDisciplineCode: null,
      discipline: { id: 1, name: 'Algorithms' },
    },
    {
      id: 2,
      curriculumId: 1,
      disciplineId: 2,
      semesterNumber: 2,
      controlForm: 'credit',
      totalHours: 72,
      credits: 2,
      lectureHours: null,
      practiceHours: null,
      labHours: null,
      externalDisciplineCode: null,
      discipline: { id: 2, name: 'Databases' },
    },
    {
      id: 3,
      curriculumId: 2,
      disciplineId: 1,
      semesterNumber: 2,
      controlForm: 'exam',
      totalHours: 108,
      credits: 3,
      lectureHours: null,
      practiceHours: null,
      labHours: null,
      externalDisciplineCode: null,
      discipline: { id: 1, name: 'Algorithms' },
    },
    {
      id: 4,
      curriculumId: 2,
      disciplineId: 3,
      semesterNumber: 1,
      controlForm: 'exam',
      totalHours: 144,
      credits: 4,
      lectureHours: null,
      practiceHours: null,
      labHours: null,
      externalDisciplineCode: null,
      discipline: { id: 3, name: 'Operating Systems' },
    },
  ];

  return {
    prisma: {
      curriculum: {
        findUnique: vi.fn(({ where }) => (where.id === 1 ? first : second)),
      },
      curriculumDiscipline: {
        findMany: vi.fn(({ where }) =>
          disciplines.filter((discipline) => discipline.curriculumId === where.curriculumId),
        ),
      },
    },
  };
});

import { comparisonService } from '../modules/comparison/comparison.service';

describe('comparison service', () => {
  it('detects common, unique and changed disciplines', async () => {
    const result = await comparisonService.compare(1, 2);

    expect(result.summary.commonCount).toBe(1);
    expect(result.onlyInFirst.map((item) => item.name)).toEqual(['Databases']);
    expect(result.onlyInSecond.map((item) => item.name)).toEqual(['Operating Systems']);
    expect(result.commonDisciplines[0].differences.map((item) => item.field)).toEqual([
      'semesterNumber',
      'totalHours',
      'credits',
    ]);
  });
});
