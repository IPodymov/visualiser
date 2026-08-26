import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { authApi } from '@features/auth/api/auth';
import { useWorkspaceStore } from '@features/workspace/model/useWorkspaceStore';

const HomePage = lazy(() =>
  import('@features/home/ui/HomePage').then((module) => ({ default: module.HomePage })),
);
const AdmissionSurveyPage = lazy(() =>
  import('@features/admission-survey/ui/AdmissionSurveyPage').then((module) => ({
    default: module.AdmissionSurveyPage,
  })),
);
const AuthPage = lazy(() =>
  import('@features/auth/ui/AuthPage').then((module) => ({ default: module.AuthPage })),
);
const ComparePage = lazy(() =>
  import('@features/comparison/ui/ComparePage').then((module) => ({
    default: module.ComparePage,
  })),
);
const PlanDetailsPage = lazy(() =>
  import('@features/plan-details/ui/PlanDetailsPage').then((module) => ({
    default: module.PlanDetailsPage,
  })),
);
const PlansPage = lazy(() =>
  import('@features/plan-catalog/ui/PlansPage').then((module) => ({ default: module.PlansPage })),
);
const ProfilePage = lazy(() =>
  import('@features/profile/ui/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
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
  const setUser = useWorkspaceStore((state) => state.setUser);
  const logout = useWorkspaceStore((state) => state.logout);

  useEffect(() => {
    if (!localStorage.getItem('eduplan-token')) return;

    authApi
      .me()
      .then(setUser)
      .catch(() => logout());
  }, [logout, setUser]);

  return <RouterProvider router={router} />;
};
