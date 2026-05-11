import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { Header } from '../components/Header/Header';

export const AppLayout = () => (
  <div className="app-shell">
    <div className="subtle-grid min-h-screen">
      <Header />
      <Outlet />
      <Footer />
    </div>
  </div>
);
