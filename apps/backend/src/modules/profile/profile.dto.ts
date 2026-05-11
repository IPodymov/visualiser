import { z } from 'zod';

export const favoriteParamsSchema = z.object({
  params: z.object({
    curriculumId: z.coerce.number().int().positive(),
  }),
});
