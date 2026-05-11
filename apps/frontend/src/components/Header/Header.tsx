import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import './Header.css';
import { Button } from '../ui/button';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/plans', label: 'Учебные планы' },
  { to: '/compare', label: 'Сравнение' },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand">
          <span className="site-header__brand-mark">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>EduPlan Compare</span>
        </Link>

        <div className="site-header__actions">
          {user ? (
            <div className="site-header__profile">
              <Button
                size="icon"
                type="button"
                variant="secondary"
                aria-label="Открыть меню профиля"
                onClick={() => setProfileOpen((value) => !value)}
              >
                <UserRound className="h-4 w-4" />
              </Button>
              {profileOpen && (
                <div className="site-header__profile-menu">
                  <button
                    type="button"
                    className="site-header__profile-item"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <UserRound className="h-4 w-4" />
                    Профиль
                  </button>
                  <button type="button" className="site-header__profile-item" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link to="/login">
                <UserRound className="h-4 w-4" />
                Войти
              </Link>
            </Button>
          )}
          <Button className="site-header__menu-button" size="icon" variant="ghost" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="site-header__mobile">
          <div className="site-header__mobile-list">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn('site-header__mobile-link', isActive && 'site-header__mobile-link--active')
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
