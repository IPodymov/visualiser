import { prisma } from '../../config/prisma';
import { getCatalogYear } from '../curricula/catalog-year';

export class FacultiesService {
  async list(query?: { admissionYear?: number }) {
    const admissionYear = query?.admissionYear ?? (await getCatalogYear());
    return prisma.faculty.findMany({
      where: {
        curricula: {
          some: {
            admissionYear,
          },
        },
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { curricula: true },
        },
      },
    });
  }
}

export const facultiesService = new FacultiesService();
