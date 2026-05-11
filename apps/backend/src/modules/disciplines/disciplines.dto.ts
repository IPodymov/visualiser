import { z } from 'zod';

export const disciplineIdSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});
