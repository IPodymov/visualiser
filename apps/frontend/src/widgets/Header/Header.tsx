import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bookmark, GitCompareArrows, GraduationCap, LogOut, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';
import './Header.css';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';
import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui/button';
import { Drawer } from '@shared/ui/drawer';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/plans', label: 'Учебные планы' },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const user = useWorkspaceStore((state) => state.user);
  const logout = useWorkspaceStore((state) => state.logout);
  const compareCount = useWorkspaceStore((state) => state.compareIds.filter(Boolean).length);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="EduPlan Compare — главная">
          <span className="site-header__brand-mark">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            EduPlan <strong>Compare</strong>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Основная навигация">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn('site-header__nav-link', isActive && 'site-header__nav-link--active')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <Button asChild size="sm" variant="strong" className="site-header__compare-action">
            <NavLink to="/compare">
              <GitCompareArrows className="h-4 w-4" />
              Сравнить
              {compareCount > 0 && (
                <span
                  className="site-header__count"
                  aria-label={`Выбрано программ: ${compareCount}`}
                >
                  {compareCount}
                </span>
              )}
            </NavLink>
          </Button>

          {user ? (
            <div className="site-header__profile">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Открыть меню профиля"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
              >
                <UserRound className="h-4 w-4" />
              </Button>
              {profileOpen && (
                <div className="site-header__profile-menu">
                  <Link
                    to="/profile"
                    className="site-header__profile-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Bookmark className="h-4 w-4" />
                    Избранное и история
                  </Link>
                  <button
                    type="button"
                    className="site-header__profile-item"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="site-header__login">
              <Link to="/login">
                <UserRound className="h-4 w-4" />
                Войти
              </Link>
            </Button>
          )}

          <Button
            className="site-header__menu-button"
            size="icon"
            variant="ghost"
            type="button"
            aria-label="Открыть меню"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Навигация"
        description="Перейдите к основному сценарию EduPlan Compare."
      >
        <nav className="site-header__mobile-nav" aria-label="Мобильная навигация">
          {[
            ...links,
            { to: '/compare', label: 'Сравнение' },
            { to: '/survey', label: 'Подбор по интересам' },
          ].map((link) => (
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
          <div className="site-header__mobile-divider" />
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="site-header__mobile-link"
                onClick={() => setOpen(false)}
              >
                Избранное и история
              </NavLink>
              <button type="button" className="site-header__mobile-link" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="site-header__mobile-link"
              onClick={() => setOpen(false)}
            >
              Войти в аккаунт
            </NavLink>
          )}
        </nav>
      </Drawer>
    </header>
  );
};
