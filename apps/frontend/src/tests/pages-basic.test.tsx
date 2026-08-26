import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@entities/user/model/types';
import { AuthPage } from '@features/auth/ui/AuthPage';
import { HomePage } from '@features/home/ui/HomePage';
import { PlansPage } from '@features/plan-catalog/ui/PlansPage';
import { profileApi } from '@features/profile/api/profile';
import { ProfilePage } from '@features/profile/ui/ProfilePage';
import type { PlanFilters } from '@features/plan-catalog/model/filter.types';
import { useWorkspaceStore as useAppStore } from '@features/workspace/model/useWorkspaceStore';
import { plan } from './fixtures';

const plansHook = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('@features/plan-catalog/model/usePlans', () => ({ usePlans: () => plansHook.value }));
vi.mock('@features/profile/api/profile', () => ({
  profileApi: {
    favorites: vi.fn(),
    history: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

const filters: PlanFilters = {
  query: '',
  faculty: 'all',
  direction: 'all',
  profile: 'all',
  level: 'all',
  studyForm: 'all',
};

const setFilters = vi.fn();
const reload = vi.fn();
const filterConfig = [
  {
    key: 'faculty' as const,
    label: 'Факультет',
    placeholder: 'Факультет',
    options: [{ value: '1', label: 'ФИТ' }],
  },
  {
    key: 'direction' as const,
    label: 'Направление',
    placeholder: 'Направление',
    options: [{ value: 'Информатика', label: 'Информатика' }],
  },
  {
    key: 'profile' as const,
    label: 'Профиль',
    placeholder: 'Профиль',
    options: [{ value: 'Веб-технологии', label: 'Веб-технологии' }],
  },
  {
    key: 'level' as const,
    label: 'Уровень',
    placeholder: 'Все уровни',
    options: [{ value: 'Бакалавриат', label: 'Бакалавриат' }],
  },
  {
    key: 'studyForm' as const,
    label: 'Форма',
    placeholder: 'Форма',
    options: [{ value: 'Очная', label: 'Очная' }],
  },
];

const userProfile: UserProfile = {
  id: 7,
  email: 'user@example.ru',
  fullName: 'Анна Смирнова',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const renderRoute = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

const setPlansHook = (overrides: Record<string, unknown> = {}) => {
  plansHook.value = {
    plans: [plan()],
    filteredPlans: [plan()],
    filterConfig,
    filters,
    setFilters,
    loading: false,
    error: null,
    reload,
    ...overrides,
  };
};

beforeEach(() => {
  setPlansHook();
  setFilters.mockReset();
  reload.mockReset();
  vi.mocked(profileApi.favorites).mockReset();
  vi.mocked(profileApi.history).mockReset();
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

describe('static product pages', () => {
  it('renders the complete home information architecture and actions', () => {
    renderRoute(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Сравните содержание');
    expect(screen.getByRole('heading', { name: 'Что можно узнать' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Как работает сервис' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Какие данные анализируются' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Кому пригодится EduPlan Compare' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть каталог/ })).toHaveAttribute('href', '/plans');
    expect(screen.getAllByText('Абитуриентам').length).toBeGreaterThan(0);
  });

  it('renders distinct login and registration propositions', () => {
    const { rerender } = renderRoute(<AuthPage mode="login" />);
    expect(
      screen.getByRole('heading', { name: 'Продолжите анализ учебных программ' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Войдите в аккаунт' })).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Сохраните свой образовательный поиск' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Создайте аккаунт' })).toBeInTheDocument();
    expect(screen.getByText('Это займёт меньше минуты.')).toBeInTheDocument();
  });
});

describe('plans catalog scenarios', () => {
  it('groups program filters and omits the redundant year selector', () => {
    renderRoute(<PlansPage />);

    const programGroup = screen.getByRole('group', { name: 'Программа' });
    expect(within(programGroup).getByRole('combobox', { name: 'Факультет' })).toBeInTheDocument();
    expect(within(programGroup).getByRole('combobox', { name: 'Направление' })).toBeInTheDocument();
    expect(within(programGroup).getByRole('combobox', { name: 'Профиль' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Год' })).not.toBeInTheDocument();
  });

  it('shows loading and reloads after a blocking error', async () => {
    setPlansHook({ plans: [], filteredPlans: [], loading: true });
    const { rerender } = renderRoute(<PlansPage />);
    expect(screen.getByLabelText('Загружаем учебные планы')).toBeInTheDocument();
    expect(screen.getByText('Ищем программы…')).toBeInTheDocument();

    setPlansHook({ plans: [], filteredPlans: [], error: 'offline' });
    rerender(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(reload).toHaveBeenCalledWith(filters);
  });

  it('distinguishes an empty catalog from no filtered results and resets', async () => {
    setPlansHook({ plans: [], filteredPlans: [] });
    const { rerender } = renderRoute(<PlansPage />);
    expect(screen.getByText('Учебные планы пока не загружены')).toBeInTheDocument();

    setPlansHook({ plans: [plan()], filteredPlans: [] });
    rerender(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('По выбранным параметрам учебные планы не найдены'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(setFilters).toHaveBeenCalledWith(filters);
  });

  it('builds active filter chips, removes each kind and paginates results', async () => {
    const manyPlans = Array.from({ length: 11 }, (_, index) =>
      plan({ id: index + 1, title: `Программа ${index + 1}` }),
    );
    const activeFilters = {
      ...filters,
      query: 'web',
      direction: 'Неизвестное направление',
      level: 'Бакалавриат',
    };
    setPlansHook({ plans: manyPlans, filteredPlans: manyPlans, filters: activeFilters });
    renderRoute(<PlansPage />);

    const chips = screen.getByLabelText('Активные фильтры');
    await userEvent.click(within(chips).getByRole('button', { name: /Поиск: web/ }));
    expect(setFilters).toHaveBeenCalledWith({ ...activeFilters, query: '' });
    await userEvent.click(within(chips).getByRole('button', { name: /Уровень: Бакалавриат/ }));
    expect(setFilters).toHaveBeenCalledWith({ ...activeFilters, level: 'all' });
    await userEvent.click(
      within(chips).getByRole('button', { name: /Направление: Неизвестное направление/ }),
    );
    expect(setFilters).toHaveBeenCalledWith({ ...activeFilters, direction: 'all' });
    expect(screen.getAllByRole('article')).toHaveLength(9);
    await userEvent.click(screen.getByRole('button', { name: /Показать ещё/ }));
    expect(screen.getAllByRole('article')).toHaveLength(11);
  });

  it('shows one-plan and ready-to-compare next actions', () => {
    useAppStore.setState({ compareIds: [1, null], compareLevels: ['Бакалавриат', null] });
    const { rerender } = renderRoute(<PlansPage />);
    expect(screen.getByText('Добавьте ещё одну программу')).toBeInTheDocument();

    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    rerender(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Программы готовы к сравнению')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Перейти к сравнению/ })).toHaveAttribute(
      'href',
      '/compare',
    );
  });
});

describe('profile scenarios', () => {
  it('offers authentication to a guest without requesting private data', () => {
    renderRoute(<ProfilePage />);
    expect(screen.getByText('Войдите в EduPlan Compare')).toBeInTheDocument();
    expect(profileApi.favorites).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Создать аккаунт' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('loads and renders saved and recent programs and synchronizes IDs', async () => {
    const saved = plan();
    const history = Array.from({ length: 10 }, (_, index) =>
      plan({ id: index + 20, title: `История ${index}` }),
    );
    vi.mocked(profileApi.favorites).mockResolvedValue([saved]);
    vi.mocked(profileApi.history).mockResolvedValue(history);
    useAppStore.setState({ user: userProfile });
    renderRoute(<ProfilePage />);
    expect(screen.getByLabelText('Загружаем личный раздел')).toBeInTheDocument();
    expect(await screen.findByText('Избранные программы')).toBeInTheDocument();
    expect(useAppStore.getState().favorites).toEqual([1]);
    expect(screen.getByText('Разработка программного обеспечения')).toBeInTheDocument();
    expect(screen.getAllByText(/История/).length).toBeGreaterThanOrEqual(8);
    expect(screen.queryByText('История 8')).not.toBeInTheDocument();
  });

  it('renders empty favorite/history states and fallback account name', async () => {
    vi.mocked(profileApi.favorites).mockResolvedValue([]);
    vi.mocked(profileApi.history).mockResolvedValue([]);
    useAppStore.setState({ user: { ...userProfile, fullName: '' } });
    renderRoute(<ProfilePage />);
    expect(await screen.findByText('Пользователь EduPlan')).toBeInTheDocument();
    expect(screen.getByText('В избранном пока нет программ')).toBeInTheDocument();
    expect(screen.getByText('История просмотров пока пуста')).toBeInTheDocument();
  });

  it('shows a private-data failure and retries successfully', async () => {
    vi.mocked(profileApi.favorites)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    vi.mocked(profileApi.history)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    useAppStore.setState({ user: userProfile });
    renderRoute(<ProfilePage />);
    expect(await screen.findByText('Личный раздел временно недоступен')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(profileApi.favorites).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('В избранном пока нет программ')).toBeInTheDocument();
  });
});
