import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown, Search, Settings, UserCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAlerts } from '@/context/AlertContext';
import NotificationDrawer from '@/components/notifications/NotificationDrawer';

export default function TopBar({ onMenuClick, title, hasScrolled }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { alerts, unreadCount, markAsRead, markAllAsRead, deleteAlert } = useAlerts();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const SEARCH_DESTINATIONS = [
    { label: t('nav.dashboard'), to: '/dashboard' },
    { label: t('nav.activities'), to: '/activities' },
    { label: t('nav.goals'), to: '/goals' },
    { label: t('nav.challenges'), to: '/challenges' },
    { label: t('nav.reports'), to: '/reports' },
    { label: t('nav.recommendations'), to: '/recommendations' },
    { label: t('nav.community'), to: '/community' },
    { label: 'Community Details & Impact', to: '/community/details' },
    { label: t('nav.settings'), to: '/settings' },
  ];

  const results = SEARCH_DESTINATIONS.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const closeMenus = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const selectSearchResult = (to) => {
    navigate(to);
    setQuery('');
    setSearchOpen(false);
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <header className={`sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl transition-shadow duration-200 md:px-6 ${
      hasScrolled
        ? 'border-slate-200/80 bg-[#eaf0e6]/92 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#030712]/88 dark:shadow-black/25'
        : 'border-[#cdd8c9] bg-[#eaf0e6]/82 dark:border-white/5 dark:bg-[#030712]/75'
    }`}>

      <button
        onClick={onMenuClick}
        className="md:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={t('nav.openNavigation')}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="hidden min-w-0 max-w-md flex-1 md:block" ref={searchRef}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) selectSearchResult(results[0].to); }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.searchDashboard')}
            aria-expanded={searchOpen}
          />
          {searchOpen && query.trim() && (
            <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {results.length ? results.map((item) => <button key={item.to} type="button" onClick={() => selectSearchResult(item.to)} className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">{item.label}</button>) : <p className="px-3 py-2 text-sm text-slate-500">{t('nav.noPagesFound')}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <select
          value={currentLanguage}
          onChange={(event) => handleLanguageChange(event.target.value)}
          className="hidden h-9 rounded-lg border border-slate-200 bg-white/80 px-2.5 text-xs font-semibold text-slate-700 sm:inline-flex sm:items-center dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          aria-label={t('common.selectLanguage')}
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिंदी</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ar">العربية</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>

        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark
            ? <Sun className="h-4 w-4" aria-hidden="true" />
            : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>

        <a
          href="mailto:admin@carbontrack.com"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Help"
          title="Contact Admin"
        >
          <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
        </a>

        <button
          onClick={() => setNotifOpen(true)}
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('nav.notifications')}
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
          )}
        </button>

        <NotificationDrawer
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          alerts={alerts}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDeleteAlert={deleteAlert}
        />

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t('nav.openAccountMenu')}
            aria-expanded={profileOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs font-bold uppercase overflow-hidden">
              {user?.avatarUrl ? (
                <img src={`http://localhost:8080${user.avatarUrl}`} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.username?.charAt(0) ?? 'U'
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[96px] truncate">
              {user?.username}
            </span>
            <ChevronDown className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.username || 'User'}</p><p className="text-xs text-slate-500">{t('nav.personalAccount')}</p></div>
              <Link to="/settings" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><UserCircle className="h-4 w-4" />{t('nav.profile')}</Link>
              <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><Settings className="h-4 w-4" />{t('nav.settings')}</Link>
              <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut className="h-4 w-4" />{t('nav.logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
