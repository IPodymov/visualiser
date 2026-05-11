import { z } from 'zod';

export const comparisonSchema = z.object({
  query: z.object({
    firstCurriculumId: z.coerce.number().int().positive(),
    secondCurriculumId: z.coerce.number().int().positive(),
  }),
});

export type ComparisonQuery = z.infer<typeof comparisonSchema>['query'];
