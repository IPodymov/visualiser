import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma', () => {
  const first = {
    id: 1,
    educationLevel: 'Бакалавриат',
    speciality: { id: 1, code: '09.03.04', name: 'Software Engineering' },
  };
  const second = {
    id: 2,
    educationLevel: 'Бакалавриат',
    speciality: { id: 2, code: '09.03.01', name: 'Computer Science' },
  };
  const master = {
    id: 3,
    educationLevel: 'Магистратура',
    speciality: { id: 3, code: '09.04.01', name: 'Computer Science' },
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
        findUnique: vi.fn(({ where }) =>
          where.id === 1 ? first : where.id === 2 ? second : master,
        ),
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
import { prisma } from '../config/prisma';

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

  it('rejects curricula from different education levels', async () => {
    await expect(comparisonService.compare(1, 3)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Для сравнения выберите программы одного уровня образования',
    });
  });

  it('rejects selecting the same curriculum twice', async () => {
    await expect(comparisonService.compare(1, 1)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Choose two different curricula',
    });
  });

  it('rejects a pair when either curriculum is missing', async () => {
    vi.mocked(prisma.curriculum.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        educationLevel: 'Бакалавриат',
        speciality: { id: 2, code: '09.03.01', name: 'Computer Science' },
      } as never);

    await expect(comparisonService.compare(10, 2)).rejects.toMatchObject({
      statusCode: 404,
      message: 'One of curricula was not found',
    });
  });

  it.each([
    ['09.04.01', 'master'],
    ['10.05.01', 'specialist'],
    ['09.06.01', 'postgraduate'],
    ['09.03.01', 'bachelor'],
  ])('infers compatible levels from speciality code %s (%s)', async (code) => {
    const curriculum = (id: number) => ({
      id,
      educationLevel: null,
      speciality: { id, code, name: 'Program' },
    });
    vi.mocked(prisma.curriculum.findUnique)
      .mockResolvedValueOnce(curriculum(20) as never)
      .mockResolvedValueOnce(curriculum(21) as never);
    vi.mocked(prisma.curriculumDiscipline.findMany).mockResolvedValue([]);

    await expect(comparisonService.compare(20, 21)).resolves.toMatchObject({
      summary: { commonCount: 0, onlyFirstCount: 0, onlySecondCount: 0 },
    });
  });

  it.each(['Специалитет', 'Аспирантура', 'Докторантура'])(
    'accepts equal normalized explicit level %s',
    async (educationLevel) => {
      const curriculum = (id: number) => ({
        id,
        educationLevel,
        speciality: { id, code: 'custom', name: 'Program' },
      });
      vi.mocked(prisma.curriculum.findUnique)
        .mockResolvedValueOnce(curriculum(30) as never)
        .mockResolvedValueOnce(curriculum(31) as never);
      vi.mocked(prisma.curriculumDiscipline.findMany).mockResolvedValue([]);

      await expect(comparisonService.compare(30, 31)).resolves.toBeDefined();
    },
  );

  it('rejects curricula without a detectable education level', async () => {
    const curriculum = (id: number) => ({
      id,
      educationLevel: null,
      speciality: { id, code: 'custom', name: 'Program' },
    });
    vi.mocked(prisma.curriculum.findUnique)
      .mockResolvedValueOnce(curriculum(40) as never)
      .mockResolvedValueOnce(curriculum(41) as never);
    vi.mocked(prisma.curriculumDiscipline.findMany).mockResolvedValue([]);

    await expect(comparisonService.compare(40, 41)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('reports every source-backed workload difference', async () => {
    const curriculum = (id: number) => ({
      id,
      educationLevel: 'Бакалавриат',
      speciality: { id, code: '09.03.01', name: 'Program' },
    });
    const discipline = (curriculumId: number, overrides: Record<string, unknown>) => ({
      id: curriculumId,
      curriculumId,
      disciplineId: 1,
      externalDisciplineCode: null,
      semesterNumber: 1,
      controlForm: 'Экзамен',
      blockName: null,
      partName: null,
      moduleName: null,
      recordType: null,
      totalHours: 144,
      credits: 4,
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
      independentHours: 72,
      discipline: { id: 1, name: '  Algorithms  ' },
      ...overrides,
    });
    vi.mocked(prisma.curriculum.findUnique)
      .mockResolvedValueOnce(curriculum(50) as never)
      .mockResolvedValueOnce(curriculum(51) as never);
    vi.mocked(prisma.curriculumDiscipline.findMany)
      .mockResolvedValueOnce([discipline(50, {})] as never)
      .mockResolvedValueOnce([
        discipline(51, {
          controlForm: 'Зачёт',
          lectureHours: 35,
          practiceHours: 17,
          labHours: 16,
          independentHours: null,
        }),
      ] as never);

    const result = await comparisonService.compare(50, 51);
    expect(result.commonDisciplines[0].differences.map((item) => item.field)).toEqual([
      'controlForm',
      'lectureHours',
      'practiceHours',
      'labHours',
      'independentHours',
    ]);
  });
});
