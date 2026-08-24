const normalizeEducationLevel = (level: string) =>
  level.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ');

export const getEducationLevelKey = (level: string) => {
  const normalized = normalizeEducationLevel(level);

  if (normalized.includes('бакалавр')) return 'bachelor';
  if (normalized.includes('магистр')) return 'master';
  if (normalized.includes('специал')) return 'specialist';
  if (normalized.includes('аспиран')) return 'postgraduate';

  return normalized;
};

export const areEducationLevelsCompatible = (first: string, second: string) =>
  getEducationLevelKey(first) === getEducationLevelKey(second);
