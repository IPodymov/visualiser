import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdmissionSurveyPage } from '../pages/AdmissionSurveyPage/AdmissionSurveyPage';
import { plansApi } from '../services/api/plans';
import type { PlanRecommendation } from '../types/plan';

vi.mock('../services/api/plans', () => ({
  plansApi: { recommend: vi.fn(), list: vi.fn(), getById: vi.fn(), compare: vi.fn() },
}));

const storageKey = 'eduplan-admission-survey-v2';
const recommendation = (overrides: Partial<PlanRecommendation> = {}): PlanRecommendation => ({
  planId: 1,
  title: 'Программная инженерия',
  faculty: 'ФИТ',
  level: 'Бакалавриат',
  studyForm: 'Очная',
  year: 2025,
  duration: '4 года',
  disciplinesCount: 50,
  totalHours: 7200,
  credits: 240,
  matchPercent: 91,
  reason: 'Совпадают интересы к разработке',
  matchedDisciplines: ['Алгоритмы', 'Веб-разработка'],
  ...overrides,
});

const renderSurvey = () => render(<MemoryRouter><AdmissionSurveyPage /></MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  vi.mocked(plansApi.recommend).mockReset();
});

describe('admission survey persistence', () => {
  it('starts safely with absent or corrupted local state', () => {
    const first = renderSurvey();
    expect(screen.getByText('Вопрос 1 из 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
    first.unmount();

    localStorage.setItem(storageKey, '{bad json');
    renderSurvey();
    expect(screen.getByText('Вопрос 1 из 10')).toBeInTheDocument();
  });

  it('normalizes malformed saved fields and clamps an oversized step', () => {
    localStorage.setItem(storageKey, JSON.stringify({ answers: 'bad', step: 'bad', planRecommendations: 'bad' }));
    const first = renderSurvey();
    expect(screen.getByText('Вопрос 1 из 10')).toBeInTheDocument();
    first.unmount();

    localStorage.setItem(storageKey, JSON.stringify({ answers: [{ questionId: 'career', optionId: 'developer' }], step: 999 }));
    renderSurvey();
    expect(screen.getByRole('heading', { name: 'Какая роль после обучения звучит ближе?' })).toBeInTheDocument();
  });

  it('restores confirmed results from this browser without a new request', () => {
    localStorage.setItem(storageKey, JSON.stringify({
      answers: [],
      step: 9,
      completedAt: '2025-01-01T10:00:00.000Z',
      confirmedAt: '2025-01-01T10:01:00.000Z',
      planRecommendations: [recommendation()],
    }));
    renderSurvey();
    expect(screen.getByText('Подбор готов')).toBeInTheDocument();
    expect(screen.getByText('Программная инженерия')).toBeInTheDocument();
    expect(plansApi.recommend).not.toHaveBeenCalled();
  });
});

describe('complete admission journey', () => {
  it('answers, revises, completes, returns to answers and persists every step', async () => {
    const user = userEvent.setup();
    renderSurvey();
    await user.click(screen.getByRole('button', { name: /Бакалавриат/ }));
    expect(screen.getByText('Вопрос 2 из 10')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('button', { name: /Бакалавриат/ })).toHaveClass('admission-survey__option--selected');
    await user.click(screen.getByRole('button', { name: /Специалитет/ }));

    for (const label of [
      /Очная/,
      /Код и логика/,
      /Больше практики/,
      /Веб-сервисы/,
      /Аналитика данных/,
      /Роботы и беспилотники/,
      /Визуальный продукт/,
      /Готов к глубокой базе/,
      /Разработчик/,
    ]) {
      await user.click(screen.getByRole('button', { name: label }));
    }

    expect(screen.getByRole('heading', { name: 'Подтвердите прохождение теста' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    expect(saved.answers).toHaveLength(10);
    expect(saved.completedAt).toEqual(expect.any(String));

    await user.click(screen.getByRole('button', { name: 'Вернуться к ответам' }));
    expect(screen.getByRole('heading', { name: 'Насколько вам близка математика и исследование?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Готов к глубокой базе/ })).toHaveClass('admission-survey__option--selected');
  });

  it('confirms server recommendations, displays evidence and safely renders hostile text', async () => {
    const user = userEvent.setup();
    let resolve!: (value: PlanRecommendation[]) => void;
    vi.mocked(plansApi.recommend).mockImplementation(() => new Promise((success) => { resolve = success; }));
    localStorage.setItem(storageKey, JSON.stringify({
      answers: [
        { questionId: 'educationLevel', optionId: 'bachelor' },
        { questionId: 'studyForm', optionId: 'fullTime' },
        { questionId: 'background', optionId: 'code' },
        { questionId: 'unknown', optionId: 'unknown' },
      ],
      step: 9,
      completedAt: '2025-01-01T10:00:00.000Z',
    }));
    renderSurvey();
    await user.click(screen.getByRole('button', { name: 'Подтверждаю, тест пройден' }));
    expect(screen.getByRole('button', { name: 'Получаем рекомендации' })).toBeDisabled();
    expect(plansApi.recommend).toHaveBeenCalledWith(expect.objectContaining({
      educationLevel: 'bachelor',
      studyForm: 'fullTime',
      limit: 8,
      weights: expect.objectContaining({ software: 4, web: 2 }),
    }));

    resolve([
      recommendation({ title: '<img src=x onerror=alert(1)>', reason: '<script>alert(1)</script>' }),
      recommendation({ planId: 2, title: 'Без совпавших дисциплин', level: 'Специалитет', credits: 150, matchedDisciplines: [] }),
    ]);
    expect(await screen.findByText('Подобранные учебные планы')).toBeInTheDocument();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText(/100% нагрузки/)).toBeInTheDocument();
    expect(screen.getByText(/50% нагрузки/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Открыть учебный план/ })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Пройти заново' }));
    expect(screen.getByText('Вопрос 1 из 10')).toBeInTheDocument();
    expect(localStorage.getItem(storageKey)).not.toBeNull();
  });

  it('offers retry after an empty server result or network failure', async () => {
    const user = userEvent.setup();
    vi.mocked(plansApi.recommend).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline'));
    localStorage.setItem(storageKey, JSON.stringify({ answers: [], step: 9, completedAt: '2025-01-01T10:00:00.000Z' }));
    renderSurvey();

    await user.click(screen.getByRole('button', { name: 'Подтверждаю, тест пройден' }));
    expect(await screen.findByText(/Не удалось получить рекомендации/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Подтверждаю, тест пройден' }));
    await waitFor(() => expect(plansApi.recommend).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/Не удалось получить рекомендации/)).toBeInTheDocument();
  });

  it('does not treat an empty restored recommendation list as confirmed', () => {
    localStorage.setItem(storageKey, JSON.stringify({
      answers: [], step: 9, completedAt: '2025-01-01T10:00:00.000Z', confirmedAt: '2025-01-01T10:01:00.000Z', planRecommendations: [],
    }));
    renderSurvey();
    expect(screen.getByRole('heading', { name: 'Подтвердите прохождение теста' })).toBeInTheDocument();
  });
});
