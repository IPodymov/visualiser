import { prisma } from '../../config/prisma';

// The catalog shows only the latest admission year; earlier years are kept as
// archived versions that are reachable from the current plan's year comparison.
export const getCatalogYear = async () => {
  const result = await prisma.curriculum.aggregate({ _max: { admissionYear: true } });
  return result._max.admissionYear ?? undefined;
};
