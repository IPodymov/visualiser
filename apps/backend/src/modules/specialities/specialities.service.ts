import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';

export class SpecialitiesService {
  list() {
    return prisma.speciality.findMany({ orderBy: [{ code: 'asc' }, { name: 'asc' }] });
  }

  async getById(id: number) {
    const speciality = await prisma.speciality.findUnique({
      where: { id },
      include: { curricula: true },
    });
    if (!speciality) throw new AppError(404, 'Speciality not found');
    return speciality;
  }
}

export const specialitiesService = new SpecialitiesService();
