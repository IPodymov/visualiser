import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@app/App';
import { authApi } from '@features/auth/api/auth';
import { useWorkspaceStore as useAppStore } from '@features/workspace/model/useWorkspaceStore';

vi.mock('@features/auth/api/auth', () => ({ authApi: { me: vi.fn() } }));
vi.mock('@features/home/ui/HomePage', () => ({ HomePage: () => <main>PAGE:HOME</main> }));
vi.mock('@features/admission-survey/ui/AdmissionSurveyPage', () => ({
  AdmissionSurveyPage: () => <main>PAGE:SURVEY</main>,
}));
vi.mock('@features/auth/ui/AuthPage', () => ({
  AuthPage: ({ mode }: { mode: string }) => <main>PAGE:AUTH:{mode}</main>,
}));
vi.mock('@features/comparison/ui/ComparePage', () => ({
  ComparePage: () => <main>PAGE:COMPARE</main>,
}));
vi.mock('@features/plan-details/ui/PlanDetailsPage', () => ({
  PlanDetailsPage: () => <main>PAGE:DETAILS</main>,
}));
vi.mock('@features/plan-catalog/ui/PlansPage', () => ({
  PlansPage: () => <main>PAGE:PLANS</main>,
}));
vi.mock('@features/profile/ui/ProfilePage', () => ({
  ProfilePage: () => <main>PAGE:PROFILE</main>,
}));

const profile = {
  id: 1,
  email: 'student@example.ru',
  fullName: 'Student',
  createdAt: '2025-01-01',
};

const visit = async (path: string) => {
  await act(async () => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
};

beforeEach(async () => {
  vi.mocked(authApi.me).mockReset();
  localStorage.clear();
  useAppStore.setState({
    user: null,
    favorites: [],
    compareIds: [null, null],
    compareLevels: [null, null],
    history: [],
  });
  await visit('/');
});

describe('application shell and routes', () => {
  it('renders every public route, layout navigation and redirects an unknown URL', async () => {
    render(<App />);
    expect(screen.getByLabelText('Открываем страницу')).toBeInTheDocument();
    expect(await screen.findByText('PAGE:HOME')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });

    await userEvent.click(
      within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', {
        name: 'Учебные планы',
      }),
    );
    expect(await screen.findByText('PAGE:PLANS')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /Сравнить/ }));
    expect(await screen.findByText('PAGE:COMPARE')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Подбор по интересам' }));
    expect(await screen.findByText('PAGE:SURVEY')).toBeInTheDocument();

    for (const [path, text] of [
      ['/login', 'PAGE:AUTH:login'],
      ['/register', 'PAGE:AUTH:register'],
      ['/plans/42', 'PAGE:DETAILS'],
      ['/profile', 'PAGE:PROFILE'],
    ]) {
      await visit(path);
      expect(await screen.findByText(text)).toBeInTheDocument();
    }

    await visit('/missing?source=test');
    expect(await screen.findByText('PAGE:HOME')).toBeInTheDocument();
  });

  it('does not request a session without a locally stored token', async () => {
    render(<App />);
    await screen.findByText('PAGE:HOME');
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('restores a valid authenticated session', async () => {
    localStorage.setItem('eduplan-token', 'token');
    vi.mocked(authApi.me).mockResolvedValue(profile);
    render(<App />);
    await waitFor(() => expect(useAppStore.getState().user).toEqual(profile));
  });

  it('clears an expired or forged token when session restoration fails', async () => {
    localStorage.setItem('eduplan-token', 'forged-token');
    useAppStore.setState({ user: profile });
    vi.mocked(authApi.me).mockRejectedValue(new Error('unauthorized'));
    render(<App />);
    await waitFor(() => expect(useAppStore.getState().user).toBeNull());
    expect(localStorage.getItem('eduplan-token')).toBeNull();
  });
});
