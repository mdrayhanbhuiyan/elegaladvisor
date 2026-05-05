import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, FileText, Settings, Sparkles, BarChart3, Layers, LogOut, Moon, Sun, Globe } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { motion } from 'motion/react';
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
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-500 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-slate-50 dark:bg-slate-950 flex-col transition-all duration-300 relative border-r border-slate-100 dark:border-slate-900 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none group cursor-pointer hover:scale-105 transition-transform duration-500">
            <Rocket className="text-white w-6 h-6 group-hover:animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black text-secondary dark:text-white uppercase tracking-tight text-xl leading-none">E-Legal</span>
            <span className="font-heading font-black text-indigo-600 uppercase tracking-widest text-[10px] mt-1 italic">Advisor Portfolio</span>
          </div>
        </div>
        
        <nav className="flex-grow px-4 space-y-2">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
             return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all duration-500 group relative ${
                  isActive 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-[0_10px_30px_-10px_rgba(79,70,229,0.1)] border border-indigo-50 dark:border-indigo-900/10' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-xs uppercase font-black tracking-widest">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeNav" 
                    className="absolute left-2 w-1.5 h-6 bg-indigo-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
             );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group cursor-pointer">
             <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">System Health</p>
               <h4 className="text-sm font-black uppercase tracking-tight">Optimal Logic</h4>
               <div className="w-full bg-indigo-400/30 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-white h-full w-[88%] rounded-full shadow-[0_0_8px_white]"></div>
               </div>
             </div>
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 rounded-[2rem] mt-6 h-14 px-6 border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-4" />
            <span className="font-black uppercase tracking-widest text-[10px]">Terminate Session</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-auto flex flex-col bg-white dark:bg-slate-950">
        <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl h-24 flex items-center justify-between px-10 border-b border-slate-100 dark:border-slate-900 sticky top-0 z-50 transition-all duration-300">
          <div className="flex items-center gap-6">
             <div className="lg:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Rocket className="text-white w-5 h-5" />
             </div>
             <div className="flex flex-col">
               <h1 className="font-heading font-black text-secondary dark:text-white uppercase tracking-tighter text-2xl leading-none">
                 {navItems.find(item => item.path === location.pathname || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.name || 'Command Center'}
               </h1>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Intelligence Ready</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-slate-100 dark:border-slate-900">
               <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Market Oversight</span>
                 <span className="text-xs font-bold text-secondary dark:text-white flex items-center gap-1.5">
                   <Globe className="w-3 h-3 text-indigo-600" /> North American Peak
                 </span>
               </div>
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 group"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-45 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-500" />
                )}
              </button>
            )}

            <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 pr-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-800 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform">
                <span className="font-heading font-black text-lg">{user.email?.[0].toUpperCase()}</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black text-secondary dark:text-white leading-none uppercase tracking-tight">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] text-indigo-600/60 font-black uppercase tracking-widest mt-1 italic">Tier 1 Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
