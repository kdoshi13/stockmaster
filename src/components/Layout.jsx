import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Package,
  Repeat,
  Settings,
  Menu,
  X,
  User,
  Warehouse as WarehouseIcon,
  MapPin as LocationIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ListChecks, label: 'Operations', path: '/operations' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Repeat, label: 'Move History', path: '/moves' },
  ];

  // Show settings tabs whenever we are on warehouse/location routes
  useEffect(() => {
    if (location.pathname.startsWith('/warehouse') || location.pathname.startsWith('/location')) {
      setSettingsOpen(true);
    } else {
      // keep settingsOpen as-is (user toggle), but do not auto-close if user opened it.
      // If you prefer auto-close when leaving settings, uncomment the next line:
      // setSettingsOpen(false);
    }
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const go = (path) => {
    navigate(path);
    // keep settings open if we navigated to a settings path
    if (path.startsWith('/warehouse') || path.startsWith('/location')) setSettingsOpen(true);
    else setSettingsOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (only profile + logout) */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform z-50 lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-semibold">Profile</span>
          </div>
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-3">
          <Link
            to="/profile"
            className="block p-2 rounded hover:bg-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            My Profile
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left p-2 rounded hover:bg-red-600 bg-red-500 mt-2"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="relative">
          <div className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 justify-between">
            <div className="flex items-center gap-6">
              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Logo + title */}
              <div className="flex items-center gap-3">
                <img src="/mnt/data/StockMaster.svg" alt="StockMaster" className="h-8 w-auto" />
                <h1 className="text-xl font-semibold text-foreground">StockMaster</h1>
              </div>

              {/* Top nav (visible on lg) */}
              <nav className="hidden lg:flex items-center gap-4 ml-6">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}

                {/* Settings button */}
                <div className="relative">
                  <button
                    onClick={() => setSettingsOpen((s) => !s)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                      (location.pathname.startsWith('/warehouse') || location.pathname.startsWith('/location'))
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                    aria-expanded={settingsOpen}
                    aria-haspopup="true"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Settings</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Right side: user info */}
            <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground">
              {user ? (
                <>
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </>
              ) : (
                <Link to="/login" className="text-sm">
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Settings tabs (shown when settingsOpen or on warehouse/location paths) */}
          {settingsOpen && (
            <div className="bg-card border-b border-border">
              <div className="max-w-full px-4 lg:px-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => go('/warehouse')}
                    className={`px-3 py-2 -mb-px border-b-2 ${
                      location.pathname === '/warehouse'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4" />
                      Warehouse
                    </span>
                  </button>

                  <button
                    onClick={() => go('/location')}
                    className={`px-3 py-2 -mb-px border-b-2 ${
                      location.pathname === '/location'
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LocationIcon className="h-4 w-4" />
                      Location
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Page title */}
        <div className="px-6 py-3 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            {/* Show the label for top nav item or fallback */}
            {(() => {
              const top = navItems.find((it) => it.path === location.pathname);
              if (top) return top.label;
              if (location.pathname === '/warehouse') return 'Warehouse';
              if (location.pathname === '/location') return 'Location';
              return 'StockMaster';
            })()}
          </h2>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
