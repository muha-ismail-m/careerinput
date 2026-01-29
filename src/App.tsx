import { useAppStore } from '@/store/appStore';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { SearchPage } from '@/pages/SearchPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function App() {
  const { currentPage, isAuthenticated } = useAppStore();
  
  // Route based on current page
  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'auth':
      return <AuthPage />;
    case 'search':
      return <SearchPage />;
    case 'dashboard':
      // Redirect to auth if not authenticated
      if (!isAuthenticated) {
        return <AuthPage />;
      }
      return <DashboardPage />;
    case 'settings':
      // Redirect to auth if not authenticated
      if (!isAuthenticated) {
        return <AuthPage />;
      }
      return <SettingsPage />;
    default:
      return <LandingPage />;
  }
}
