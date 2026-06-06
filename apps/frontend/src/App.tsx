import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { AdmissionSurveyPage } from './pages/AdmissionSurveyPage/AdmissionSurveyPage';
import { AuthPage } from './pages/AuthPage/AuthPage';
import { ComparePage } from './pages/ComparePage/ComparePage';
import { HomePage } from './pages/HomePage/HomePage';
import { PlanDetailsPage } from './pages/PlanDetailsPage/PlanDetailsPage';
import { PlansPage } from './pages/PlansPage/PlansPage';
import { ProfilePage } from './pages/ProfilePage/ProfilePage';
import { authApi } from './services/api/auth';
import { useAppStore } from './store/useAppStore';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/survey', element: <AdmissionSurveyPage /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
      { path: '/plans', element: <PlansPage /> },
      { path: '/plans/:id', element: <PlanDetailsPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export const App = () => {
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    if (!localStorage.getItem('eduplan-token')) return;

    authApi
      .me()
      .then(setUser)
      .catch(() => logout());
  }, [logout, setUser]);

  return <RouterProvider router={router} />;
};
