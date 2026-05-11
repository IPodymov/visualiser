import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';

export class DisciplinesService {
  list() {
    return prisma.discipline.findMany({
      include: { classifications: { include: { classificationValue: { include: { group: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number) {
    const discipline = await prisma.discipline.findUnique({
      where: { id },
      include: { classifications: { include: { classificationValue: { include: { group: true } } } } },
    });
    if (!discipline) throw new AppError(404, 'Discipline not found');
    return discipline;
  }
}

export const disciplinesService = new DisciplinesService();
