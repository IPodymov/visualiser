import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, GitCompareArrows, Search } from 'lucide-react';
import './HeroSection.css';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';

const metrics = [
  { label: 'Общие дисциплины', value: '42', tone: 'shared' as const },
  { label: 'Только в программе A', value: '11', tone: 'programA' as const },
  { label: 'Только в программе B', value: '8', tone: 'programB' as const },
];

export const HeroSection = () => (
  <section className="home-hero container">
    <div className="home-hero__copy">
      <Badge variant="brand" className="mb-6">
        Анализ образовательных программ
      </Badge>
      <h1 className="display-title">Сравните содержание образовательных программ</h1>
      <p className="lead-copy mt-6">
        Изучайте учебные планы по дисциплинам, нагрузке, семестрам и форматам занятий — от краткого
        обзора до точных различий.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/plans">
            <Search className="h-5 w-5" />
            Найти учебный план
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/compare">
            <GitCompareArrows className="h-5 w-5" />
            Сравнить программы
          </Link>
        </Button>
      </div>
      <ul className="home-hero__proof" aria-label="Что доступно в сервисе">
        <li>
          <Check className="h-4 w-4" />
          Реальные данные учебных планов
        </li>
        <li>
          <Check className="h-4 w-4" />
          Сравнение по дисциплинам и нагрузке
        </li>
      </ul>
    </div>

    <div
      className="comparison-demo"
      role="group"
      aria-label="Демонстрационный пример сравнения программ"
    >
      <div className="comparison-demo__topline">
        <span>Пример сравнения</span>
        <Badge variant="neutral">Демонстрация</Badge>
      </div>
      <div className="comparison-demo__programs">
        <div className="comparison-demo__program comparison-demo__program--a">
          <span>A</span>
          <div className="comparison-demo__program-copy">
            <strong>Веб-технологии</strong>
            <small>Бакалавриат · 2025</small>
          </div>
        </div>
        <div className="comparison-demo__connector" aria-hidden="true">
          <GitCompareArrows className="h-4 w-4" />
        </div>
        <div className="comparison-demo__program comparison-demo__program--b">
          <span>B</span>
          <div className="comparison-demo__program-copy">
            <strong>Интеллектуальные системы</strong>
            <small>Бакалавриат · 2025</small>
          </div>
        </div>
      </div>
      <div className="comparison-demo__metrics">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`comparison-demo__metric comparison-demo__metric--${metric.tone}`}
          >
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <div
        className="comparison-demo__overlap"
        role="img"
        aria-label="42 общих, 11 только в программе A, 8 только в программе B"
      >
        <span className="comparison-demo__bar-a" style={{ flex: 11 }} />
        <span className="comparison-demo__bar-shared" style={{ flex: 42 }} />
        <span className="comparison-demo__bar-b" style={{ flex: 8 }} />
      </div>
      <div className="comparison-demo__difference">
        <BookOpen className="h-5 w-5" />
        <div>
          <span>Разница общей нагрузки</span>
          <strong>240 часов</strong>
        </div>
      </div>
    </div>
  </section>
);
