import { useAppStore } from './store/appStore';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  const { currentPage, isAuthenticated } = useAppStore();

  // Render the current page
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'search':
        return <SearchPage />;
      case 'dashboard':
        return isAuthenticated ? <DashboardPage /> : <AuthPage />;
      case 'settings':
        return isAuthenticated ? <SettingsPage /> : <AuthPage />;
      case 'auth':
        return <AuthPage />;
      default:
        return <LandingPage />;
    }
  };

  // Landing and Auth pages don't show the navbar
  if (currentPage === 'landing' || currentPage === 'auth') {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {renderPage()}
    </div>
  );
}
