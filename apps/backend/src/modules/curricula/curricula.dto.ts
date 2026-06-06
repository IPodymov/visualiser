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

export const recommendationCategorySchema = z.enum([
  'software',
  'web',
  'data',
  'ai',
  'security',
  'systems',
  'robotics',
  'embedded',
  'gamedev',
  'xr',
  'mediaDesign',
  'businessIt',
  'management',
  'engineering',
  'math',
  'research',
]);

export const recommendationSchema = z.object({
  body: z.object({
    educationLevel: z.enum(['bachelor', 'specialist', 'master', 'postgraduate']).optional(),
    studyForm: z.enum(['fullTime', 'partTime', 'evening']).optional(),
    limit: z.coerce.number().int().min(1).max(12).optional(),
    weights: z
      .record(recommendationCategorySchema, z.coerce.number().min(0).max(100))
      .refine((weights) => Object.values(weights).some((value) => value > 0), {
        message: 'At least one category weight must be greater than zero',
      }),
  }),
});

export type ListCurriculaQuery = z.infer<typeof listCurriculaSchema>['query'];
export type CurriculumRecommendationRequest = z.infer<typeof recommendationSchema>['body'];
