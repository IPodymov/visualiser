import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { plan } from './fixtures';

const api = vi.hoisted(() => ({
  listPlans: vi.fn(),
  listFaculties: vi.fn(),
}));

vi.mock('@entities/plan/api/plans', () => ({ plansApi: { list: api.listPlans } }));
vi.mock('@entities/faculty/api/faculties', () => ({ facultiesApi: { list: api.listFaculties } }));

import { usePlans } from '@features/plan-catalog/model/usePlans';

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
  it('rebuilds available options by level and clears incompatible selections', async () => {
    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() =>
      result.current.setFilters({
        ...result.current.filters,
        faculty: '1',
        direction: 'Программная инженерия',
        profile: 'Искусственный интеллект',
        studyForm: 'Очная',
        level: 'Бакалавриат',
      }),
    );
    expect(result.current.filters.direction).toBe('Программная инженерия');

    act(() => result.current.setFilters({ ...result.current.filters, level: 'Магистратура' }));
    expect(result.current.filteredPlans).toEqual([plans[1]]);
    expect(result.current.filters).toMatchObject({
      faculty: 'all',
      direction: 'all',
      profile: 'all',
      studyForm: 'all',
    });
    const options = (key: string) =>
      result.current.filterConfig.find((item) => item.key === key)!.options;
    expect(options('direction')).toEqual([{ label: 'Информатика', value: 'Информатика' }]);
    expect(options('profile')).toEqual([]);
    expect(options('faculty')).toEqual([{ label: 'ФЭиУ', value: '2' }]);
    expect(options('level')).toHaveLength(2);

    act(() => result.current.setFilters({ ...result.current.filters, level: 'all' }));
    expect(result.current.filteredPlans).toEqual(plans);
    expect(options('direction')).toHaveLength(2);
  });

  it('keeps search and compatible selections when switching levels', async () => {
    api.listPlans.mockResolvedValue([
      plans[0],
      plan({ ...plans[0], id: 3, level: 'Магистратура' }),
    ]);
    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() =>
      result.current.setFilters({
        ...result.current.filters,
        query: 'Интеллектуальные',
        faculty: '1',
        direction: plans[0].direction,
        profile: plans[0].profile!,
        studyForm: 'Очная',
        level: 'Бакалавриат',
      }),
    );
    const previous = result.current.filters;
    act(() => result.current.setFilters({ ...previous, level: 'Магистратура' }));
    expect(result.current.filters).toEqual({ ...previous, level: 'Магистратура' });
    expect(result.current.filteredPlans.map((item) => item.id)).toEqual([3]);
  });

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
      }),
    );
    expect(result.current.filteredPlans.map((item) => item.id)).toEqual([2]);

    for (const [key, value] of [
      ['faculty', '999'],
      ['direction', 'Другое'],
      ['profile', 'Другое'],
      ['level', 'Специалитет'],
      ['studyForm', 'Очно-заочная'],
    ] as const) {
      act(() =>
        result.current.setFilters({
          query: '',
          faculty: 'all',
          direction: 'all',
          profile: 'all',
          level: 'all',
          studyForm: 'all',
          [key]: value,
        }),
      );
      expect(result.current.filteredPlans).toEqual([]);
    }
  });

  it('reloads with explicit filters', async () => {
    const { result } = renderHook(() => usePlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const nextFilters = { ...result.current.filters, faculty: '2' };

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
