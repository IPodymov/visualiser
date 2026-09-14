import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlansPage } from '@features/plan-catalog/ui/PlansPage';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
import { plan } from './fixtures';

const api = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@entities/plan/api/plans', () => ({ plansApi: { list: api.list } }));
vi.mock('@entities/faculty/api/faculties', () => ({
  facultiesApi: { list: async () => [] },
}));

const bachelor = plan({ id: 1, title: 'Первый бакалавриат' });
const second = plan({
  id: 2,
  title: 'Второй бакалавриат',
  level: 'Высшее образование — бакалавриат',
});
const master = plan({ id: 3, title: 'Программа магистратуры', level: 'Магистратура' });
const card = (title: string) =>
  within(screen.getByRole('heading', { name: title }).closest('article')!);

beforeEach(() => {
  api.list.mockResolvedValue([bachelor, second, master]);
  useWorkspaceStore.setState({ compareIds: [null, null], compareLevels: [null, null], user: null });
});

describe('catalog comparison selection', () => {
  it.each([false, true])(
    'resets search, filters and both comparison slots (drawer: %s)',
    async (inDrawer) => {
      useWorkspaceStore.getState().addToCompare(bachelor);
      useWorkspaceStore.getState().addToCompare(second);
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <PlansPage />
        </MemoryRouter>,
      );
      await screen.findByRole('heading', { name: bachelor.title });
      await user.type(screen.getByRole('textbox'), 'Первый');
      expect(screen.getAllByRole('article')).toHaveLength(1);
      if (inDrawer) {
        await user.click(screen.getByRole('button', { name: /Фильтры/ }));
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Сбросить всё' }),
        );
      } else {
        await user.click(screen.getByRole('button', { name: 'Сбросить всё' }));
      }
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getAllByRole('article')).toHaveLength(3);
      expect(screen.queryByLabelText('Активные фильтры')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Уровень' })).toHaveTextContent('Все варианты');
      expect(useWorkspaceStore.getState().compareIds).toEqual([null, null]);
      expect(useWorkspaceStore.getState().compareLevels).toEqual([null, null]);
      expect(JSON.parse(localStorage.getItem('eduplan-compare')!).ids).toEqual([null, null]);
      expect(screen.getByRole('button', { name: 'Сбросить всё' })).toBeDisabled();
    },
  );

  it('narrows the list on selection, keeps it after removing one of two plans, and restores it after the last removal', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: master.title });
    await user.click(card(bachelor.title).getByRole('button', { name: 'К сравнению' }));
    expect(screen.queryByRole('heading', { name: master.title })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('combobox', { name: 'Уровень' })).not.toBeInTheDocument();
    await user.click(card(second.title).getByRole('button', { name: 'К сравнению' }));
    await user.click(card(bachelor.title).getByRole('button', { name: 'В сравнении' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    await user.click(card(second.title).getByRole('button', { name: 'В сравнении' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('combobox', { name: 'Уровень' })).toBeInTheDocument();
  });

  it('honors an existing selection in the second slot and allows clearing it from the catalog', async () => {
    useWorkspaceStore.getState().setComparePlan(1, master);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: master.title });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('«Магистратура»');
    await user.click(screen.getByRole('button', { name: 'Очистить выбор для сравнения' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(useWorkspaceStore.getState().compareIds).toEqual([null, null]);
  });

  it('keeps the comparison level when search filters are reset', async () => {
    useWorkspaceStore.getState().addToCompare(bachelor);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PlansPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: bachelor.title });
    await user.type(screen.getByRole('textbox'), 'Нет такой программы');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: master.title })).not.toBeInTheDocument();
  });
});
