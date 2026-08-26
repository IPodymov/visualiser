import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@entities/user/model/types';
import { DisciplineTable } from '@entities/plan/ui/DisciplineTable/DisciplineTable';
import { SemesterAccordion } from '@entities/plan/ui/SemesterAccordion/SemesterAccordion';
import { authApi } from '@features/auth/api/auth';
import { AuthForm } from '@features/auth/ui/AuthForm/AuthForm';
import { CompareTable } from '@features/comparison/ui/CompareTable/CompareTable';
import { ComparisonIndicator } from '@features/comparison/ui/ComparisonIndicator/ComparisonIndicator';
import { PlanSelector } from '@features/comparison/ui/PlanSelector/PlanSelector';
import type { PlanComparison } from '@features/comparison/model/types';
import { HeroSection } from '@features/home/ui/HeroSection/HeroSection';
import { PlanCard } from '@features/plan-actions/ui/PlanCard/PlanCard';
import type { PlanFilters } from '@features/plan-catalog/model/filter.types';
import { SearchFilters } from '@features/plan-catalog/ui/SearchFilters/SearchFilters';
import { profileApi } from '@features/profile/api/profile';
import { useWorkspaceStore as useAppStore } from '@features/workspace/model/useWorkspaceStore';
import { Breadcrumbs } from '@shared/ui/Breadcrumbs/Breadcrumbs';
import { ChartCard } from '@shared/ui/ChartCard/ChartCard';
import { EmptyState } from '@shared/ui/EmptyState/EmptyState';
import {
  ErrorState,
  InlineLoading,
  LoadingState,
  SuccessState,
} from '@shared/ui/InterfaceState/InterfaceState';
import { MetricCard } from '@shared/ui/MetricCard/MetricCard';
import {
  NextAction,
  PageHeader,
  PageSection,
  SectionHeader,
} from '@shared/ui/PageLayout/PageLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/accordion';
import { Badge, badgeVariants } from '@shared/ui/badge';
import { Button, buttonVariants } from '@shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Dialog } from '@shared/ui/dialog';
import { Drawer } from '@shared/ui/drawer';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Pagination } from '@shared/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Skeleton } from '@shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Tooltip } from '@shared/ui/tooltip';
import { Footer } from '@widgets/Footer/Footer';
import { Header } from '@widgets/Header/Header';
import { plan } from './fixtures';

vi.mock('@features/auth/api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

const userProfile: UserProfile = {
  id: 7,
  email: 'user@example.ru',
  fullName: 'Анна Смирнова',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const router = (children: React.ReactNode, initialEntries = ['/']) =>
  render(<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>);

beforeEach(() => {
  vi.spyOn(profileApi, 'addFavorite').mockResolvedValue(undefined);
  vi.spyOn(profileApi, 'removeFavorite').mockResolvedValue(undefined);
  useAppStore.setState({
    user: null,
    favorites: [],
    compareIds: [null, null],
    compareLevels: [null, null],
    history: [],
  });
});

describe('UI primitives', () => {
  it('renders all simple primitives, variants and optional class names', () => {
    const variants = [
      'default',
      'secondary',
      'ghost',
      'outline',
      'destructive',
      'strong',
      'programA',
      'programB',
    ] as const;
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;
    const badgeTones = [
      'neutral',
      'brand',
      'shared',
      'programA',
      'programB',
      'success',
      'warning',
    ] as const;

    render(
      <div>
        {variants.map((variant, index) => (
          <Button
            key={variant}
            variant={variant}
            size={sizes[index % sizes.length]}
            className={index ? undefined : 'custom'}
          >
            {variant}
          </Button>
        ))}
        <Button asChild>
          <a href="/target">child button</a>
        </Button>
        {badgeTones.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
        <Card className="card-custom">
          <CardHeader className="header-custom">
            <CardTitle className="title-custom">Заголовок</CardTitle>
            <CardDescription className="description-custom">Описание</CardDescription>
          </CardHeader>
          <CardContent className="content-custom">Контент</CardContent>
          <CardFooter className="footer-custom">Подвал</CardFooter>
        </Card>
        <Label className="label-custom" htmlFor="field">
          Поле
        </Label>
        <Input id="field" className="input-custom" type="text" />
        <Skeleton className="skeleton-custom" data-testid="skeleton" />
        <Table className="table-custom">
          <TableHeader className="thead-custom">
            <TableRow className="row-custom">
              <TableHead className="head-custom">Колонка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="body-custom">
            <TableRow>
              <TableCell className="cell-custom">Значение</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Tooltip content="Подсказка">
          <span>Наведи</span>
        </Tooltip>
      </div>,
    );

    expect(screen.getByText('child button').closest('a')).toHaveClass('inline-flex');
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Подсказка');
    expect(badgeVariants()).toContain('inline-flex');
    expect(badgeVariants({ variant: 'brand' })).toContain('blue');
    expect(buttonVariants()).toContain('h-10');
    expect(buttonVariants({ variant: 'programB', size: 'lg' })).toContain('amber');
  });

  it('supports tabs, accordion and select interactions', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <div>
        <Tabs defaultValue="first">
          <TabsList className="tabs-list">
            <TabsTrigger className="tabs-trigger" value="first">
              Первая
            </TabsTrigger>
            <TabsTrigger value="second">Вторая</TabsTrigger>
          </TabsList>
          <TabsContent className="tabs-content" value="first">
            Первый контент
          </TabsContent>
          <TabsContent value="second">Второй контент</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible>
          <AccordionItem className="accordion-item" value="one">
            <AccordionTrigger className="accordion-trigger">Раздел</AccordionTrigger>
            <AccordionContent className="accordion-content">Содержимое</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Select onValueChange={onValueChange}>
          <SelectTrigger className="select-trigger" aria-label="Тестовый выбор">
            <SelectValue placeholder="Выберите" />
          </SelectTrigger>
          <SelectContent className="select-content">
            <SelectItem className="select-item" value="one">
              Один
            </SelectItem>
            <SelectItem value="two">Два</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );

    await user.click(screen.getByRole('tab', { name: 'Вторая' }));
    expect(screen.getByText('Второй контент')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Раздел/ }));
    expect(screen.getByText('Содержимое')).toBeVisible();
    await user.click(screen.getByRole('combobox', { name: 'Тестовый выбор' }));
    await user.click(await screen.findByRole('option', { name: 'Два' }));
    expect(onValueChange).toHaveBeenCalledWith('two');
  });

  it('opens and closes dialogs from close, cancel, backdrop and controlled state', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="Окно"
        description="Описание"
        className="custom-dialog"
      >
        Тело
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('open');
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть', hidden: true }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }));
    fireEvent.click(dialog);
    expect(onOpenChange).toHaveBeenCalledTimes(3);
    fireEvent.click(within(dialog).getByText('Тело'));
    expect(onOpenChange).toHaveBeenCalledTimes(3);
    rerender(
      <Dialog open={false} onOpenChange={onOpenChange} title="Окно">
        Тело
      </Dialog>,
    );
    expect(dialog).not.toHaveAttribute('open');
    fireEvent(dialog, new Event('close'));
    expect(onOpenChange).toHaveBeenCalledTimes(4);

    render(
      <Drawer open={false} onOpenChange={vi.fn()} title="Панель">
        Панель содержимое
      </Drawer>,
    );
    expect(screen.getByText('Панель содержимое')).toBeInTheDocument();
  });

  it('shows pagination only while more items are available', async () => {
    const loadMore = vi.fn();
    const { rerender } = render(<Pagination shown={10} total={20} onLoadMore={loadMore} />);
    await userEvent.click(screen.getByRole('button', { name: /Показать ещё/ }));
    expect(loadMore).toHaveBeenCalledOnce();
    rerender(<Pagination shown={20} total={20} onLoadMore={loadMore} />);
    expect(screen.queryByText(/Показано/)).not.toBeInTheDocument();
  });
});

describe('shared content components', () => {
  it('renders breadcrumbs, hero, footer and layout building blocks', () => {
    router(
      <>
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Раздел' }]} />
        <HeroSection />
        <Footer />
        <PageHeader
          eyebrow="Контекст"
          title="Страница"
          description="Описание"
          breadcrumbs={<span>Крошки</span>}
          actions={<button>Действие</button>}
        />
        <PageHeader title="Без опций" description="Описание 2" />
        <PageSection className="section-custom" labelledBy="section-id">
          <span>Секция</span>
        </PageSection>
        <SectionHeader
          eyebrow="Этап"
          title="Раздел страницы"
          description="Расшифровка"
          action={<button>Ещё</button>}
          id="section-id"
        />
        <SectionHeader title="Минимальный раздел" />
        <NextAction className="next-custom">Следующий шаг</NextAction>
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Хлебные крошки' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Демонстрационный пример/ })).toBeInTheDocument();
    expect(screen.getAllByText('Бакалавриат · 2025')).toHaveLength(2);
    expect(screen.queryByText('Магистратура · 2025')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Навигация в подвале' })).toBeInTheDocument();
    expect(screen.getByText('Следующий шаг')).toBeInTheDocument();
  });

  it('renders cards, metrics, empty and every interface state', async () => {
    const retry = vi.fn();
    render(
      <>
        <ChartCard
          title="График"
          description="Описание графика"
          actions={<button>Экспорт</button>}
          insight={<span>Вывод</span>}
        >
          <div>Диаграмма</div>
        </ChartCard>
        <ChartCard title="Без вывода" description="Описание">
          <div>Данные</div>
        </ChartCard>
        <MetricCard
          label="Метрика"
          value={42}
          note="Комментарий"
          icon={<span>Иконка</span>}
          tone="brand"
          className="metric-custom"
        />
        {(['neutral', 'programA', 'programB', 'shared'] as const).map((tone) => (
          <MetricCard key={tone} label={tone} value={0} tone={tone} />
        ))}
        <EmptyState
          title="Пусто"
          text="Здесь ничего нет"
          action={<button>Добавить</button>}
          icon={<span>Своя иконка</span>}
        />
        <EmptyState title="Ещё пусто" text="Нет данных" />
        <LoadingState />
        <LoadingState label="Особая загрузка" rows={1} />
        <ErrorState title="Ошибка" text="Не удалось" onRetry={retry} />
        <ErrorState title="Ошибка без повтора" text="Стоп" />
        <SuccessState>Готово</SuccessState>
        <InlineLoading label="Сохраняем" />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByText('Вывод')).toBeInTheDocument();
    expect(screen.getByText('Своя иконка')).toBeInTheDocument();
    expect(screen.getByLabelText('Особая загрузка')).toBeInTheDocument();
  });

  it('renders all comparison indicators', () => {
    render(
      <>
        {(['more', 'less', 'equal', 'onlyA', 'onlyB'] as const).map((state) => (
          <ComparisonIndicator key={state} state={state} className="indicator-custom">
            {state}
          </ComparisonIndicator>
        ))}
      </>,
    );
    expect(screen.getByText('more')).toBeInTheDocument();
    expect(screen.getByText('onlyB')).toBeInTheDocument();
  });
});

describe('curriculum components', () => {
  it('renders desktop/mobile disciplines including missing and zero values', () => {
    const disciplines = [
      plan().disciplines[0],
      {
        ...plan().disciplines[0],
        id: 2,
        name: 'Без данных',
        semester: null,
        hours: 0,
        credits: 0,
        controlForm: '',
        lectureHours: null,
        practiceHours: 0,
        labHours: undefined,
      },
    ];
    render(<DisciplineTable disciplines={disciplines} />);
    expect(screen.getAllByText('Алгоритмы')).toHaveLength(2);
    expect(screen.getAllByText('Не указано').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('groups disciplines by regular and absent semester', async () => {
    const curriculum = plan({
      disciplines: [
        plan().disciplines[0],
        { ...plan().disciplines[0], id: 2, name: 'Практика', semester: null, hours: 20 },
      ],
    });
    render(<SemesterAccordion plan={curriculum} />);
    expect(screen.getByText('Без семестра')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /1 семестр/ }));
    expect(screen.getAllByText('Алгоритмы').length).toBeGreaterThan(0);
  });

  it('renders an empty comparison and every difference direction and formatter', () => {
    const empty: PlanComparison = {
      firstPlan: plan(),
      secondPlan: plan({ id: 2 }),
      summary: {
        firstDisciplinesCount: 1,
        secondDisciplinesCount: 1,
        commonCount: 1,
        onlyFirstCount: 0,
        onlySecondCount: 0,
      },
      commonDisciplines: [],
      onlyInFirst: [],
      onlyInSecond: [],
    };
    const { rerender } = render(<CompareTable comparison={empty} />);
    expect(screen.getByText(/не найдено различий/)).toBeInTheDocument();

    const differences = [
      { field: 'controlForm', firstValue: null, secondValue: null },
      { field: 'controlForm', firstValue: null, secondValue: 'Экзамен' },
      { field: 'controlForm', firstValue: 'Экзамен', secondValue: '' },
      { field: 'controlForm', firstValue: 'Экзамен', secondValue: 'Зачёт' },
      { field: 'totalHours', firstValue: 'нет', secondValue: 10 },
      { field: 'credits', firstValue: 4, secondValue: 4 },
      { field: 'semesterNumber', firstValue: 1, secondValue: 2 },
      { field: 'semesterNumber', firstValue: 1, secondValue: 3 },
      { field: 'semesterNumber', firstValue: 1, secondValue: 6 },
      { field: 'semesterNumber', firstValue: 20, secondValue: 9 },
      { field: 'totalHours', firstValue: 200, secondValue: 100 },
      { field: 'lectureHours', firstValue: 10, secondValue: 20 },
      { field: 'custom', firstValue: 'A', secondValue: 'B' },
    ];
    rerender(
      <CompareTable
        comparison={{
          ...empty,
          commonDisciplines: [
            {
              name: 'Алгоритмы',
              first: plan().disciplines[0],
              second: plan().disciplines[0],
              differences,
            },
            {
              name: 'Одинаковая',
              first: plan().disciplines[0],
              second: plan().disciplines[0],
              differences: [],
            },
          ],
        }}
      />,
    );
    expect(screen.getAllByText('Оба значения не указаны').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/только в программе B/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 ЗЕТ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('custom').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/11 семестров позже/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5 семестров раньше/).length).toBeGreaterThan(0);
  });

  it('supports plan card states, comparison selection and favorites', async () => {
    const user = userEvent.setup();
    const curriculum = plan();
    const { rerender } = router(<PlanCard plan={curriculum} />);
    expect(screen.getByRole('link', { name: /Сохранить/ })).toHaveAttribute('href', '/login');
    await user.click(screen.getByRole('button', { name: /К сравнению/ }));
    expect(useAppStore.getState().compareIds).toEqual([1, null]);

    useAppStore.setState({
      user: userProfile,
      favorites: [],
      compareIds: [1, null],
      compareLevels: ['Бакалавриат', null],
    });
    rerender(
      <MemoryRouter>
        <PlanCard plan={curriculum} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /В сравнении/ }));
    expect(useAppStore.getState().compareIds).toEqual([null, null]);
    await user.click(screen.getByRole('button', { name: /В избранное/ }));
    expect(useAppStore.getState().favorites).toEqual([1]);

    useAppStore.setState({
      user: userProfile,
      favorites: [1],
      compareIds: [2, null],
      compareLevels: ['Магистратура', null],
    });
    rerender(
      <MemoryRouter>
        <PlanCard plan={curriculum} variant="compact" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Другой уровень/ })).toBeDisabled();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Магистратура');
    await user.click(screen.getByRole('button', { name: /Сохранено/ }));
    expect(useAppStore.getState().favorites).toEqual([]);

    rerender(
      <MemoryRouter>
        <PlanCard
          plan={plan({
            id: 3,
            profile: 'Профиль',
            direction: 'Направление',
            totalHours: 0,
            credits: 0,
            code: undefined,
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Код не указан')).toBeInTheDocument();
    expect(screen.getByText(/Направление:/)).toBeInTheDocument();
  });
});

describe('forms, navigation and filters', () => {
  it('logs in, registers and displays Error and non-Error failures', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login)
      .mockResolvedValueOnce(userProfile)
      .mockRejectedValueOnce(new Error('Неверные данные'))
      .mockRejectedValueOnce('failure');
    const { unmount } = router(
      <Routes>
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/profile" element={<div>Профиль открыт</div>} />
      </Routes>,
      ['/login'],
    );
    await user.type(screen.getByLabelText('Электронная почта'), userProfile.email);
    await user.type(screen.getByLabelText('Пароль'), 'long-secure-password');
    await user.click(screen.getByRole('button', { name: /Войти и открыть профиль/ }));
    expect(await screen.findByText('Профиль открыт')).toBeInTheDocument();
    expect(useAppStore.getState().user).toEqual(userProfile);
    unmount();

    const failed = router(<AuthForm mode="login" />, ['/login']);
    await user.type(screen.getByLabelText('Электронная почта'), userProfile.email);
    await user.type(screen.getByLabelText('Пароль'), 'bad-password');
    await user.click(screen.getByRole('button', { name: /Войти/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверные данные');
    await user.click(screen.getByRole('button', { name: /Войти/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось выполнить запрос');
    failed.unmount();

    vi.mocked(authApi.register).mockResolvedValueOnce(userProfile);
    router(
      <Routes>
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route path="/profile" element={<div>Новый профиль</div>} />
      </Routes>,
      ['/register'],
    );
    await user.type(screen.getByLabelText('Имя и фамилия'), userProfile.fullName);
    await user.type(screen.getByLabelText('Электронная почта'), userProfile.email);
    await user.type(screen.getByLabelText('Пароль'), 'long-secure-password');
    await user.click(screen.getByRole('button', { name: /Создать аккаунт/ }));
    expect(await screen.findByText('Новый профиль')).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith(
      userProfile.fullName,
      userProfile.email,
      'long-secure-password',
    );
  });

  it('navigates in the header as a guest and authenticated user', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ compareIds: [1, 2], compareLevels: ['Бакалавриат', 'Бакалавриат'] });
    const { rerender } = router(<Header />);
    expect(screen.getByLabelText('Выбрано программ: 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Войти/ })).toHaveAttribute('href', '/login');
    await user.click(screen.getByRole('button', { name: 'Открыть меню' }));
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('open');
    await user.click(screen.getByRole('link', { name: 'Подбор по интересам', hidden: true }));

    useAppStore.setState({ user: userProfile });
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Открыть меню профиля' }));
    await user.click(screen.getByRole('link', { name: 'Избранное и история' }));
    await user.click(screen.getByRole('button', { name: 'Открыть меню профиля' }));
    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(useAppStore.getState().user).toBeNull();

    useAppStore.setState({ user: userProfile });
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Открыть меню' }));
    const mobileNav = screen.getByRole('navigation', { name: 'Мобильная навигация', hidden: true });
    await user.click(
      within(mobileNav).getByRole('link', { name: 'Избранное и история', hidden: true }),
    );
    await user.click(screen.getByRole('button', { name: 'Открыть меню' }));
    await user.click(within(mobileNav).getByRole('button', { name: 'Выйти', hidden: true }));
    expect(useAppStore.getState().user).toBeNull();

    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Открыть меню' }));
    await user.click(
      within(
        screen.getByRole('navigation', { name: 'Мобильная навигация', hidden: true }),
      ).getByRole('link', { name: 'Войти в аккаунт', hidden: true }),
    );
  });

  it('selects and clears comparison plans while enforcing education level', async () => {
    const user = userEvent.setup();
    const plans = [
      plan(),
      plan({ id: 2, title: 'Магистратура', level: 'Магистратура' }),
      plan({ id: 3, title: 'Вторая программа' }),
    ];
    const onChange = vi.fn();
    const { rerender } = render(
      <PlanSelector
        side="A"
        value={null}
        plans={plans}
        excludedId={null}
        requiredLevel={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Первая программа задаст уровень/)).toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: /Вторая программа/ }));
    expect(onChange).toHaveBeenCalledWith(3);

    rerender(
      <PlanSelector
        side="B"
        value={1}
        plans={plans}
        excludedId={3}
        requiredLevel="Бакалавриат"
        onChange={onChange}
      />,
    );
    expect(screen.getAllByText(/Разработка программного обеспечения/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Очистить/ }));
    expect(onChange).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('option', { name: /Магистратура/ })).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Вторая программа/ })).toHaveAttribute(
      'data-disabled',
    );
    rerender(
      <PlanSelector
        side="B"
        value={null}
        plans={plans}
        excludedId={null}
        requiredLevel="Бакалавриат"
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Доступны только программы уровня «Бакалавриат».')).toBeInTheDocument();
  });

  it('searches, filters and resets on desktop and mobile', async () => {
    const user = userEvent.setup();
    const filters: PlanFilters = {
      query: '',
      faculty: 'all',
      direction: 'all',
      profile: 'all',
      level: 'all',
      studyForm: 'all',
    };
    const config = [
      {
        key: 'level' as const,
        label: 'Уровень',
        placeholder: 'Любой',
        options: [{ value: 'Бакалавриат', label: 'Бакалавриат' }],
      },
    ];
    const onChange = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(
      <SearchFilters
        config={config}
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        activeCount={0}
      />,
    );
    await user.type(screen.getByLabelText('Название, направление или код'), 'web');
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, query: 'b' });
    await user.click(screen.getAllByRole('combobox', { name: 'Уровень' })[0]);
    await user.click(await screen.findByRole('option', { name: 'Бакалавриат' }));
    expect(onChange).toHaveBeenCalledWith({ ...filters, level: 'Бакалавриат' });

    rerender(
      <SearchFilters
        config={config}
        filters={{ ...filters, query: 'web' }}
        onChange={onChange}
        onReset={onReset}
        activeCount={1}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(onReset).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: /Фильтры/ }));
    const dialog = screen.getByRole('dialog', { hidden: true });
    await user.click(
      within(dialog).getByRole('button', { name: 'Показать программы', hidden: true }),
    );
    await user.click(screen.getByRole('button', { name: /Фильтры/ }));
    await user.click(
      within(dialog).getByRole('button', { name: 'Сбросить фильтры', hidden: true }),
    );
    expect(onReset).toHaveBeenCalledTimes(2);
  });
});
