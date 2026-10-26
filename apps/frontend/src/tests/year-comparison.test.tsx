import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { PlanComparison } from '@features/comparison/model/types';
import type { PlanVersions } from '@features/year-comparison/model/types';
import { YearComparisonSection } from '@features/year-comparison/ui/YearComparisonSection/YearComparisonSection';
import { plan } from './fixtures';

const discipline = plan().disciplines[0];
const currentPlan = plan({
  id: 10,
  year: 2025,
  disciplines: [
    { ...discipline, id: 1, name: 'Алгоритмы', semester: 1, hours: 180, credits: 5 },
    { ...discipline, id: 2, name: 'Нейросети', semester: 2, hours: 108, credits: 3 },
  ],
});
const previousPlan = plan({
  id: 8,
  year: 2024,
  disciplines: [
    { ...discipline, id: 3, name: 'Алгоритмы', semester: 1, hours: 144, credits: 4 },
    { ...discipline, id: 4, name: 'Черчение', semester: 1, hours: 72, credits: 2 },
  ],
});

const versions = (overrides: Partial<PlanVersions> = {}): PlanVersions => ({
  curriculumId: 10,
  admissionYear: 2025,
  catalogYear: 2025,
  isArchived: false,
  previous: {
    curriculumId: 8,
    admissionYear: 2024,
    sourceFileName: '2024-plan.xlsx',
    candidatesCount: 2,
  },
  next: null,
  versions: [],
  ...overrides,
});

const comparison: PlanComparison = {
  firstPlan: currentPlan,
  secondPlan: previousPlan,
  summary: {
    firstDisciplinesCount: 2,
    secondDisciplinesCount: 2,
    commonCount: 1,
    onlyFirstCount: 1,
    onlySecondCount: 1,
  },
  commonDisciplines: [
    {
      name: 'Алгоритмы',
      first: currentPlan.disciplines[0],
      second: previousPlan.disciplines[0],
      differences: [{ field: 'totalHours', firstValue: 180, secondValue: 144 }],
    },
  ],
  onlyInFirst: [currentPlan.disciplines[1]],
  onlyInSecond: [previousPlan.disciplines[1]],
};

const renderSection = (
  state: Parameters<typeof YearComparisonSection>[0]['state'],
  target = currentPlan,
) =>
  render(
    <MemoryRouter>
      <YearComparisonSection plan={target} state={state} />
    </MemoryRouter>,
  );

describe('year-over-year plan comparison', () => {
  it('shows current-minus-previous deltas, discipline changes and the archive link', async () => {
    renderSection({
      data: { versions: versions(), comparison },
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    expect(screen.getByRole('heading', { name: 'Изменения с 2024 года' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть план 2024/ })).toHaveAttribute(
      'href',
      '/plans/8',
    );
    const table = screen.getByRole('region', { name: 'Показатели плана 2025 и 2024 года' });
    const hoursRow = within(table).getByRole('row', { name: /Общая нагрузка/ });
    expect(within(hoursRow).getByText('288 ч.')).toBeInTheDocument();
    expect(within(hoursRow).getByText('216 ч.')).toBeInTheDocument();
    expect(within(hoursRow).getByText('В 2025 на 72 ч. больше')).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /2 семестр/ })).toHaveTextContent(
      'Только в 2025',
    );
    expect(
      screen.getByText(
        /В 2025 году добавлено дисциплин: 1, убрано: 1; общая нагрузка выросла на 72 ч./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Нейросети')).toBeInTheDocument();
    expect(screen.getByText(/найдено несколько версий этого плана \(2\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Убраны · 1' }));
    expect(screen.getByText('Черчение')).toBeInTheDocument();
  });

  it('covers loading, error, missing previous year and archived plans', async () => {
    const retry = vi.fn();
    const { rerender } = renderSection({ data: null, loading: true, error: null, retry });
    expect(screen.getByLabelText('Сравниваем план с прошлым годом')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <YearComparisonSection
          plan={currentPlan}
          state={{ data: null, loading: false, error: 'Сервер недоступен', retry }}
        />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(retry).toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <YearComparisonSection
          plan={previousPlan}
          state={{
            data: {
              versions: versions({
                curriculumId: 8,
                admissionYear: 2024,
                isArchived: true,
                previous: null,
                next: {
                  curriculumId: 10,
                  admissionYear: 2025,
                  sourceFileName: '2025-plan.xlsx',
                  candidatesCount: 1,
                },
              }),
              comparison: null,
            },
            loading: false,
            error: null,
            retry,
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('План 2023 года не найден')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть план 2025/ })).toHaveAttribute(
      'href',
      '/plans/10',
    );
  });
});
