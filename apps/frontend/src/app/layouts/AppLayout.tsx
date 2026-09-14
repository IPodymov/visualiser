import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@shared/ui/InterfaceState/InterfaceState';
import { Footer } from '@widgets/Footer/Footer';
import { Header } from '@widgets/Header/Header';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, search]);

  return null;
};

export const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <>
      <ScrollToTop />
      <div className="app-shell">
        <div className="subtle-grid min-h-screen">
          <Header />
          <Suspense
            fallback={
              <main className="page-main">
                <div className="container">
                  <LoadingState label="Открываем страницу" rows={4} />
                </div>
              </main>
            }
          >
            <div key={pathname} className="page-transition">
              <Outlet />
            </div>
          </Suspense>
          <Footer />
        </div>
      </div>
    </>
  );
};
