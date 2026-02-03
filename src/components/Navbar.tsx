import { useAppStore } from '../store/appStore';

export default function Navbar() {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Career Input</span>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentPage('search')}
              className={`font-medium transition-colors ${
                currentPage === 'search'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Find Jobs
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setCurrentPage('settings')}
              className={`font-medium transition-colors ${
                currentPage === 'settings'
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
