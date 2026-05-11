import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';

const selectPublicUser = {
  id: true,
  email: true,
  fullName: true,
  createdAt: true,
  updatedAt: true,
};

export class UsersService {
  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id }, select: selectPublicUser });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }
}

export const usersService = new UsersService();
