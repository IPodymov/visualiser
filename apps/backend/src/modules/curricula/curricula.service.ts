import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';
import { importFitCurricula } from './fit-importer.service';
import type { CurriculumRecommendationRequest, ListCurriculaQuery } from './curricula.dto';
import { curriculumValidatorService } from './curriculum-validator.service';
import {
  defaultFaculty,
  defaultStudyForm,
  educationLevelLabels,
  recommendationCategoryLabels,
  recommendationCategoryTokens,
  sourceFacultyMarkers,
  type RecommendationCategory,
  studyFormLabels,
} from './recommendation.config';

const curriculumInclude = {
  faculty: true,
  speciality: true,
  disciplines: {
    include: {
      discipline: {
        include: {
          classifications: {
            include: {
              classificationValue: {
                include: { group: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ semesterNumber: 'asc' as const }, { discipline: { name: 'asc' as const } }],
  },
};

const loadVisualizationCurriculum = (id: number) =>
  prisma.curriculum.findUnique({
    where: { id },
    include: curriculumInclude,
  });

type CurriculumWhere = NonNullable<Parameters<typeof prisma.curriculum.findMany>[0]>['where'];
type VisualizationCurriculum = NonNullable<Awaited<ReturnType<typeof loadVisualizationCurriculum>>>;
type VisualizationDiscipline = VisualizationCurriculum['disciplines'][number];
type VisualizationClassification = VisualizationDiscipline['discipline']['classifications'][number];

const decimalToNumber = (value: VisualizationDiscipline['credits']) =>
  value === null ? 0 : Number(value);

const loadRecommendationCurricula = () =>
  prisma.curriculum.findMany({
    include: curriculumInclude,
    orderBy: [{ admissionYear: 'desc' }, { uploadedAt: 'desc' }],
  });

type RecommendationCurriculum = Awaited<ReturnType<typeof loadRecommendationCurricula>>[number];

type ChartBucket = {
  key: string;
  label: string;
  disciplinesCount: number;
  totalHours: number;
  credits: number;
  lectureHours: number;
  practiceHours: number;
  labHours: number;
  independentHours: number;
};

const emptyBucket = (key: string, label: string): ChartBucket => ({
  key,
  label,
  disciplinesCount: 0,
  totalHours: 0,
  credits: 0,
  lectureHours: 0,
  practiceHours: 0,
  labHours: 0,
  independentHours: 0,
});

const addToBucket = (bucket: ChartBucket, item: VisualizationDiscipline) => {
  bucket.disciplinesCount += 1;
  bucket.totalHours += item.totalHours ?? 0;
  bucket.credits = Math.round((bucket.credits + decimalToNumber(item.credits)) * 100) / 100;
  bucket.lectureHours += item.lectureHours ?? 0;
  bucket.practiceHours += item.practiceHours ?? 0;
  bucket.labHours += item.labHours ?? 0;
  bucket.independentHours += item.independentHours ?? 0;
};

const normalize = (value: string) => value.toLowerCase().replace(/ё/g, 'е');

const inferEducationLevel = (curriculum: RecommendationCurriculum) => {
  const explicitLevel = curriculum.educationLevel?.trim();
  if (explicitLevel) return explicitLevel;
  const code = curriculum.speciality.code;
  if (code.includes('.04.')) return educationLevelLabels.master;
  if (code.includes('.05.')) return educationLevelLabels.specialist;
  return educationLevelLabels.bachelor;
};

const getDuration = (curriculum: RecommendationCurriculum) => {
  const semesters = new Set(
    curriculum.disciplines.map((item) => item.semesterNumber).filter(Boolean),
  ).size;
  if (semesters > 4) return '4 года';
  if (semesters > 0) return '2 года';
  return 'не указана';
};

const facultyFromSource = (source?: string) => {
  if (!source) return defaultFaculty;
  if (source.includes('/'))
    return source.split('/').find((part) => part.includes('Ф')) ?? defaultFaculty;
  const facultyMarker = sourceFacultyMarkers.find((marker) => source.includes(marker));
  if (facultyMarker) return facultyMarker;
  return defaultFaculty;
};

const getTopCategories = (weights: CurriculumRecommendationRequest['weights']) =>
  (Object.entries(weights) as Array<[RecommendationCategory, number]>)
    .sort((first, second) => second[1] - first[1])
    .filter(([, value]) => value > 0)
    .slice(0, 3)
    .map(([category]) => category);

const matchesEducationLevel = (
  curriculum: RecommendationCurriculum,
  educationLevel?: CurriculumRecommendationRequest['educationLevel'],
) => {
  if (!educationLevel) return true;
  return normalize(inferEducationLevel(curriculum)).includes(
    normalize(educationLevelLabels[educationLevel]),
  );
};

const matchesStudyForm = (
  curriculum: RecommendationCurriculum,
  studyForm?: CurriculumRecommendationRequest['studyForm'],
) => {
  if (!studyForm) return true;
  return normalize(curriculum.educationForm ?? '') === normalize(studyFormLabels[studyForm]);
};

const getDisciplineSearchText = (item: RecommendationCurriculum['disciplines'][number]) =>
  normalize(
    [
      item.discipline.name,
      item.blockName,
      item.partName,
      item.moduleName,
      item.recordType,
      item.discipline.classifications
        .map((classification) =>
          [
            classification.classificationValue.group.code,
            classification.classificationValue.group.name,
            classification.classificationValue.code,
            classification.classificationValue.name,
          ].join(' '),
        )
        .join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  );

export class CurriculaService {
  async list(query: ListCurriculaQuery) {
    const where: CurriculumWhere = {
      admissionYear: query.admissionYear,
      facultyId: query.facultyId,
      speciality: {
        code: query.specialityCode
          ? { contains: query.specialityCode, mode: 'insensitive' }
          : undefined,
        name: query.specialityName
          ? { contains: query.specialityName, mode: 'insensitive' }
          : undefined,
      },
    };

    return prisma.curriculum.findMany({
      where,
      include: {
        faculty: true,
        speciality: true,
        disciplines: {
          select: {
            id: true,
            disciplineId: true,
            semesterNumber: true,
            totalHours: true,
            credits: true,
            discipline: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ admissionYear: 'desc' }, { uploadedAt: 'desc' }],
    });
  }

  async getById(id: number, userId?: number) {
    const curriculum = await loadVisualizationCurriculum(id);

    if (!curriculum) {
      throw new AppError(404, 'Curriculum not found');
    }

    if (userId) {
      await prisma.viewHistory.create({ data: { userId, curriculumId: id } });
    }

    return this.toVisualizationDto(curriculum);
  }

  async getDisciplines(id: number) {
    await this.ensureExists(id);
    return prisma.curriculumDiscipline.findMany({
      where: { curriculumId: id },
      include: {
        discipline: {
          include: {
            classifications: {
              include: { classificationValue: { include: { group: true } } },
            },
          },
        },
      },
      orderBy: [{ semesterNumber: 'asc' }, { discipline: { name: 'asc' } }],
    });
  }

  async recommend(request: CurriculumRecommendationRequest) {
    const curricula = await loadRecommendationCurricula();
    const topCategories = getTopCategories(request.weights);
    const strictMatchedCurricula = curricula.filter(
      (curriculum) =>
        matchesEducationLevel(curriculum, request.educationLevel) &&
        matchesStudyForm(curriculum, request.studyForm),
    );
    const levelMatchedCurricula = curricula.filter((curriculum) =>
      matchesEducationLevel(curriculum, request.educationLevel),
    );
    const formMatchedCurricula = curricula.filter((curriculum) =>
      matchesStudyForm(curriculum, request.studyForm),
    );
    const candidates = strictMatchedCurricula.length
      ? strictMatchedCurricula
      : levelMatchedCurricula.length
        ? levelMatchedCurricula
        : formMatchedCurricula.length
          ? formMatchedCurricula
          : curricula;

    const ranked = candidates
      .map((curriculum) => {
        const matchedDisciplines = curriculum.disciplines
          .map((item) => {
            const searchText = getDisciplineSearchText(item);
            const score = topCategories.reduce((sum, category) => {
              const hasMatch = recommendationCategoryTokens[category].some((token) =>
                searchText.includes(normalize(token)),
              );
              const hours = Math.max(item.totalHours ?? 0, 36);
              const classificationBoost = item.discipline.classifications.length ? 1.35 : 1;
              return hasMatch
                ? sum + (request.weights[category] ?? 0) * classificationBoost * Math.log2(hours)
                : sum;
            }, 0);

            return {
              name: item.discipline.name,
              score,
            };
          })
          .filter((item) => item.score > 0)
          .sort((first, second) => second.score - first.score);

        const titleSearchText = normalize(
          [
            curriculum.profileName,
            curriculum.speciality.name,
            curriculum.speciality.code,
            curriculum.sourceFileName,
          ]
            .filter(Boolean)
            .join(' '),
        );
        const titleScore = topCategories.reduce((sum, category) => {
          const hasMatch = recommendationCategoryTokens[category].some((token) =>
            titleSearchText.includes(normalize(token)),
          );
          return hasMatch ? sum + (request.weights[category] ?? 0) * 5 : sum;
        }, 0);
        const workloadScore =
          Math.min(curriculum.disciplines.length, 12) +
          Math.min(
            curriculum.disciplines.reduce((sum, item) => sum + decimalToNumber(item.credits), 0) /
              12,
            10,
          );
        const levelScore = matchesEducationLevel(curriculum, request.educationLevel) ? 30 : 0;
        const studyFormScore = matchesStudyForm(curriculum, request.studyForm) ? 12 : 0;

        return {
          curriculum,
          matchedDisciplines,
          score:
            matchedDisciplines.reduce((sum, item) => sum + item.score, 0) +
            titleScore +
            workloadScore +
            levelScore +
            studyFormScore,
        };
      })
      .sort((first, second) => second.score - first.score)
      .slice(0, request.limit ?? 8);

    const maxScore = Math.max(ranked[0]?.score ?? 1, 1);
    const reason = topCategories.length
      ? `Подходит под ${topCategories
          .map((category) => recommendationCategoryLabels[category])
          .join(', ')}`
      : 'Подходит под выбранные параметры поступления';

    return ranked.map(({ curriculum, matchedDisciplines, score }) => {
      const disciplinesCount = curriculum.disciplines.length;
      const totalHours = curriculum.disciplines.reduce(
        (sum, item) => sum + (item.totalHours ?? 0),
        0,
      );
      const credits = Math.round(
        curriculum.disciplines.reduce((sum, item) => sum + decimalToNumber(item.credits), 0),
      );
      const title = curriculum.profileName || curriculum.speciality.name;

      return {
        planId: curriculum.id,
        title,
        faculty: curriculum.faculty?.name ?? facultyFromSource(curriculum.sourceFilePath),
        level: inferEducationLevel(curriculum),
        studyForm: curriculum.educationForm ?? defaultStudyForm,
        year: curriculum.admissionYear ?? new Date(curriculum.uploadedAt).getFullYear(),
        duration: getDuration(curriculum),
        disciplinesCount,
        totalHours,
        credits,
        matchPercent: Math.max(62, Math.min(98, Math.round((score / maxScore) * 96))),
        reason,
        matchedDisciplines: matchedDisciplines.slice(0, 4).map((item) => item.name),
      };
    });
  }

  async importFit() {
    return importFitCurricula();
  }

  async validate(id: number) {
    const curriculum = await prisma.curriculum.findUnique({
      where: { id },
      include: {
        speciality: true,
        disciplines: {
          include: { discipline: true },
          orderBy: [{ semesterNumber: 'asc' }, { discipline: { name: 'asc' } }],
        },
      },
    });

    if (!curriculum) {
      throw new AppError(404, 'Curriculum not found');
    }

    return {
      curriculumId: id,
      sourceFileName: curriculum.sourceFileName,
      validation: curriculumValidatorService.validateStored(curriculum),
    };
  }

  async ensureExists(id: number) {
    const curriculum = await prisma.curriculum.findUnique({ where: { id } });
    if (!curriculum) {
      throw new AppError(404, 'Curriculum not found');
    }
    return curriculum;
  }

  private toVisualizationDto(curriculum: VisualizationCurriculum) {
    const semesters = new Map<number, Array<ReturnType<typeof this.toDisciplineDto>>>();

    for (const item of curriculum.disciplines) {
      const semester = item.semesterNumber ?? 0;
      const disciplineDto = this.toDisciplineDto(item);
      semesters.set(semester, [...(semesters.get(semester) ?? []), disciplineDto]);
    }

    return {
      ...curriculum,
      semesters: [...semesters.entries()]
        .sort(([left], [right]) => left - right)
        .map(([number, disciplines]) => ({ number: number || null, disciplines })),
      visualization: this.toChartMarkup(curriculum.disciplines),
    };
  }

  private toDisciplineDto(item: VisualizationDiscipline) {
    return {
      curriculumDisciplineId: item.id,
      disciplineId: item.disciplineId,
      name: item.discipline.name,
      externalDisciplineCode: item.externalDisciplineCode,
      semesterNumber: item.semesterNumber,
      controlForm: item.controlForm,
      blockName: item.blockName,
      partName: item.partName,
      moduleName: item.moduleName,
      recordType: item.recordType,
      totalHours: item.totalHours,
      credits: item.credits,
      lectureHours: item.lectureHours,
      practiceHours: item.practiceHours,
      labHours: item.labHours,
      independentHours: item.independentHours,
      classifications: item.discipline.classifications.map(
        (classification: VisualizationClassification) => ({
          groupCode: classification.classificationValue.group.code,
          groupName: classification.classificationValue.group.name,
          valueCode: classification.classificationValue.code,
          valueName: classification.classificationValue.name,
          weight: classification.weight,
        }),
      ),
    };
  }

  private toChartMarkup(disciplines: VisualizationDiscipline[]) {
    const bySemester = new Map<string, ChartBucket>();
    const byBlock = new Map<string, ChartBucket>();
    const byPart = new Map<string, ChartBucket>();
    const controlForms = new Map<string, number>();

    const total = emptyBucket('total', 'Всего');

    for (const item of disciplines) {
      addToBucket(total, item);

      const semesterKey = item.semesterNumber ? String(item.semesterNumber) : 'unknown';
      const semesterLabel = item.semesterNumber ? `${item.semesterNumber} семестр` : 'Без семестра';
      const semesterBucket = bySemester.get(semesterKey) ?? emptyBucket(semesterKey, semesterLabel);
      addToBucket(semesterBucket, item);
      bySemester.set(semesterKey, semesterBucket);

      const blockKey = item.blockName ?? 'Без блока';
      const blockBucket = byBlock.get(blockKey) ?? emptyBucket(blockKey, blockKey);
      addToBucket(blockBucket, item);
      byBlock.set(blockKey, blockBucket);

      const partKey = item.partName ?? item.recordType ?? 'Без части';
      const partBucket = byPart.get(partKey) ?? emptyBucket(partKey, partKey);
      addToBucket(partBucket, item);
      byPart.set(partKey, partBucket);

      for (const form of item.controlForm
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean) ?? []) {
        controlForms.set(form, (controlForms.get(form) ?? 0) + 1);
      }
    }

    return {
      totals: {
        disciplinesCount: total.disciplinesCount,
        totalHours: total.totalHours,
        credits: total.credits,
        lectureHours: total.lectureHours,
        practiceHours: total.practiceHours,
        labHours: total.labHours,
        independentHours: total.independentHours,
        contactHours: total.lectureHours + total.practiceHours + total.labHours,
      },
      bySemester: [...bySemester.values()].sort(
        (left, right) => Number(left.key) - Number(right.key),
      ),
      byBlock: [...byBlock.values()].sort((left, right) => right.totalHours - left.totalHours),
      byPart: [...byPart.values()].sort((left, right) => right.totalHours - left.totalHours),
      workload: [
        { key: 'lectureHours', label: 'Лекции', hours: total.lectureHours },
        { key: 'practiceHours', label: 'Практики и семинары', hours: total.practiceHours },
        { key: 'labHours', label: 'Лабораторные', hours: total.labHours },
        { key: 'independentHours', label: 'СРС', hours: total.independentHours },
      ],
      controlForms: [...controlForms.entries()]
        .map(([form, count]) => ({ form, count }))
        .sort((left, right) => right.count - left.count),
    };
  }
}

export const curriculaService = new CurriculaService();
