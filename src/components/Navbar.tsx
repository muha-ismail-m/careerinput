import { Briefcase, Settings, Search, LayoutDashboard, LogOut, Home } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils/cn';

export function Navbar() {
  const { currentPage, setCurrentPage, logout, isAuthenticated, user } = useAppStore();
  
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home, enabled: true },
    { id: 'search', label: 'Job Search', icon: Search, enabled: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: isAuthenticated },
    { id: 'settings', label: 'Settings', icon: Settings, enabled: isAuthenticated },
  ] as const;
  
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Career Input
            </span>
          </button>
          
          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.enabled && setCurrentPage(item.id as typeof currentPage)}
                disabled={!item.enabled}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  currentPage === item.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : item.enabled
                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-500 hidden md:block">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage('auth')}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
