import { Bookmark, GitCompareArrows, History } from 'lucide-react';
import './AuthPage.css';
import { Badge } from '@shared/ui/badge';
import { Card, CardContent } from '@shared/ui/card';
import { AuthForm } from './AuthForm/AuthForm';

const benefits = [
  {
    icon: Bookmark,
    title: 'Сохраняйте программы',
    text: 'Соберите планы, к которым хотите вернуться.',
  },
  {
    icon: History,
    title: 'Продолжайте с истории',
    text: 'Открывайте недавно просмотренные программы после входа.',
  },
  {
    icon: GitCompareArrows,
    title: 'Возвращайтесь к сравнению',
    text: 'Добавляйте сохранённые планы в A/B-анализ.',
  },
];

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => (
  <main className="auth-page">
    <div className="container auth-page__layout">
      <section className="auth-page__value">
        <Badge variant="brand">Аккаунт EduPlan</Badge>
        <h1>
          {mode === 'login'
            ? 'Продолжите анализ учебных программ'
            : 'Сохраните свой образовательный поиск'}
        </h1>
        <p>
          Сохраняйте программы, возвращайтесь к истории просмотров и продолжайте сравнение позже.
        </p>
        <div className="auth-page__benefits">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="h-5 w-5" />
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Card className="auth-page__card">
        <CardContent className="p-6 md:p-8">
          <div className="mb-6">
            <p className="eyebrow">{mode === 'login' ? 'Вход' : 'Регистрация'}</p>
            <h2>{mode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}</h2>
            <p>
              {mode === 'login'
                ? 'Введите данные, которые использовали при регистрации.'
                : 'Это займёт меньше минуты.'}
            </p>
          </div>
          <AuthForm mode={mode} />
        </CardContent>
      </Card>
    </div>
  </main>
);
