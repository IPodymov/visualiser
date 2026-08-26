import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import './AuthForm.css';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { authApi } from '../../api/auth';

export const AuthForm = ({ mode }: { mode: 'login' | 'register' }) => {
  const navigate = useNavigate();
  const setUser = useWorkspaceStore((state) => state.setUser);
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
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось выполнить запрос. Проверьте данные и повторите попытку.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === 'register' && (
        <div>
          <Label htmlFor="auth-name">Имя и фамилия</Label>
          <Input
            id="auth-name"
            autoComplete="name"
            placeholder="Например, Анна Смирнова"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="auth-email">Электронная почта</Label>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="name@example.ru"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="auth-password">Пароль</Label>
        <Input
          id="auth-password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'register' ? 'Не менее 12 символов' : 'Введите пароль'}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          minLength={mode === 'register' ? 12 : 1}
          maxLength={128}
          required
        />
        {mode === 'register' && (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Используйте от 12 до 128 символов.
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="auth-form__error">
          {error}
        </div>
      )}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Отправляем…
          </>
        ) : (
          <>
            {mode === 'login' ? 'Войти и открыть профиль' : 'Создать аккаунт'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      <p className="auth-form__switch">
        {mode === 'login' ? (
          <>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </>
        ) : (
          <>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </>
        )}
      </p>
    </form>
  );
};
