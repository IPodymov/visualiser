import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../services/api/client', () => ({ apiClient: api }));

import { authApi } from '../services/api/auth';
import { facultiesApi } from '../services/api/faculties';
import { plansApi } from '../services/api/plans';
import { profileApi } from '../services/api/profile';
import { backendCurriculum, backendDiscipline } from './fixtures';

const axiosError = (options: {
  status?: number;
  data?: unknown;
  code?: string;
  response?: boolean;
}) => ({
  isAxiosError: true,
  code: options.code,
  config: {},
  response:
    options.response === false
      ? undefined
      : { status: options.status ?? 500, data: options.data, headers: {}, config: {} },
  message: 'Request failed',
  name: 'AxiosError',
  toJSON: () => ({}),
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('plans API', () => {
  it('builds only valid backend list filters', async () => {
    api.get.mockResolvedValue({ data: [backendCurriculum()] });

    await plansApi.list({ faculty: '2' });
    expect(api.get).toHaveBeenLastCalledWith('/api/curricula', {
      params: { facultyId: 2 },
    });

    await plansApi.list({ faculty: 'all' });
    expect(api.get).toHaveBeenLastCalledWith('/api/curricula', { params: {} });

    await plansApi.list({ faculty: 'not-a-number' });
    expect(api.get).toHaveBeenLastCalledWith('/api/curricula', { params: {} });

    await plansApi.list();
    expect(api.get).toHaveBeenLastCalledWith('/api/curricula', { params: {} });
  });

  it('enriches missing metrics in bounded batches and keeps a list item when detail fails', async () => {
    const list = [
      backendCurriculum({ id: 1, disciplines: [backendDiscipline()] }),
      backendCurriculum({ id: 2, disciplines: undefined, semesters: [{ number: 1, disciplines: [backendDiscipline()] }] }),
      ...Array.from({ length: 5 }, (_, index) =>
        backendCurriculum({ id: index + 3, disciplines: [], semesters: [] }),
      ),
    ];
    api.get.mockImplementation(async (url: string) => {
      if (url === '/api/curricula') return { data: list };
      if (url === '/api/curricula/5') throw new Error('detail failed');
      const id = Number(url.split('/').pop());
      return { data: backendCurriculum({ id, disciplines: [backendDiscipline()] }) };
    });

    const result = await plansApi.list();

    expect(result).toHaveLength(7);
    expect(api.get).toHaveBeenCalledTimes(6);
    expect(result.find((item) => item.id === 5)?.disciplines).toEqual([]);
    expect(result.find((item) => item.id === 7)?.disciplines).toHaveLength(1);
  });

  it('loads one plan', async () => {
    api.get.mockResolvedValue({ data: backendCurriculum({ id: 9 }) });
    await expect(plansApi.getById(9)).resolves.toMatchObject({ id: 9 });
    expect(api.get).toHaveBeenCalledWith('/api/curricula/9');
  });

  it('maps comparison plans, common rows, differences and unique disciplines', async () => {
    const comparisonDiscipline = {
      curriculumDisciplineId: 11,
      disciplineId: 12,
      name: 'Алгоритмы',
      semesterNumber: null,
      totalHours: null,
      credits: '4,5',
      controlForm: 'Экзамен',
      moduleName: null,
      partName: 'Часть',
      blockName: 'Блок',
      recordType: 'Дисциплина',
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
      independentHours: 72,
    };
    api.get.mockImplementation(async (url: string) => {
      if (url === '/api/comparison') {
        return {
          data: {
            summary: { commonCount: 1, onlyFirstCount: 1, onlySecondCount: 1 },
            commonDisciplines: [
              {
                name: 'Алгоритмы',
                first: comparisonDiscipline,
                second: { ...comparisonDiscipline, curriculumDisciplineId: undefined, moduleName: 'Модуль' },
                differences: [{ field: 'semesterNumber', firstValue: 1, secondValue: 2 }],
              },
            ],
            onlyInFirst: [
              { ...comparisonDiscipline, curriculumDisciplineId: undefined, disciplineId: undefined, moduleName: null, partName: null },
            ],
            onlyInSecond: [
              { ...comparisonDiscipline, curriculumDisciplineId: undefined, disciplineId: 22, moduleName: null, partName: null, blockName: null },
            ],
          },
        };
      }
      return { data: backendCurriculum({ id: Number(url.split('/').pop()) }) };
    });

    const result = await plansApi.compare(1, 2);

    expect(result.firstPlan.id).toBe(1);
    expect(result.secondPlan.id).toBe(2);
    expect(result.commonDisciplines[0]).toMatchObject({
      name: 'Алгоритмы',
      first: { id: 11, module: 'Часть', semester: null, hours: 0, credits: 4.5 },
      second: { id: 12, module: 'Модуль' },
    });
    expect(result.onlyInFirst[0].module).toBe('Блок');
    expect(result.onlyInSecond[0].module).toBe('Без модуля');
  });

  it('posts recommendation weights unchanged', async () => {
    const payload = { educationLevel: 'bachelor' as const, weights: { ai: 100 }, limit: 3 };
    api.post.mockResolvedValue({ data: [{ planId: 1 }] });

    await expect(plansApi.recommend(payload)).resolves.toEqual([{ planId: 1 }]);
    expect(api.post).toHaveBeenCalledWith('/api/curricula/recommendations', payload);
  });

  it('turns network, backend, plain and unknown failures into useful errors', async () => {
    api.get.mockRejectedValueOnce(axiosError({ response: false }));
    await expect(plansApi.getById(1)).rejects.toThrow('Сервер учебных планов недоступен');

    api.get.mockRejectedValueOnce(axiosError({ status: 400, data: { message: 'Некорректный id' } }));
    await expect(plansApi.getById(1)).rejects.toThrow(
      'Не удалось загрузить учебный план: Некорректный id',
    );

    api.get.mockRejectedValueOnce(axiosError({ status: 500, data: 'html' }));
    await expect(plansApi.getById(1)).rejects.toThrow(
      'Не удалось загрузить учебный план. Повторите запрос позже.',
    );

    api.get.mockRejectedValueOnce(axiosError({ status: 504, data: null, code: 'ECONNABORTED' }));
    await expect(plansApi.getById(1)).rejects.toThrow('Сервер учебных планов недоступен');

    api.get.mockRejectedValueOnce(new Error('Original error'));
    await expect(plansApi.getById(1)).rejects.toThrow('Original error');

    api.get.mockRejectedValueOnce('unknown');
    await expect(plansApi.getById(1)).rejects.toThrow('Не удалось загрузить учебный план');
  });

  it('uses comparison and list-specific fallback messages', async () => {
    api.get.mockRejectedValueOnce('list failure');
    await expect(plansApi.list()).rejects.toThrow('Не удалось загрузить учебные планы');

    api.get.mockRejectedValue('compare failure');
    await expect(plansApi.compare(1, 2)).rejects.toThrow('Не удалось сравнить учебные планы');
  });
});

describe('authentication API', () => {
  const user = { id: 1, email: 'student@example.com', fullName: 'Student' };

  it('logs in, registers, restores and logs out a user', async () => {
    api.post
      .mockResolvedValueOnce({ data: { user, accessToken: 'login-token' } })
      .mockResolvedValueOnce({ data: { user, accessToken: 'register-token' } });
    api.get.mockResolvedValue({ data: user });

    await expect(authApi.login(user.email, 'password')).resolves.toEqual(user);
    expect(localStorage.getItem('eduplan-token')).toBe('login-token');
    await expect(authApi.register('Student', user.email, 'password')).resolves.toEqual(user);
    expect(localStorage.getItem('eduplan-token')).toBe('register-token');
    await expect(authApi.me()).resolves.toEqual(user);

    authApi.logout();
    expect(localStorage.getItem('eduplan-token')).toBeNull();
    expect(localStorage.getItem('eduplan-user')).toBeNull();
  });

  it('maps authentication status and payload failures', async () => {
    api.post.mockRejectedValueOnce(axiosError({ response: false }));
    await expect(authApi.login('a@b.c', 'x')).rejects.toThrow('Сервис авторизации недоступен');

    api.post.mockRejectedValueOnce(axiosError({ status: 401 }));
    await expect(authApi.login('a@b.c', 'x')).rejects.toThrow('Неверная электронная почта');

    api.post.mockRejectedValueOnce(axiosError({ status: 409 }));
    await expect(authApi.register('A', 'a@b.c', 'password')).rejects.toThrow('уже существует');

    api.post.mockRejectedValueOnce(axiosError({ status: 400, data: { message: 'Слишком короткий пароль' } }));
    await expect(authApi.register('A', 'a@b.c', 'password')).rejects.toThrow('Слишком короткий пароль');

    api.post.mockRejectedValueOnce(axiosError({ status: 400, data: { message: 42 } }));
    await expect(authApi.register('A', 'a@b.c', 'password')).rejects.toThrow('Проверьте заполнение');

    api.post.mockRejectedValueOnce(axiosError({ status: 500, data: null }));
    await expect(authApi.login('a@b.c', 'x')).rejects.toThrow('Не удалось войти');

    api.post.mockRejectedValueOnce(new Error('plain'));
    await expect(authApi.register('A', 'a@b.c', 'password')).rejects.toThrow('Не удалось создать');
  });
});

describe('profile and reference APIs', () => {
  it('deduplicates nested curricula and drops malformed profile rows', async () => {
    const curriculum = backendCurriculum({ id: 1 });
    api.get
      .mockResolvedValueOnce({ data: [{ curriculum }, { curriculum }, { curriculumId: 2 }, null] })
      .mockResolvedValueOnce({ data: 'malformed' });

    await expect(profileApi.favorites()).resolves.toHaveLength(1);
    await expect(profileApi.history()).resolves.toEqual([]);
  });

  it('adds and removes a favorite', async () => {
    api.post.mockResolvedValue({});
    api.delete.mockResolvedValue({});

    await profileApi.addFavorite(3);
    await profileApi.removeFavorite(3);
    expect(api.post).toHaveBeenCalledWith('/api/profile/favorites/3');
    expect(api.delete).toHaveBeenCalledWith('/api/profile/favorites/3');
  });

  it('loads faculty options with optional params', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, name: 'ФИТ', slug: 'fit' }] });

    await expect(facultiesApi.list({ admissionYear: 2025 })).resolves.toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith('/api/faculties', { params: { admissionYear: 2025 } });
    await facultiesApi.list();
    expect(api.get).toHaveBeenLastCalledWith('/api/faculties', { params: undefined });
  });
});
