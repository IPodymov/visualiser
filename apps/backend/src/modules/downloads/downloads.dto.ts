import { z } from 'zod';
import { comparisonSchema } from '../comparison/comparison.dto';

export const downloadCurriculumSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const downloadComparisonSchema = comparisonSchema;
