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
      totalHours: item.totalHours,
      credits: item.credits,
      lectureHours: item.lectureHours,
      practiceHours: item.practiceHours,
      labHours: item.labHours,
      classifications: item.discipline.classifications.map((classification: VisualizationClassification) => ({
        groupCode: classification.classificationValue.group.code,
        groupName: classification.classificationValue.group.name,
        valueCode: classification.classificationValue.code,
        valueName: classification.classificationValue.name,
        weight: classification.weight,
      })),
    };
  }
}

export const curriculaService = new CurriculaService();
