import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import './AuthForm.css';
import { authApi } from '../../services/api/auth';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

export const AuthForm = ({ mode }: { mode: 'login' | 'register' }) => {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user =
        mode === 'login'
          ? await authApi.login(form.email, form.password)
          : await authApi.register(form.fullName, form.email, form.password);
      setUser(user);
      navigate('/profile');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Не удалось выполнить запрос',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="auth-form mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Авторизация' : 'Регистрация'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          {mode === 'register' && (
            <Input
              placeholder="Имя и фамилия"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error && (
            <div className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
          <div className="text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <Link className="text-sky-200 hover:text-white" to="/register">
                Нет аккаунта? Зарегистрироваться
              </Link>
            ) : (
              <Link className="text-sky-200 hover:text-white" to="/login">
                Уже есть аккаунт? Войти
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
