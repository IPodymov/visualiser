import { useCallback, useEffect, useState } from 'react';
import { yearComparisonApi } from '../api/yearComparison';
import type { YearComparison } from './types';

export const useYearComparison = (planId: number | null) => {
  const [data, setData] = useState<YearComparison | null>(null);
  const [loading, setLoading] = useState(Boolean(planId));
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!planId) return;
    let active = true;
    setLoading(true);
    setError(null);
    yearComparisonApi
      .load(planId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setData(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось сравнить план с прошлым годом',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [planId, retryKey]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  return { data, loading, error, retry };
};
