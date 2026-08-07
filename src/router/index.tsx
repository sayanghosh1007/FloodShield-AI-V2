import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { NotFound } from '@/components/ui/ErrorState';
import { FullPageLoader } from '@/components/ui/Loader';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const WeatherPage = lazy(() =>
  import('@/pages/WeatherPage').then((m) => ({ default: m.WeatherPage })),
);
const FloodPredictionPage = lazy(() =>
  import('@/pages/FloodPredictionPage').then((m) => ({ default: m.FloodPredictionPage })),
);
const FloodMapPage = lazy(() =>
  import('@/pages/FloodMapPage').then((m) => ({ default: m.FloodMapPage })),
);
const EvacuationPage = lazy(() =>
  import('@/pages/EvacuationPage').then((m) => ({ default: m.EvacuationPage })),
);
const ShelterManagementPage = lazy(() =>
  import('@/pages/ShelterManagementPage').then((m) => ({ default: m.ShelterManagementPage })),
);
const AlertsPage = lazy(() =>
  import('@/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
);
const SensorsPage = lazy(() =>
  import('@/pages/SensorsPage').then((m) => ({ default: m.SensorsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'weather', element: <WeatherPage /> },
      { path: 'flood-prediction', element: <FloodPredictionPage /> },
      { path: 'evacuation', element: <EvacuationPage /> },
      { path: 'shelters', element: <ShelterManagementPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'map', element: <FloodMapPage /> },
      { path: 'sensors', element: <SensorsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
