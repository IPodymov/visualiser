import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';

export class ProfileService {
  async favorites(userId: number) {
    return prisma.favoriteCurriculum.findMany({
      where: { userId },
      include: { curriculum: { include: { speciality: true } } },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addFavorite(userId: number, curriculumId: number) {
    const curriculum = await prisma.curriculum.findUnique({ where: { id: curriculumId } });
    if (!curriculum) throw new AppError(404, 'Curriculum not found');

    return prisma.favoriteCurriculum.upsert({
      where: { userId_curriculumId: { userId, curriculumId } },
      create: { userId, curriculumId },
      update: {},
    });
  }

  async removeFavorite(userId: number, curriculumId: number) {
    await prisma.favoriteCurriculum.deleteMany({ where: { userId, curriculumId } });
    return { deleted: true };
  }

  history(userId: number) {
    return prisma.viewHistory.findMany({
      where: { userId },
      include: { curriculum: { include: { speciality: true } } },
      orderBy: { viewedAt: 'desc' },
      take: 100,
    });
  }
}

export const profileService = new ProfileService();
