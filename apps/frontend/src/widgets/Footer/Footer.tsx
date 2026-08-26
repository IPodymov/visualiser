import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import './Footer.css';

export const Footer = () => (
  <footer className="site-footer">
    <div className="container site-footer__inner">
      <div>
        <div className="site-footer__brand">
          <GraduationCap className="h-5 w-5" />
          EduPlan Compare
        </div>
        <p>Визуализация и сравнительный анализ учебных планов.</p>
      </div>
      <nav aria-label="Навигация в подвале">
        <Link to="/plans">Учебные планы</Link>
        <Link to="/compare">Сравнение</Link>
        <Link to="/survey">Подбор по интересам</Link>
      </nav>
    </div>
  </footer>
);
