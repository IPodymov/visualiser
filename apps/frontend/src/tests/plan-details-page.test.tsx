import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { plansApi } from '@entities/plan/api/plans';
import type { EducationPlan } from '@entities/plan/model/types';
import type { UserProfile } from '@entities/user/model/types';
import { PlanDetailsPage } from '@features/plan-details/ui/PlanDetailsPage';
import { profileApi } from '@features/profile/api/profile';
import { useWorkspaceStore as useAppStore } from '@features/workspace/model/useWorkspaceStore';
import { plan } from './fixtures';

vi.mock('@entities/plan/api/plans', () => ({
  plansApi: { list: vi.fn(), get: vi.fn(), getById: vi.fn(), compare: vi.fn() },
}));
vi.mock('@features/profile/api/profile', () => ({
  profileApi: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    favorites: vi.fn(),
    history: vi.fn(),
  },
}));
vi.mock('recharts', async () => {
  const React = await import('react');
  const container = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  return {
    ResponsiveContainer: container,
    BarChart: container,
    CartesianGrid: container,
    YAxis: container,
    Bar: container,
    XAxis: ({ tickFormatter }: { tickFormatter?: (value: string) => string }) => {
      tickFormatter?.('1 семестр');
      return React.createElement('div', { 'data-testid': 'x-axis' });
    },
    Tooltip: ({ formatter }: { formatter?: (value: unknown) => unknown }) => {
      formatter?.(undefined);
      formatter?.(100);
      return React.createElement('div', { 'data-testid': 'chart-tooltip' });
    },
  };
});

const userProfile: UserProfile = {
  id: 7,
  email: 'user@example.ru',
  fullName: 'Анна Смирнова',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const detailedPlan: EducationPlan = plan({
  profile: undefined,
  disciplines: [
    {
      ...plan().disciplines[0],
      id: 1,
      name: 'Алгоритмы',
      module: 'Разработка',
      semester: 2,
      controlForm: 'Экзамен',
      hours: 144,
      credits: 4,
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
      independentHours: 72,
    },
    {
      ...plan().disciplines[0],
      id: 2,
      name: 'Базы данных',
      module: 'Данные',
      semester: 1,
      controlForm: 'Зачёт',
      hours: 108,
      credits: 3,
      lectureHours: 18,
      practiceHours: 36,
      labHours: 0,
      independentHours: 54,
    },
    {
      ...plan().disciplines[0],
      id: 3,
      name: 'Практика',
      module: 'Практика',
      semester: null,
      controlForm: null,
      hours: 0,
      credits: 0,
      lectureHours: 0,
      practiceHours: 0,
      labHours: 0,
      independentHours: 0,
    },
  ],
  visualization: {
    totals: {
      disciplinesCount: 3,
      totalHours: 252,
      credits: 7,
      lectureHours: 54,
      practiceHours: 54,
      labHours: 18,
      independentHours: 126,
      contactHours: 126,
    },
    bySemester: [
      {
        key: 'unknown',
        label: 'Без семестра',
        disciplinesCount: 1,
        totalHours: 0,
        credits: 0,
        lectureHours: 0,
        practiceHours: 0,
        labHours: 0,
        independentHours: 0,
      },
      {
        key: '1',
        label: '1 семестр',
        disciplinesCount: 1,
        totalHours: 108,
        credits: 3,
        lectureHours: 18,
        practiceHours: 36,
        labHours: 0,
        independentHours: 54,
      },
      {
        key: '2',
        label: '2 семестр',
        disciplinesCount: 1,
        totalHours: 144,
        credits: 4,
        lectureHours: 36,
        practiceHours: 18,
        labHours: 18,
        independentHours: 72,
      },
    ],
    byBlock: [],
    byPart: [],
    workload: [
      { key: 'lectureHours', label: 'Лекции', hours: 54 },
      { key: 'practiceHours', label: 'Практики', hours: 54 },
      { key: 'labHours', label: 'Лабораторные', hours: 18 },
      { key: 'independentHours', label: 'Самостоятельная работа', hours: 126 },
    ],
    controlForms: [{ form: 'Экзамен', count: 1 }],
  },
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/plans/:id" element={<PlanDetailsPage />} />
        <Route path="/compare" element={<div>Сравнение открыто</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.mocked(plansApi.getById).mockReset();
  vi.mocked(profileApi.addFavorite).mockResolvedValue(undefined);
  vi.mocked(profileApi.removeFavorite).mockResolvedValue(undefined);
  useAppStore.setState({
    user: null,
    favorites: [],
    compareIds: [null, null],
    compareLevels: [null, null],
    history: [],
  });
});

describe('plan detail user journey', () => {
  it('rejects malformed identifiers without requesting the API and retries safely', async () => {
    renderAt('/plans/not-a-number');
    expect(await screen.findByText('Адрес учебного плана указан неверно.')).toBeInTheDocument();
    expect(plansApi.getById).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(plansApi.getById).not.toHaveBeenCalled();
  });

  it('reports Error and fallback request failures, then retries', async () => {
    vi.mocked(plansApi.getById)
      .mockRejectedValueOnce(new Error('План удалён'))
      .mockRejectedValueOnce('failure')
      .mockResolvedValueOnce(detailedPlan);
    renderAt('/plans/1');
    expect(screen.getByLabelText('Загружаем структуру учебного плана')).toBeInTheDocument();
    expect(await screen.findByText('План удалён')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Не удалось загрузить учебный план')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: detailedPlan.title })).toBeInTheDocument();
  });

  it('uses a safe fallback when an empty successful payload is returned', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(null as never);
    renderAt('/plans/1');
    expect(await screen.findByText('План не найден или больше недоступен.')).toBeInTheDocument();
  });

  it('renders compact source-backed analysis and records browsing history', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    renderAt('/plans/1');
    expect(await screen.findByRole('heading', { name: detailedPlan.title })).toBeInTheDocument();
    expect(useAppStore.getState().history[0].id).toBe(1);
    expect(screen.getByText('Не указан отдельно')).toBeInTheDocument();
    expect(screen.getByText('252 ч.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /нагрузки по семестрам/ })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Самостоятельная работа: 126 часов/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Чаще всего в плане встречается форма контроля/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Сохранить программу/ })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getAllByTestId('chart-tooltip')).toHaveLength(1);
  });

  it('adds a compatible plan to comparison from the main and next actions', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    renderAt('/plans/1');
    await screen.findByRole('heading', { name: detailedPlan.title });
    const compareLinks = screen.getAllByRole('link', { name: /Сравнить|Выбрать программу/ });
    await userEvent.click(compareLinks[0]);
    expect(useAppStore.getState().compareIds).toEqual([1, null]);
    expect(await screen.findByText('Сравнение открыто')).toBeInTheDocument();
  });

  it('adds a compatible plan from the final next action', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    renderAt('/plans/1');
    const nextAction = await screen.findByRole('link', { name: /Выбрать программу/ });
    await userEvent.click(nextAction);
    expect(useAppStore.getState().compareIds).toEqual([1, null]);
  });

  it('disables comparison for another education level and explains why', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    useAppStore.setState({ compareIds: [2, null], compareLevels: ['Магистратура', null] });
    renderAt('/plans/1');
    expect(await screen.findAllByRole('button', { name: 'Другой уровень' })).toHaveLength(2);
    expect(
      screen.getAllByRole('tooltip').every((item) => item.textContent?.includes('Магистратура')),
    ).toBe(true);
  });

  it('lets an authenticated user add and remove a favorite', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    useAppStore.setState({ user: userProfile });
    const { unmount } = renderAt('/plans/1');
    await userEvent.click(await screen.findByRole('button', { name: 'В избранное' }));
    expect(useAppStore.getState().favorites).toEqual([1]);
    unmount();

    useAppStore.setState({ user: userProfile, favorites: [1] });
    renderAt('/plans/1');
    await userEvent.click(await screen.findByRole('button', { name: 'В избранном' }));
    expect(useAppStore.getState().favorites).toEqual([]);
  });

  it('filters disciplines by query, semester and control form and resets no-results state', async () => {
    const user = userEvent.setup();
    vi.mocked(plansApi.getById).mockResolvedValue(detailedPlan);
    renderAt('/plans/1');
    const search = await screen.findByLabelText('Поиск дисциплины');
    await user.type(search, 'данные');
    expect(screen.getByText('Дисциплины: 1')).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'разработка');
    expect(screen.getByText('Дисциплины: 1')).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'нет такого предмета');
    expect(screen.getByText('Дисциплины не найдены')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.getByText('Дисциплины: 3')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Семестр' }));
    await user.click(await screen.findByRole('option', { name: '1 семестр' }));
    expect(screen.getByText('Дисциплины: 1')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Форма контроля' }));
    await user.click(await screen.findByRole('option', { name: 'Экзамен' }));
    expect(screen.getByText('Дисциплины не найдены')).toBeInTheDocument();
  });

  it('renders explicit no-evidence states for a plan without measurable workload', async () => {
    vi.mocked(plansApi.getById).mockResolvedValue(
      plan({ disciplines: [], visualization: undefined }),
    );
    renderAt('/plans/1');
    expect(await screen.findByText('Нет данных по семестрам')).toBeInTheDocument();
    expect(screen.getByText('Нет данных по форматам')).toBeInTheDocument();
    expect(screen.getByText('Дисциплины не найдены')).toBeInTheDocument();
  });

  it('uses the first insight when workload exists without semester evidence', async () => {
    const workloadOnly = plan({
      disciplines: [
        {
          ...plan().disciplines[0],
          semester: null,
          hours: 0,
          lectureHours: 10,
          practiceHours: 0,
          labHours: 0,
          independentHours: 0,
        },
      ],
      visualization: {
        totals: {
          disciplinesCount: 1,
          totalHours: 0,
          credits: 4,
          lectureHours: 10,
          practiceHours: 0,
          labHours: 0,
          independentHours: 0,
          contactHours: 10,
        },
        bySemester: [],
        byBlock: [],
        byPart: [],
        workload: [{ key: 'lectureHours', label: 'Лекции', hours: 10 }],
        controlForms: [{ form: 'Экзамен', count: 1 }],
      },
    });
    vi.mocked(plansApi.getById).mockResolvedValue(workloadOnly);
    renderAt('/plans/1');
    expect(await screen.findByText('Нет данных по семестрам')).toBeInTheDocument();
    expect(screen.getByText(/Самая крупная часть учтённой нагрузки/)).toBeInTheDocument();
    expect(screen.getByText(/Чаще всего в плане/)).toBeInTheDocument();
  });

  it('uses the control insight after semester evidence without format hours', async () => {
    const semesterOnly = plan({
      disciplines: [
        {
          ...plan().disciplines[0],
          semester: 1,
          hours: 10,
          lectureHours: 0,
          practiceHours: 0,
          labHours: 0,
          independentHours: 0,
        },
      ],
      visualization: {
        totals: {
          disciplinesCount: 1,
          totalHours: 10,
          credits: 4,
          lectureHours: 0,
          practiceHours: 0,
          labHours: 0,
          independentHours: 0,
          contactHours: 0,
        },
        bySemester: [
          {
            key: '1',
            label: '1 семестр',
            disciplinesCount: 1,
            totalHours: 10,
            credits: 4,
            lectureHours: 0,
            practiceHours: 0,
            labHours: 0,
            independentHours: 0,
          },
        ],
        byBlock: [],
        byPart: [],
        workload: [],
        controlForms: [{ form: 'Экзамен', count: 1 }],
      },
    });
    vi.mocked(plansApi.getById).mockResolvedValue(semesterOnly);
    renderAt('/plans/1');
    expect(await screen.findByText('Нет данных по форматам')).toBeInTheDocument();
    expect(screen.getByText(/Чаще всего в плане/)).toBeInTheDocument();
  });
});
