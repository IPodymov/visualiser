export const getCreditsNorm = (level: string) => {
  if (level === 'Специалитет') return 300;
  return 240;
};

export const getCreditsPercent = (credits: number, level: string) =>
  Math.min(100, Math.round((credits / getCreditsNorm(level)) * 100));

export const getCreditsSummary = (credits: number, level: string) =>
  `${getCreditsPercent(credits, level)}% нагрузки (${credits} ЗЕТ из ${getCreditsNorm(level)})`;
