import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';

const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

const mapItem = (item: Awaited<ReturnType<typeof loadDisciplines>>[number]) => ({
  curriculumDisciplineId: item.id,
  disciplineId: item.disciplineId,
  name: item.discipline.name,
  externalDisciplineCode: item.externalDisciplineCode,
  semesterNumber: item.semesterNumber,
  controlForm: item.controlForm,
  totalHours: item.totalHours,
  credits: item.credits,
  lectureHours: item.lectureHours,
  practiceHours: item.practiceHours,
  labHours: item.labHours,
});

const loadDisciplines = (curriculumId: number) =>
  prisma.curriculumDiscipline.findMany({
    where: { curriculumId },
    include: { discipline: true },
    orderBy: [{ semesterNumber: 'asc' }, { discipline: { name: 'asc' } }],
  });

type LoadedDiscipline = Awaited<ReturnType<typeof loadDisciplines>>[number];

export class ComparisonService {
  async compare(firstCurriculumId: number, secondCurriculumId: number) {
    if (firstCurriculumId === secondCurriculumId) {
      throw new AppError(400, 'Choose two different curricula');
    }

    const [first, second, firstDisciplines, secondDisciplines] = await Promise.all([
      prisma.curriculum.findUnique({
        where: { id: firstCurriculumId },
        include: { speciality: true },
      }),
      prisma.curriculum.findUnique({
        where: { id: secondCurriculumId },
        include: { speciality: true },
      }),
      loadDisciplines(firstCurriculumId),
      loadDisciplines(secondCurriculumId),
    ]);

    if (!first || !second) {
      throw new AppError(404, 'One of curricula was not found');
    }

    const firstMap = new Map<string, LoadedDiscipline>(
      firstDisciplines.map((item: LoadedDiscipline) => [normalizeName(item.discipline.name), item]),
    );
    const secondMap = new Map<string, LoadedDiscipline>(
      secondDisciplines.map((item: LoadedDiscipline) => [normalizeName(item.discipline.name), item]),
    );

    const common = [...firstMap.entries()]
      .filter(([key]) => secondMap.has(key))
      .map(([, firstItem]) => {
        const secondItem = secondMap.get(normalizeName(firstItem.discipline.name))!;
        const differences = this.getDifferences(firstItem, secondItem);
        return {
          name: firstItem.discipline.name,
          first: mapItem(firstItem),
          second: mapItem(secondItem),
          differences,
        };
      });

    return {
      firstCurriculum: first,
      secondCurriculum: second,
      summary: {
        firstDisciplinesCount: firstDisciplines.length,
        secondDisciplinesCount: secondDisciplines.length,
        commonCount: common.length,
        onlyFirstCount: [...firstMap.keys()].filter((key) => !secondMap.has(key)).length,
        onlySecondCount: [...secondMap.keys()].filter((key) => !firstMap.has(key)).length,
      },
      commonDisciplines: common,
      onlyInFirst: [...firstMap.entries()]
        .filter(([key]) => !secondMap.has(key))
        .map(([, item]) => mapItem(item)),
      onlyInSecond: [...secondMap.entries()]
        .filter(([key]) => !firstMap.has(key))
        .map(([, item]) => mapItem(item)),
    };
  }

  private getDifferences(
    first: Awaited<ReturnType<typeof loadDisciplines>>[number],
    second: Awaited<ReturnType<typeof loadDisciplines>>[number],
  ) {
    const fields = [
      'semesterNumber',
      'controlForm',
      'totalHours',
      'credits',
      'lectureHours',
      'practiceHours',
      'labHours',
    ] as const;

    return fields
      .filter((field) => String(first[field] ?? '') !== String(second[field] ?? ''))
      .map((field) => ({
        field,
        firstValue: first[field],
        secondValue: second[field],
      }));
  }
}

export const comparisonService = new ComparisonService();
