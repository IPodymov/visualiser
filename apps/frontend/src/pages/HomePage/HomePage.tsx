import { Link } from 'react-router-dom';
import { BarChart3, BookOpenCheck, Layers3, Radar } from 'lucide-react';
import './HomePage.css';
import { HeroSection } from '../../components/HeroSection/HeroSection';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { Button } from '../../components/ui/button';

export const HomePage = () => (
  <main>
    <HeroSection />
    <section className="container pb-16">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          icon={<BookOpenCheck className="h-5 w-5" />}
          label="учебные планы"
          value="Live"
        />
        <StatsCard icon={<Radar className="h-5 w-5" />} label="компетенции" value="Radar" />
        <StatsCard icon={<Layers3 className="h-5 w-5" />} label="семестровые срезы" value="8+" />
        <StatsCard icon={<BarChart3 className="h-5 w-5" />} label="таблица различий" value="Diff" />
      </div>
      <div className="home-cta">
        <div className="home-cta__inner">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Сравните программы до выбора траектории
            </h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Оценивайте нагрузку, дисциплины, семестры и профиль компетенций в едином интерфейсе.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/plans">Перейти к планам</Link>
          </Button>
        </div>
      </div>
    </section>
  </main>
);
