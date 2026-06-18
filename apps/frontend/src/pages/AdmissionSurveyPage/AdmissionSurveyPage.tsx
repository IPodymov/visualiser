import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Check,
  Clock3,
  GraduationCap,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import './AdmissionSurveyPage.css';
import { Button } from '../../components/ui/button';
import { plansApi } from '../../services/api/plans';
import type {
  AdmissionCategory,
  AdmissionEducationLevel,
  AdmissionStudyForm,
  PlanRecommendation,
} from '../../types/plan';
import { cn } from '../../utils/cn';
import { getCreditsNorm, getCreditsPercent } from '../../utils/credits';

const storageKey = 'eduplan-admission-survey-v2';

type Category = AdmissionCategory;
type SurveyBlock = 'context' | 'interests';

type SurveyAnswer = {
  questionId: string;
  optionId: string;
};

type SurveyOption = {
  id: string;
  label: string;
  text: string;
  weights: Partial<Record<Category, number>>;
  educationLevel?: AdmissionEducationLevel;
  studyForm?: AdmissionStudyForm;
};

type SurveyQuestion = {
  id: string;
  block: SurveyBlock;
  title: string;
  hint: string;
  options: SurveyOption[];
};

type SavedSurveyState = {
  answers: SurveyAnswer[];
  step: number;
  completedAt?: string;
  confirmedAt?: string;
  planRecommendations?: PlanRecommendation[];
};

const questionBlocks: Record<SurveyBlock, { title: string; description: string }> = {
  context: {
    title: 'Блок 1. Контекст поступления',
    description: 'Уточняем уровень, форму и комфортный тип обучения.',
  },
  interests: {
    title: 'Блок 2. Интересы и проекты',
    description: 'Разбираем, какие направления из загруженных учебных планов ближе всего.',
  },
};

const questions: SurveyQuestion[] = [
  {
    id: 'educationLevel',
    block: 'context',
    title: 'На какой уровень образования вы поступаете?',
    hint: 'В подборе используются учебные планы всех факультетов, уровней и форм обучения.',
    options: [
      {
        id: 'bachelor',
        label: 'Бакалавриат',
        text: 'Первое высшее образование после школы или колледжа',
        weights: {},
        educationLevel: 'bachelor',
      },
      {
        id: 'specialist',
        label: 'Специалитет',
        text: 'Длинная программа с углубленной профессиональной подготовкой',
        weights: { security: 1, engineering: 1, mediaDesign: 1 },
        educationLevel: 'specialist',
      },
      {
        id: 'master',
        label: 'Магистратура',
        text: 'Следующий уровень после бакалавриата или специалитета',
        weights: { research: 2, management: 1 },
        educationLevel: 'master',
      },
      {
        id: 'postgraduate',
        label: 'Аспирантура',
        text: 'Научная траектория и исследовательские задачи',
        weights: { research: 5, ai: 1, math: 1 },
        educationLevel: 'postgraduate',
      },
    ],
  },
  {
    id: 'studyForm',
    block: 'context',
    title: 'Какая форма обучения нужна?',
    hint: 'В рекомендациях это будет учитываться как сильное ограничение.',
    options: [
      {
        id: 'fullTime',
        label: 'Очная',
        text: 'Учиться в основном в университете',
        weights: {},
        studyForm: 'fullTime',
      },
      {
        id: 'partTime',
        label: 'Заочная',
        text: 'Совмещать учебу с работой или другим городом',
        weights: { businessIt: 1, software: 1 },
        studyForm: 'partTime',
      },
      {
        id: 'evening',
        label: 'Очно-заочная',
        text: 'Нужен смешанный режим посещения',
        weights: { management: 1, businessIt: 1 },
        studyForm: 'evening',
      },
    ],
  },
  {
    id: 'background',
    block: 'context',
    title: 'С чем уже есть уверенность?',
    hint: 'Это помогает не путать творческие, инженерные, ИТ и исследовательские планы.',
    options: [
      {
        id: 'code',
        label: 'Код и логика',
        text: 'Алгоритмы, программирование, информатика',
        weights: { software: 4, web: 2, systems: 1 },
      },
      {
        id: 'math',
        label: 'Математика и анализ',
        text: 'Формулы, модели, закономерности',
        weights: { math: 4, data: 3, ai: 2 },
      },
      {
        id: 'design',
        label: 'Визуальная среда',
        text: 'Дизайн, медиа, игры, графика',
        weights: { mediaDesign: 4, gamedev: 2, xr: 2 },
      },
      {
        id: 'engineering',
        label: 'Техника и устройства',
        text: 'Механизмы, электроника, оборудование',
        weights: { engineering: 4, robotics: 3, embedded: 2 },
      },
    ],
  },
  {
    id: 'learningStyle',
    block: 'context',
    title: 'Какой учебный темп комфортнее?',
    hint: 'Подбор различает прикладные, системные и научные траектории.',
    options: [
      {
        id: 'practice',
        label: 'Больше практики',
        text: 'Лабораторные, прототипы, рабочие решения',
        weights: { software: 2, web: 2, businessIt: 1, engineering: 1 },
      },
      {
        id: 'foundation',
        label: 'Сначала база',
        text: 'Теория, математика, фундаментальные дисциплины',
        weights: { math: 4, research: 2, systems: 1 },
      },
      {
        id: 'team',
        label: 'Проекты и команды',
        text: 'Роли, планирование, презентация результата',
        weights: { management: 3, businessIt: 2, mediaDesign: 1 },
      },
      {
        id: 'experiment',
        label: 'Эксперименты',
        text: 'Пробовать гипотезы и сравнивать подходы',
        weights: { research: 3, ai: 2, data: 2 },
      },
    ],
  },
  {
    id: 'digitalProduct',
    block: 'interests',
    title: 'Какой цифровой продукт хочется делать?',
    hint: 'В базе есть веб, мобильные технологии, бизнес-приложения, игры и VR/AR.',
    options: [
      {
        id: 'web',
        label: 'Веб-сервисы',
        text: 'Сайты, интерфейсы, backend и frontend',
        weights: { web: 5, software: 3 },
      },
      {
        id: 'mobileBusiness',
        label: 'Бизнес-приложения',
        text: 'Корпоративные системы, 1С, интеграции',
        weights: { businessIt: 5, systems: 2, software: 1 },
      },
      {
        id: 'games',
        label: 'Игры',
        text: 'Игровая индустрия и интерактивные приложения',
        weights: { gamedev: 5, software: 2, mediaDesign: 1 },
      },
      {
        id: 'xr',
        label: 'VR/AR',
        text: 'Виртуальная, дополненная и смешанная реальность',
        weights: { xr: 5, mediaDesign: 2, software: 1 },
      },
    ],
  },
  {
    id: 'dataDirection',
    block: 'interests',
    title: 'Что ближе в работе с информацией?',
    hint: 'В загруженных планах отдельно встречаются данные, ИИ, системный анализ и безопасность.',
    options: [
      {
        id: 'analytics',
        label: 'Аналитика данных',
        text: 'Искать закономерности и строить выводы',
        weights: { data: 5, math: 2 },
      },
      {
        id: 'ai',
        label: 'ИИ и машинное обучение',
        text: 'Модели, обучение, интеллектуальные системы',
        weights: { ai: 5, data: 2, math: 2 },
      },
      {
        id: 'security',
        label: 'Информационная безопасность',
        text: 'Защита систем, риски, кибербезопасность',
        weights: { security: 5, systems: 2 },
      },
      {
        id: 'systems',
        label: 'Информационные системы',
        text: 'Автоматизация, инфраструктура, управление данными',
        weights: { systems: 5, businessIt: 2 },
      },
    ],
  },
  {
    id: 'engineeringDirection',
    block: 'interests',
    title: 'Какая техническая область выглядит живее?',
    hint: 'Этот вопрос нужен для планов по робототехнике, устройствам и инженерным технологиям.',
    options: [
      {
        id: 'robotics',
        label: 'Роботы и беспилотники',
        text: 'Автономные системы, управление, датчики',
        weights: { robotics: 5, ai: 2, embedded: 1 },
      },
      {
        id: 'embedded',
        label: 'Электронные устройства',
        text: 'Программирование устройств и аппаратные системы',
        weights: { embedded: 5, software: 2, engineering: 1 },
      },
      {
        id: 'industrial',
        label: 'Производство и оборудование',
        text: 'Материалы, машины, технологические процессы',
        weights: { engineering: 5, management: 1 },
      },
      {
        id: 'notNow',
        label: 'Не главный фокус',
        text: 'Скорее интересны цифровые или управленческие задачи',
        weights: { software: 1, businessIt: 1, management: 1 },
      },
    ],
  },
  {
    id: 'creativeBusiness',
    block: 'interests',
    title: 'Какой результат хочется показывать людям?',
    hint: 'В базе есть креативные индустрии, дизайн, издательское дело, маркетинг и управление.',
    options: [
      {
        id: 'visual',
        label: 'Визуальный продукт',
        text: 'Дизайн, графика, медиа, арт-объекты',
        weights: { mediaDesign: 5, xr: 1 },
      },
      {
        id: 'content',
        label: 'Контент и издательство',
        text: 'Книги, печатная продукция, коммуникации',
        weights: { mediaDesign: 4, management: 2 },
      },
      {
        id: 'innovation',
        label: 'Инновационный проект',
        text: 'Запуск, продвижение, управление изменениями',
        weights: { management: 5, businessIt: 2 },
      },
      {
        id: 'company',
        label: 'Решение для организации',
        text: 'Процессы, экономика, персонал, эффективность',
        weights: { businessIt: 4, management: 4 },
      },
    ],
  },
  {
    id: 'mathResearch',
    block: 'interests',
    title: 'Насколько вам близка математика и исследование?',
    hint: 'Это особенно влияет на аналитику, ИИ, магистратуру и аспирантуру.',
    options: [
      {
        id: 'deep',
        label: 'Готов к глубокой базе',
        text: 'Математика, модели и строгие методы интересны',
        weights: { math: 5, research: 3, ai: 2 },
      },
      {
        id: 'applied',
        label: 'Нужна прикладная польза',
        text: 'Математика ок, если видно применение',
        weights: { data: 3, engineering: 2, businessIt: 1 },
      },
      {
        id: 'research',
        label: 'Хочу исследовать',
        text: 'Гипотезы, статьи, эксперименты, новые подходы',
        weights: { research: 5, ai: 2, math: 1 },
      },
      {
        id: 'lessAbstract',
        label: 'Лучше меньше абстракций',
        text: 'Ближе интерфейсы, продукты и прикладные задачи',
        weights: { web: 2, mediaDesign: 2, businessIt: 2 },
      },
    ],
  },
  {
    id: 'career',
    block: 'interests',
    title: 'Какая роль после обучения звучит ближе?',
    hint: 'Финальный вопрос уточняет, какие планы стоит поднять выше.',
    options: [
      {
        id: 'developer',
        label: 'Разработчик',
        text: 'Писать код и развивать программные продукты',
        weights: { software: 5, web: 2, systems: 1 },
      },
      {
        id: 'analystAi',
        label: 'Аналитик или ML-специалист',
        text: 'Работать с данными, моделями и прогнозами',
        weights: { data: 4, ai: 4, math: 2 },
      },
      {
        id: 'securityEngineer',
        label: 'Инженер безопасности',
        text: 'Защищать информационные и автоматизированные системы',
        weights: { security: 5, systems: 2 },
      },
      {
        id: 'techManager',
        label: 'Технический руководитель',
        text: 'Соединять технологии, людей и задачи бизнеса',
        weights: { management: 4, businessIt: 3, systems: 1 },
      },
    ],
  },
];

const readSavedState = (): SavedSurveyState => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { answers: [], step: 0 };
    const parsed = JSON.parse(raw) as SavedSurveyState;
    return {
      answers: Array.isArray(parsed.answers) ? parsed.answers : [],
      step: Number.isInteger(parsed.step) ? parsed.step : 0,
      completedAt: parsed.completedAt,
      confirmedAt: parsed.confirmedAt,
      planRecommendations: Array.isArray(parsed.planRecommendations)
        ? parsed.planRecommendations
        : undefined,
    };
  } catch {
    return { answers: [], step: 0 };
  }
};

const getAnswerMap = (answers: SurveyAnswer[]) =>
  answers.reduce<Record<string, string>>((acc, answer) => {
    acc[answer.questionId] = answer.optionId;
    return acc;
  }, {});

const getCategoryWeights = (answers: SurveyAnswer[]) => {
  const weights: Record<Category, number> = {
    software: 0,
    web: 0,
    data: 0,
    ai: 0,
    security: 0,
    systems: 0,
    robotics: 0,
    embedded: 0,
    gamedev: 0,
    xr: 0,
    mediaDesign: 0,
    businessIt: 0,
    management: 0,
    engineering: 0,
    math: 0,
    research: 0,
  };

  answers.forEach((answer) => {
    const question = questions.find((item) => item.id === answer.questionId);
    const option = question?.options.find((item) => item.id === answer.optionId);
    Object.entries(option?.weights ?? {}).forEach(([category, value]) => {
      weights[category as Category] += value ?? 0;
    });
  });

  return weights;
};

const getSelectedEducationLevel = (answers: SurveyAnswer[]) => {
  const answer = answers.find((item) => item.questionId === 'educationLevel');
  const option = questions
    .find((item) => item.id === 'educationLevel')
    ?.options.find((item) => item.id === answer?.optionId);
  return option?.educationLevel;
};

const getSelectedStudyForm = (answers: SurveyAnswer[]) => {
  const answer = answers.find((item) => item.questionId === 'studyForm');
  const option = questions
    .find((item) => item.id === 'studyForm')
    ?.options.find((item) => item.id === answer?.optionId);
  return option?.studyForm;
};

const formatCompletedAt = (value?: string) => {
  if (!value) return 'результат сохранен';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const AdmissionSurveyPage = () => {
  const [state, setState] = useState<SavedSurveyState>(() => readSavedState());
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const answerMap = useMemo(() => getAnswerMap(state.answers), [state.answers]);
  const currentStep = Math.min(state.step, questions.length - 1);
  const currentQuestion = questions[currentStep];
  const currentBlock = questionBlocks[currentQuestion.block];
  const isTestFinished = Boolean(state.completedAt);
  const isConfirmed = Boolean(state.confirmedAt && state.planRecommendations?.length);
  const progress = isTestFinished ? 100 : Math.round((state.answers.length / questions.length) * 100);
  const recommendations = state.planRecommendations ?? [];

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const saveAnswer = (questionId: string, optionId: string) => {
    setState((previous) => {
      const answers = [
        ...previous.answers.filter((answer) => answer.questionId !== questionId),
        { questionId, optionId },
      ];
      const nextStep = Math.min(currentStep + 1, questions.length - 1);

      if (answers.length === questions.length) {
        return {
          answers,
          step: questions.length - 1,
          completedAt: new Date().toISOString(),
          confirmedAt: undefined,
          planRecommendations: undefined,
        };
      }

      return {
        answers,
        step: nextStep,
      };
    });
  };

  const resetSurvey = () => {
    setState({ answers: [], step: 0 });
    setRecommendationError(null);
    localStorage.removeItem(storageKey);
  };

  const confirmSurvey = async () => {
    setRecommendationLoading(true);
    setRecommendationError(null);

    try {
      const planRecommendations = await plansApi.recommend({
        educationLevel: getSelectedEducationLevel(state.answers),
        studyForm: getSelectedStudyForm(state.answers),
        weights: getCategoryWeights(state.answers),
        limit: 8,
      });

      if (!planRecommendations.length) {
        throw new Error('No matching curriculum recommendations');
      }

      setState((previous) => ({
        ...previous,
        confirmedAt: new Date().toISOString(),
        planRecommendations,
      }));
    } catch {
      setRecommendationError('Не удалось получить рекомендации с сервера. Проверьте подключение и попробуйте еще раз.');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const goBack = () => {
    setState((previous) => ({
      ...previous,
      step: Math.max(0, previous.step - 1),
      completedAt: undefined,
      confirmedAt: undefined,
      planRecommendations: undefined,
    }));
  };

  return (
    <main className="admission-survey container py-10">
      <section className="admission-survey__hero">
        <div className="admission-survey__hero-copy">
          <span className="admission-survey__eyebrow">
            <Sparkles className="h-4 w-4" />
            Быстрый подбор для абитуриента
          </span>
          <h1>Найдите дисциплины, с которых стоит начать выбор программы</h1>
          <p>
            Опрос разделен на два блока: сначала контекст поступления, затем интересы и проекты. Результат
            сохраняется в браузере без регистрации.
          </p>
        </div>
        <div className="admission-survey__summary" aria-label="Параметры опроса">
          <div>
            <Clock3 className="h-5 w-5 text-emerald-200" />
            <strong>2 блока</strong>
            <span>{questions.length} детальных вопросов</span>
          </div>
          <div>
            <BookOpenCheck className="h-5 w-5 text-sky-200" />
            <strong>5-8 планов</strong>
            <span>после подтверждения</span>
          </div>
          <div>
            <Save className="h-5 w-5 text-amber-200" />
            <strong>Автосохранение</strong>
            <span>без аккаунта</span>
          </div>
        </div>
      </section>

      <section className="admission-survey__workspace">
        <div className="admission-survey__progress-panel">
          <div className="admission-survey__progress-top">
            <span>
              {isConfirmed
                ? 'Подбор готов'
                : isTestFinished
                  ? 'Тест пройден'
                  : `Вопрос ${currentStep + 1} из ${questions.length}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="admission-survey__progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="admission-survey__saved">
            <Check className="h-4 w-4" />
            {isConfirmed
              ? `Подтверждено: ${formatCompletedAt(state.confirmedAt)}`
              : isTestFinished
                ? `Тест пройден: ${formatCompletedAt(state.completedAt)}`
              : 'Ответы сохраняются автоматически'}
          </div>
        </div>

        {isConfirmed ? (
          <div className="admission-survey__results">
            <div className="admission-survey__results-head">
              <div>
                <span className="admission-survey__eyebrow admission-survey__eyebrow--compact">
                  <GraduationCap className="h-4 w-4" />
                  Персональная подборка
                </span>
                <h2>Подобранные учебные планы</h2>
                <p>
                  Список сохранен на устройстве после подтверждения. Его можно открыть повторно,
                  даже если пользователь не зарегистрирован.
                </p>
                <div className="admission-survey__credits-help">
                  ЗЕТ - зачетная единица трудоемкости. Она показывает объем учебной работы:
                  занятия, практику, проекты и самостоятельную подготовку. В карточках 100% означает
                  полный нормативный объем программы: 240 ЗЕТ для бакалавриата и 300 ЗЕТ для
                  специалитета.
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={resetSurvey}>
                <RotateCcw className="h-4 w-4" />
                Пройти заново
              </Button>
            </div>

            <div className="admission-survey__result-grid">
              {recommendations.map((item, index) => (
                <article key={item.planId} className="admission-survey__result-card">
                  <div className="admission-survey__result-index">{index + 1}</div>
                  <div>
                    <div className="admission-survey__result-title">
                      <h3>{item.title}</h3>
                      <strong>{item.matchPercent}%</strong>
                    </div>
                    <p>{item.reason}</p>
                    <div className="admission-survey__meta">
                      <span>{item.faculty}</span>
                      <span>{item.level}</span>
                      <span>{item.studyForm}</span>
                      <span>{item.year}</span>
                      <span>{item.duration}</span>
                      <span>{item.disciplinesCount} дисциплин</span>
                      <span>{item.totalHours} ч.</span>
                      <span>
                        {getCreditsPercent(item.credits, item.level)}% нагрузки ({item.credits} ЗЕТ из{' '}
                        {getCreditsNorm(item.level)})
                      </span>
                    </div>
                    {item.matchedDisciplines.length ? (
                      <div className="admission-survey__matched">
                        {item.matchedDisciplines.map((discipline) => (
                          <span key={discipline}>{discipline}</span>
                        ))}
                      </div>
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/plans/${item.planId}`}>
                        Открыть учебный план
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : isTestFinished ? (
          <div className="admission-survey__card admission-survey__confirm">
            <span className="admission-survey__eyebrow admission-survey__eyebrow--compact">
              <Check className="h-4 w-4" />
              Тест пройден
            </span>
            <h2>Подтвердите прохождение теста</h2>
            <p>
              Ответы сохранены. Нажмите подтверждение, чтобы зафиксировать результат и показать
              список учебных планов, подобранных сервером на основе ваших ответов.
            </p>
            {recommendationError ? (
              <div className="admission-survey__notice admission-survey__notice--inline">
                {recommendationError}
              </div>
            ) : null}
            <div className="admission-survey__confirm-actions">
              <Button
                type="button"
                size="lg"
                disabled={recommendationLoading}
                onClick={() => void confirmSurvey()}
              >
                <Check className="h-5 w-5" />
                {recommendationLoading ? 'Получаем рекомендации' : 'Подтверждаю, тест пройден'}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                disabled={recommendationLoading}
                onClick={goBack}
              >
                <ArrowLeft className="h-5 w-5" />
                Вернуться к ответам
              </Button>
            </div>
          </div>
        ) : (
          <div className="admission-survey__card">
          <div className="admission-survey__question-head">
            <div>
              <span className="admission-survey__block-label">{currentBlock.title}</span>
              <h2>{currentQuestion.title}</h2>
              <p>{currentQuestion.hint}</p>
              <small>{currentBlock.description}</small>
            </div>
            <BrainCircuit className="h-8 w-8 text-cyan-200" />
          </div>

            <div className="admission-survey__options">
              {currentQuestion.options.map((option) => {
                const selected = answerMap[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'admission-survey__option',
                      selected && 'admission-survey__option--selected',
                    )}
                    onClick={() => saveAnswer(currentQuestion.id, option.id)}
                  >
                    <span className="admission-survey__option-marker">
                      {selected ? <Check className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                    </span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.text}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="admission-survey__controls">
              <Button
                type="button"
                variant="secondary"
                disabled={currentStep === 0}
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button type="button" variant="ghost" onClick={resetSurvey}>
                <RotateCcw className="h-4 w-4" />
                Сбросить
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
