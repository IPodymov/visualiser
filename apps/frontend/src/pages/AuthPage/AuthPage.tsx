import './AuthPage.css';
import { AuthForm } from '../../components/AuthForm/AuthForm';

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => (
  <main className="auth-page container grid place-items-center py-10">
    <AuthForm mode={mode} />
  </main>
);
