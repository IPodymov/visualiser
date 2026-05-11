import { z } from 'zod';

export const specialityIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
