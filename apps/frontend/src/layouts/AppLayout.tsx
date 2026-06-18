import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { Header } from '../components/Header/Header';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, search]);

  return null;
};

export const AppLayout = () => (
  <>
    <ScrollToTop />
    <div className="app-shell">
      <div className="subtle-grid min-h-screen">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </div>
  </>
);
