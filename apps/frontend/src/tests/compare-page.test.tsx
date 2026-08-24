import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComparePage } from '../pages/ComparePage/ComparePage';
import { plansApi } from '../services/api/plans';
import { useAppStore } from '../store/useAppStore';
import type { Discipline, PlanComparison } from '../types/plan';
import { plan } from './fixtures';

const plansHook = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock('../hooks/usePlans', () => ({ usePlans: () => plansHook.value }));
vi.mock('../services/api/plans', () => ({
  plansApi: { list: vi.fn(), get: vi.fn(), compare: vi.fn() },
}));
vi.mock('../components/PlanSelector/PlanSelector', async () => {
  const React = await import('react');
  return {
    PlanSelector: ({ side, value, requiredLevel, onChange }: { side: string; value: number | null; requiredLevel: string | null; onChange: (value: number | null) => void }) =>
      React.createElement('div', { 'data-testid': `selector-${side}` },
        React.createElement('span', null, `${side}:${value ?? 'empty'}:${requiredLevel ?? 'any'}`),
        React.createElement('button', { type: 'button', onClick: () => onChange(side === 'A' ? 1 : 2) }, `select-${side}`),
        React.createElement('button', { type: 'button', onClick: () => onChange(null) }, `clear-${side}`),
        React.createElement('button', { type: 'button', onClick: () => onChange(999) }, `invalid-${side}`),
      ),
  };
});
vi.mock('recharts', async () => {
  const React = await import('react');
  const container = ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
    React.createElement('div', props, children);
  return {
    ResponsiveContainer: container,
    BarChart: container,
    CartesianGrid: container,
    XAxis: container,
    YAxis: container,
    Bar: container,
    Tooltip: ({ formatter }: { formatter?: (value: unknown, name: string) => unknown }) => {
      formatter?.(undefined, 'a');
      formatter?.(10, 'b');
      return React.createElement('div', { 'data-testid': 'chart-tooltip' });
    },
    Legend: ({ formatter }: { formatter?: (value: string) => unknown }) => {
      formatter?.('a');
      formatter?.('b');
      return React.createElement('div', { 'data-testid': 'chart-legend' });
    },
  };
});

const reload = vi.fn();
const first = plan({
  id: 1,
  title: 'Программа Альфа',
  disciplines: [
    { ...plan().disciplines[0], id: 1, name: 'Общая', semester: 1, hours: 200, credits: 5, lectureHours: 100, practiceHours: 50, labHours: 20, independentHours: 30 },
    { ...plan().disciplines[0], id: 2, name: 'Без семестра A', semester: null, hours: 0, credits: 0 },
  ],
});
const second = plan({
  id: 2,
  title: 'Программа Бета',
  disciplines: [
    { ...plan().disciplines[0], id: 3, name: 'Общая', semester: 2, hours: 150, credits: 3, lectureHours: 50, practiceHours: 50, labHours: 30, independentHours: 40 },
    { ...plan().disciplines[0], id: 4, name: 'Третий семестр', semester: 3, hours: 50, credits: 1 },
    { ...plan().disciplines[0], id: 5, name: 'Без семестра B', semester: null, hours: 0, credits: 0, lectureHours: 0, practiceHours: 0, labHours: 0, independentHours: 0 },
  ],
});

const uniqueMissing: Discipline = {
  id: 50,
  name: 'Уникальная без метрик',
  module: 'Блок',
  semester: null,
  hours: 0,
  credits: 0,
};

const richComparison: PlanComparison = {
  firstPlan: first,
  secondPlan: second,
  summary: {
    firstDisciplinesCount: 2,
    secondDisciplinesCount: 2,
    commonCount: 1,
    onlyFirstCount: 1,
    onlySecondCount: 1,
  },
  commonDisciplines: [
    { name: 'Общая', first: first.disciplines[0], second: second.disciplines[0], differences: [{ field: 'totalHours', firstValue: 200, secondValue: 150 }] },
    { name: 'Совпадающая', first: first.disciplines[0], second: second.disciplines[0], differences: [] },
  ],
  onlyInFirst: [{ ...first.disciplines[0], name: 'Только A' }],
  onlyInSecond: [uniqueMissing],
};

const emptyComparison: PlanComparison = {
  firstPlan: plan({ id: 1, title: 'Пустая A', disciplines: [] }),
  secondPlan: plan({ id: 2, title: 'Пустая B', disciplines: [] }),
  summary: { firstDisciplinesCount: 0, secondDisciplinesCount: 0, commonCount: 0, onlyFirstCount: 0, onlySecondCount: 0 },
  commonDisciplines: [],
  onlyInFirst: [],
  onlyInSecond: [],
};

const renderPage = () => render(<MemoryRouter><ComparePage /></MemoryRouter>);

beforeEach(() => {
  reload.mockReset();
  plansHook.value = { plans: [first, second], loading: false, error: null, reload };
  vi.mocked(plansApi.compare).mockReset();
  vi.mocked(plansApi.compare).mockResolvedValue(richComparison);
  useAppStore.setState({
    user: null,
    favorites: [],
    compareIds: [null, null],
    compareLevels: [null, null],
    history: [],
  });
});

describe('comparison user journey', () => {
  it('loads selector data, reports list errors and retries', async () => {
    plansHook.value = { plans: [], loading: true, error: null, reload };
    const { rerender } = renderPage();
    expect(screen.getByLabelText('Загружаем список программ')).toBeInTheDocument();
    expect(screen.getByText('Выберите две образовательные программы')).toBeInTheDocument();

    plansHook.value = { plans: [], loading: false, error: 'Список недоступен', reload };
    rerender(<MemoryRouter><ComparePage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('selects, clears and ignores a plan absent from the catalog', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'invalid-A' }));
    expect(useAppStore.getState().compareIds).toEqual([null, null]);
    await userEvent.click(screen.getByRole('button', { name: 'select-A' }));
    expect(useAppStore.getState().compareIds).toEqual([1, null]);
    await userEvent.click(screen.getByRole('button', { name: 'select-B' }));
    expect(useAppStore.getState().compareIds).toEqual([1, 2]);
    await userEvent.click(screen.getByRole('button', { name: 'clear-A' }));
    expect(useAppStore.getState().compareIds).toEqual([null, 2]);
  });

  it('blocks incompatible or incomplete persisted selections before the API', async () => {
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Магистратура'] });
    const { rerender } = renderPage();
    expect(await screen.findByText('Для сравнения выберите две программы одного уровня образования.')).toBeInTheDocument();
    expect(plansApi.compare).not.toHaveBeenCalled();

    useAppStore.setState({ compareLevels: [null, 'Бакалавриат'] });
    rerender(<MemoryRouter><ComparePage /></MemoryRouter>);
    expect(await screen.findByText('Для сравнения выберите две программы одного уровня образования.')).toBeInTheDocument();
  });

  it('shows comparison loading, Error failures, fallback failures and retries', async () => {
    let reject!: (reason: unknown) => void;
    vi.mocked(plansApi.compare).mockImplementationOnce(() => new Promise((_, failure) => { reject = failure; }));
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    renderPage();
    expect(screen.getByLabelText('Сопоставляем дисциплины и нагрузку')).toBeInTheDocument();
    reject(new Error('Сервис сравнения недоступен'));
    expect(await screen.findByText('Сервис сравнения недоступен')).toBeInTheDocument();

    vi.mocked(plansApi.compare).mockRejectedValueOnce('failure');
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Не удалось сравнить программы', { selector: 'p' })).toBeInTheDocument();
  });

  it('ignores completion and failure from requests cancelled by a selection change', async () => {
    let resolve!: (value: PlanComparison) => void;
    vi.mocked(plansApi.compare).mockImplementationOnce(() => new Promise((success) => { resolve = success; }));
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    const { rerender } = renderPage();
    useAppStore.setState({ compareIds: [1, null], compareLevels: ['Бакалавриат', null] });
    rerender(<MemoryRouter><ComparePage /></MemoryRouter>);
    resolve(richComparison);
    await waitFor(() => expect(screen.getByText('Выберите две образовательные программы')).toBeInTheDocument());

    let reject!: (reason: unknown) => void;
    vi.mocked(plansApi.compare).mockImplementationOnce(() => new Promise((_, failure) => { reject = failure; }));
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    rerender(<MemoryRouter><ComparePage /></MemoryRouter>);
    useAppStore.setState({ compareIds: [null, 2], compareLevels: [null, 'Бакалавриат'] });
    rerender(<MemoryRouter><ComparePage /></MemoryRouter>);
    reject(new Error('late'));
    await waitFor(() => expect(screen.queryByText('late')).not.toBeInTheDocument());
  });

  it('renders source-backed summary, charts, deltas, common and unique disciplines', async () => {
    vi.mocked(plansApi.compare).mockResolvedValue(richComparison);
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    renderPage();
    expect(await screen.findByText('Насколько программы похожи')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Одинаково: 200 ч.')).toBeInTheDocument();
    expect(screen.getByText(/В программе A на 1 ЗЕТ больше/)).toBeInTheDocument();
    expect(screen.getByText(/В A на 50 ч. больше/)).toBeInTheDocument();
    expect(screen.getAllByText(/В A на 10 ч. меньше/)).toHaveLength(2);
    expect(screen.getByText('Параметры совпадают')).toBeInTheDocument();
    expect(screen.getByText('Семестр не указан')).toBeInTheDocument();
    expect(screen.getByText('часы не указаны')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Программа A/ })).toHaveAttribute('href', '/plans/1');
    expect(screen.getAllByTestId('chart-tooltip')).toHaveLength(2);
  });

  it('explains absent analytical evidence and empty discipline intersections', async () => {
    vi.mocked(plansApi.compare).mockResolvedValue(emptyComparison);
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    renderPage();
    expect(await screen.findByText('Недостаточно данных о дисциплинах')).toBeInTheDocument();
    expect(screen.getByText('Нет данных для сравнения нагрузки')).toBeInTheDocument();
    expect(screen.getByText('Нет данных о нагрузке по семестрам')).toBeInTheDocument();
    expect(screen.getByText('Общих дисциплин не найдено')).toBeInTheDocument();
    expect(screen.getAllByText('Уникальных дисциплин на этой стороне нет.')).toHaveLength(2);
  });

  it('describes smaller A totals in metric deltas', async () => {
    const reversed: PlanComparison = {
      ...richComparison,
      firstPlan: plan({ id: 1, title: 'Малая A', disciplines: [{ ...plan().disciplines[0], hours: 10, credits: 1 }] }),
      secondPlan: plan({ id: 2, title: 'Большая B', disciplines: [{ ...plan().disciplines[0], hours: 20, credits: 2 }] }),
    };
    vi.mocked(plansApi.compare).mockResolvedValue(reversed);
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    renderPage();
    expect(await screen.findByText(/В программе A на 10 ч. меньше/)).toBeInTheDocument();
    expect(screen.getByText(/В программе A на 1 ЗЕТ меньше/)).toBeInTheDocument();
  });

  it('builds semester evidence when only program B has a numbered semester', async () => {
    const onlySecondSemester: PlanComparison = {
      ...emptyComparison,
      firstPlan: plan({ id: 1, disciplines: [{ ...plan().disciplines[0], semester: null, hours: 0 }] }),
      secondPlan: plan({ id: 2, disciplines: [{ ...plan().disciplines[0], semester: 1, hours: 100 }] }),
    };
    vi.mocked(plansApi.compare).mockResolvedValue(onlySecondSemester);
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    renderPage();
    expect(await screen.findByRole('img', { name: 'Сравнение нагрузки программ A и B по семестрам' })).toBeInTheDocument();
  });
});
