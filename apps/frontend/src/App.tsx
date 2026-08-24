import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { authApi } from './services/api/auth';
import { useAppStore } from './store/useAppStore';

const HomePage = lazy(() =>
  import('./pages/HomePage/HomePage').then((module) => ({ default: module.HomePage })),
);
const AdmissionSurveyPage = lazy(() =>
  import('./pages/AdmissionSurveyPage/AdmissionSurveyPage').then((module) => ({
    default: module.AdmissionSurveyPage,
  })),
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage/AuthPage').then((module) => ({ default: module.AuthPage })),
);
const ComparePage = lazy(() =>
  import('./pages/ComparePage/ComparePage').then((module) => ({ default: module.ComparePage })),
);
const PlanDetailsPage = lazy(() =>
  import('./pages/PlanDetailsPage/PlanDetailsPage').then((module) => ({
    default: module.PlanDetailsPage,
  })),
);
const PlansPage = lazy(() =>
  import('./pages/PlansPage/PlansPage').then((module) => ({ default: module.PlansPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);

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
