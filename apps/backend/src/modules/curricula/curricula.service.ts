import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';
import { importFitCurricula } from './fit-importer.service';
import type { ListCurriculaQuery } from './curricula.dto';
import { curriculumValidatorService } from './curriculum-validator.service';

const curriculumInclude = {
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

const decimalToNumber = (value: VisualizationDiscipline['credits']) => (value === null ? 0 : Number(value));

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

export class CurriculaService {
  async list(query: ListCurriculaQuery) {
    const where: CurriculumWhere = {
      admissionYear: query.admissionYear,
      speciality: {
        code: query.specialityCode ? { contains: query.specialityCode, mode: 'insensitive' } : undefined,
        name: query.specialityName
          ? { contains: query.specialityName, mode: 'insensitive' }
          : undefined,
      },
    };

    return prisma.curriculum.findMany({
      where,
      include: { speciality: true },
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
      classifications: item.discipline.classifications.map((classification: VisualizationClassification) => ({
        groupCode: classification.classificationValue.group.code,
        groupName: classification.classificationValue.group.name,
        valueCode: classification.classificationValue.code,
        valueName: classification.classificationValue.name,
        weight: classification.weight,
      })),
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

      for (const form of item.controlForm?.split(',').map((value) => value.trim()).filter(Boolean) ?? []) {
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
      bySemester: [...bySemester.values()].sort((left, right) => Number(left.key) - Number(right.key)),
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
