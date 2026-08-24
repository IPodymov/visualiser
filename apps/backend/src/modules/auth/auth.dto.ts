import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(12).max(128),
      fullName: z.string().trim().min(1).max(120).optional(),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(1).max(128),
    })
    .strict(),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];
