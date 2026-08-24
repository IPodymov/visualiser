import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { plan } from './fixtures';

const api = vi.hoisted(() => ({
  listPlans: vi.fn(),
  listFaculties: vi.fn(),
}));

vi.mock('../services/api/plans', () => ({ plansApi: { list: api.listPlans } }));
vi.mock('../services/api/faculties', () => ({ facultiesApi: { list: api.listFaculties } }));

import { usePlans } from '../hooks/usePlans';

const plans = [
  plan({
    id: 1,
    title: 'Интеллектуальные системы',
    direction: 'Программная инженерия',
    profile: 'Искусственный интеллект',
    facultyId: 1,
    faculty: 'ФИТ',
    level: 'Бакалавриат',
    studyForm: 'Очная',
    year: 2025,
    code: '09.03.04',
  }),
  plan({
    id: 2,
    title: 'Управление данными',
    direction: 'Информатика',
    profile: undefined,
    facultyId: 2,
    faculty: 'ФЭиУ',
    level: 'Магистратура',
    studyForm: 'Заочная',
    year: 2024,
    code: undefined,
  }),
];

beforeEach(() => {
  vi.resetAllMocks();
  api.listPlans.mockResolvedValue(plans);
  api.listFaculties.mockResolvedValue([
    { id: 1, name: 'ФИТ', slug: 'fit' },
    { id: 2, name: 'ФЭиУ', slug: 'feiu' },
  ]);
});

describe('usePlans', () => {
  it('loads plans and faculties and applies every catalog filter', async () => {
    const { result } = renderHook(() => usePlans());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.plans).toEqual(plans);
    expect(result.current.filteredPlans).toEqual(plans);
    expect(result.current.filterConfig[0].options).toHaveLength(2);

    for (const query of ['интеллектуальные', 'программная', 'искусственный', 'фит', '09.03']) {
      act(() => result.current.setFilters({ ...result.current.filters, query }));
      expect(result.current.filteredPlans.map((item) => item.id)).toEqual([1]);
    }

    act(() => result.current.setFilters({ ...result.current.filters, query: 'отсутствует' }));
    expect(result.current.filteredPlans).toEqual([]);

    act(() =>
      result.current.setFilters({
        query: '',
        faculty: '2',
        direction: 'Информатика',
        profile: 'all',
        level: 'Магистратура',
        studyForm: 'Заочная',
        year: '2024',
      }),
    );
    expect(result.current.filteredPlans.map((item) => item.id)).toEqual([2]);

    for (const [key, value] of [
      ['faculty', '999'],
      ['direction', 'Другое'],
      ['profile', 'Другое'],
      ['level', 'Специалитет'],
      ['studyForm', 'Очно-заочная'],
      ['year', '2030'],
    ] as const) {
      act(() =>
        result.current.setFilters({
          query: '',
          faculty: 'all',
          direction: 'all',
          profile: 'all',
          level: 'all',
          studyForm: 'all',
          year: 'all',
          [key]: value,
        }),
      );
      expect(result.current.filteredPlans).toEqual([]);
    }
  });

  it('reloads with explicit filters', async () => {
    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const nextFilters = { ...result.current.filters, year: '2024' };

    await act(async () => result.current.reload(nextFilters));

    expect(api.listPlans).toHaveBeenLastCalledWith(nextFilters);
    expect(result.current.error).toBeNull();
  });

  it('shows Error messages and the generic fallback for unknown failures', async () => {
    api.listPlans.mockRejectedValueOnce(new Error('API недоступен'));
    let hook = renderHook(() => usePlans());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.error).toBe('API недоступен');
    hook.unmount();

    api.listPlans.mockRejectedValueOnce('unknown');
    hook = renderHook(() => usePlans());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.error).toContain('Не удалось загрузить учебные планы');
  });
});
