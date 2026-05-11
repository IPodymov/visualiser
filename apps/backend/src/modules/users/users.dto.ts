import { z } from 'zod';

export const userIdSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});
