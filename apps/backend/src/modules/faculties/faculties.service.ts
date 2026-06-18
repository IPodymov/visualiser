import { prisma } from '../../config/prisma';

export class FacultiesService {
  list(query?: { admissionYear?: number }) {
    return prisma.faculty.findMany({
      where: {
        curricula: {
          some: {
            admissionYear: query?.admissionYear,
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
