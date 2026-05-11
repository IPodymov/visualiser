import { z } from 'zod';

export const listCurriculaSchema = z.object({
  query: z.object({
    specialityName: z.string().optional(),
    specialityCode: z.string().optional(),
    admissionYear: z.coerce.number().int().optional(),
  }),
});

export const curriculumIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export type ListCurriculaQuery = z.infer<typeof listCurriculaSchema>['query'];
