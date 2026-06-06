import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Database, Sparkles, WandSparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import './HeroSection.css';
import { GradientButton } from '../GradientButton/GradientButton';
import { Button } from '../ui/button';

export const HeroSection = () => (
  <section className="container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-14 lg:grid-cols-[1fr_0.9fr]">
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-sky-100">
        <Sparkles className="h-4 w-4" />
        Аналитика образовательных траекторий
      </div>
      <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-white md:text-7xl">
        EduPlan Compare для умного выбора учебного плана
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        Визуализируйте дисциплины, семестры, часы, ЗЕТ и компетенции. Сравнивайте направления на
        актуальных данных учебных планов.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <GradientButton asChild size="lg">
          <Link to="/survey">
            Пройти подбор
            <ArrowRight className="h-5 w-5" />
          </Link>
        </GradientButton>
        <Button asChild size="lg" variant="secondary">
          <Link to="/plans">
            <WandSparkles className="h-5 w-5" />
            Открыть каталог
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/compare">
            <BarChart3 className="h-5 w-5" />
            Сравнить планы
          </Link>
        </Button>
      </div>
    </motion.div>

    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="hero-section__visual-card relative overflow-hidden p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Карта учебного плана</div>
            <div className="text-2xl font-bold text-white">Программы 2025</div>
          </div>
          <Database className="h-8 w-8 text-sky-200" />
        </div>
        <div className="grid gap-3">
          {['Программирование', 'Математика', 'Аналитика', 'Soft Skills', 'Практика'].map(
            (name, index) => (
              <div key={name} className="rounded-md bg-white/[0.07] p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-200">{name}</span>
                  <span className="text-sky-200">{86 - index * 7}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500"
                    style={{ width: `${86 - index * 7}%` }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </motion.div>
  </section>
);
