import { useAppStore } from './store/appStore';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { currentPage } = useAppStore();

  // Render the current page
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'search':
        return <SearchPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <LandingPage />;
    }
  };

  // Landing page doesn't show the navbar
  if (currentPage === 'landing') {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {renderPage()}
    </div>
  );
}
