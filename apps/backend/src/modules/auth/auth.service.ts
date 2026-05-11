import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';
import { signAccessToken } from '../../shared/jwt';
import { hashPassword, verifyPassword } from '../../shared/password';
import type { LoginDto, RegisterDto } from './auth.dto';

const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  createdAt: true,
  updatedAt: true,
};

export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new AppError(409, 'User with this email already exists');
    }

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: await hashPassword(dto.password),
      },
      select: publicUserSelect,
    });

    return {
      user,
      accessToken: signAccessToken({ userId: user.id, email: user.email }),
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: signAccessToken({ userId: user.id, email: user.email }),
    };
  }

  async me(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
