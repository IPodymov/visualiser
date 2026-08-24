import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  CheckCircle2,
  FlaskConical,
  GitCompareArrows,
  GraduationCap,
  Layers3,
  Search,
  UsersRound,
} from 'lucide-react';
import './HomePage.css';
import { HeroSection } from '../../components/HeroSection/HeroSection';
import { NextAction, PageSection, SectionHeader } from '../../components/PageLayout/PageLayout';
import { Button } from '../../components/ui/button';

const outcomes = [
  {
    icon: BookOpenCheck,
    title: 'Изучить программу',
    text: 'Посмотреть дисциплины, семестры, формы контроля и учебную нагрузку.',
  },
  {
    icon: GitCompareArrows,
    title: 'Сравнить программы',
    text: 'Увидеть общие и уникальные дисциплины, различия в часах и зачётных единицах.',
  },
  {
    icon: CalendarRange,
    title: 'Понять структуру обучения',
    text: 'Проследить, как меняются содержание и нагрузка от первого семестра к последнему.',
  },
  {
    icon: GraduationCap,
    title: 'Найти подходящее направление',
    text: 'Использовать данные учебного плана как дополнительный ориентир при выборе программы.',
  },
];

const analysedData = [
  ['Дисциплины', BookMarked],
  ['Семестры', CalendarRange],
  ['Формы контроля', CheckCircle2],
  ['Зачётные единицы', Layers3],
  ['Общие часы', BarChart3],
  ['Лекции', BookOpenCheck],
  ['Практики', UsersRound],
  ['Лабораторные', FlaskConical],
  ['Самостоятельная работа', BriefcaseBusiness],
] as const;

const audiences = [
  {
    icon: GraduationCap,
    title: 'Абитуриентам',
    text: 'Сопоставить содержание программ до подачи документов.',
  },
  {
    icon: BookOpenCheck,
    title: 'Студентам',
    text: 'Понять траекторию обучения и будущую нагрузку по семестрам.',
  },
  {
    icon: UsersRound,
    title: 'Преподавателям',
    text: 'Увидеть место дисциплины и её нагрузку в структуре программы.',
  },
  {
    icon: Building2,
    title: 'Сотрудникам образовательных организаций',
    text: 'Сравнить версии и профили программ на основе одних и тех же показателей.',
  },
];

export const HomePage = () => (
  <main>
    <HeroSection />
    <div className="container home-page__stack">
      <PageSection labelledBy="home-outcomes">
        <SectionHeader
          id="home-outcomes"
          eyebrow="Возможности"
          title="Что можно узнать"
          description="Сервис помогает перейти от сложной таблицы к понятному ответу о содержании и устройстве программы."
        />
        <div className="home-outcomes">
          {outcomes.map(({ icon: Icon, title, text }) => (
            <article key={title} className="home-outcome-card">
              <Icon className="h-6 w-6" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection className="home-how" labelledBy="home-how">
        <SectionHeader
          id="home-how"
          eyebrow="Три шага"
          title="Как работает сервис"
          description="Начните с одной программы, а глубину анализа выбирайте по мере необходимости."
        />
        <ol className="home-steps">
          {[
            [
              '01',
              'Выберите программу',
              'Найдите её по факультету, направлению, профилю, уровню и году набора.',
            ],
            [
              '02',
              'Изучите структуру',
              'Посмотрите нагрузку по семестрам или добавьте вторую программу для сравнения.',
            ],
            [
              '03',
              'Разберите различия',
              'Получите визуальное сравнение и списки общих, уникальных и изменённых дисциплин.',
            ],
          ].map(([number, title, text]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection labelledBy="home-data">
        <SectionHeader
          id="home-data"
          eyebrow="Глубина анализа"
          title="Какие данные анализируются"
          description="Все показатели берутся из структуры загруженного учебного плана и сохраняют исходные единицы измерения."
        />
        <div className="home-data-grid">
          {analysedData.map(([label, Icon]) => (
            <div key={label}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection labelledBy="home-audience">
        <SectionHeader
          id="home-audience"
          eyebrow="Сценарии"
          title="Кому пригодится EduPlan Compare"
        />
        <div className="home-audiences">
          {audiences.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon className="h-5 w-5" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <NextAction>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
              Следующий шаг
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              Найдите программу и посмотрите, как устроено обучение
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Если вы ещё не определились с направлением, подбор по интересам предложит программы
              для дальнейшего анализа — не окончательный ответ, а точку старта.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/plans">
                <Search className="h-5 w-5" />
                Открыть каталог
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/survey">Подбор по интересам</Link>
            </Button>
          </div>
        </div>
      </NextAction>
    </div>
  </main>
);
