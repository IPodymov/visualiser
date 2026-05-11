import { z } from 'zod';

export const uploadedFileSchema = z.object({
  fileName: z.string(),
  path: z.string(),
});
