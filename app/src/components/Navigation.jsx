import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, BookOpen, TrendingUp, HelpCircle, User, Menu, X, Moon, Sun, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/themeContext.jsx';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const navItems = user ? [
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/weekly-checkins', icon: Calendar, label: 'Check-ins' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
    { path: '/profile', icon: User, label: 'Profile' }
  ] : [
    { path: '/', icon: null, label: 'Home' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
    { path: '/auth?mode=login', icon: null, label: 'Login' },
    { path: '/auth?mode=signup', icon: null, label: 'Sign up' }
  ];

  return (
    <>
      <nav className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-rose-100/50 dark:border-rose-900/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/journal" className="flex items-center space-x-3 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group">
            <div className="relative">
              <div className="absolute -inset-2 bg-rose-100/30 dark:bg-rose-900/20 rounded-full blur-sm group-hover:bg-rose-100/50 dark:group-hover:bg-rose-900/30 transition-colors"></div>
              <Heart className="relative w-7 h-7 text-rose-400 dark:text-rose-300" />
            </div>
            <span className="font-light text-xl tracking-wide">WhisprLog</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                  location.pathname === path 
                    ? 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-sm font-light">{label}</span>
              </Link>
            ))}
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-light">Logout</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-rose-100/50 dark:border-rose-900/30">
            <div className="space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                    location.pathname === path 
                      ? 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="font-light">{label}</span>
                </Link>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-rose-100/30 dark:border-rose-900/30">
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all duration-300"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="font-light">Toggle Theme</span>
              </button>

              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-light">Logout</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>


  </>
  );
};

export default Navigation;