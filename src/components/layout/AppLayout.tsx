import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { FullPageLoader } from '@/components/ui/Loader';

export function AppLayout() {
  return (
    <div className="app-bg min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<FullPageLoader label="Loading module" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
