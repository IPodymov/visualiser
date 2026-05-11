import type { Prisma } from '@prisma/client';
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

export class CurriculaService {
  async list(query: ListCurriculaQuery) {
    const where: Prisma.CurriculumWhereInput = {
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
    const curriculum = await prisma.curriculum.findUnique({
      where: { id },
      include: curriculumInclude,
    });

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

  private toVisualizationDto(curriculum: Prisma.CurriculumGetPayload<{ include: typeof curriculumInclude }>) {
    const semesters = new Map<number, unknown[]>();

    for (const item of curriculum.disciplines) {
      const semester = item.semesterNumber ?? 0;
      const disciplineDto = {
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
        classifications: item.discipline.classifications.map((classification) => ({
          groupCode: classification.classificationValue.group.code,
          groupName: classification.classificationValue.group.name,
          valueCode: classification.classificationValue.code,
          valueName: classification.classificationValue.name,
          weight: classification.weight,
        })),
      };
      semesters.set(semester, [...(semesters.get(semester) ?? []), disciplineDto]);
    }

    return {
      ...curriculum,
      semesters: [...semesters.entries()]
        .sort(([left], [right]) => left - right)
        .map(([number, disciplines]) => ({ number: number || null, disciplines })),
    };
  }
}

export const curriculaService = new CurriculaService();
