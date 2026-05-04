import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, FileText, Settings, Sparkles, BarChart3, Layers, LogOut, Moon, Sun } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading Admin Panel...</div>;

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/admin' },
    { name: 'Manage Posts', icon: FileText, path: '/admin/posts' },
    { name: 'AI Blog Generator', icon: Sparkles, path: '/admin/ai-generator' },
    { name: 'Categories', icon: Layers, path: '/admin/categories' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="p-6 border-b dark:border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tighter">E-Legal Admin</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' 
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-bold uppercase tracking-tight text-xs">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-auto flex flex-col">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-16 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
          <h1 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-xl">
            {navItems.find(item => item.path === location.pathname)?.name || 'Admin Panel'}
          </h1>
          <div className="flex items-center gap-6">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full w-10 h-10 border border-slate-200 dark:border-slate-800"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Administrator</span>
              </div>
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-indigo-600 font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-grow">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
