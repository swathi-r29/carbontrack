import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Zap, Target, BarChart2,
  Settings, Leaf, ShieldCheck, TrendingDown, Lightbulb, Trophy, Building2, Flag, Users, Navigation, HeartHandshake, Home, Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();

  const NAV_ITEMS = [
    { to: '/dashboard', label: t('nav.dashboard', { defaultValue: 'Dashboard' }), icon: LayoutDashboard },
    { to: '/activities', label: t('nav.activities', { defaultValue: 'Activities' }), icon: Zap },
    { to: '/energy-simulator', label: t('nav.energySimulator', { defaultValue: 'Energy Auditor' }), icon: Home },
    { to: '/route-planner', label: t('nav.routePlanner', { defaultValue: 'Route Planner' }), icon: Navigation },
    { to: '/offsets', label: t('nav.carbonOffsets', { defaultValue: 'Carbon Offsets' }), icon: HeartHandshake },
    { to: '/goals', label: t('nav.goals', { defaultValue: 'Goals' }), icon: Target },
    { to: '/challenges', label: t('nav.challenges', { defaultValue: 'Challenges' }), icon: Flag },
    { to: '/reports', label: t('nav.reports', { defaultValue: 'Reports' }), icon: BarChart2 },
    { to: '/badges', label: t('nav.myBadges', { defaultValue: 'My Badges' }), icon: Award },
    { to: '/community', label: t('nav.community', { defaultValue: 'Community' }), icon: Users },
    { to: '/recommendations', label: t('nav.recommendations', { defaultValue: 'Recommendations' }), icon: Lightbulb },
    { to: '/settings', label: t('nav.settings', { defaultValue: 'Settings' }), icon: Settings },
  ];

  const ADMIN_NAV_ITEMS = [
    { to: '/admin', label: t('nav.adminDashboard'), icon: ShieldCheck },
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/activities', label: t('nav.activities'), icon: Zap },
    { to: '/reports', label: t('nav.reports'), icon: BarChart2 },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const ORG_ADMIN_NAV_ITEMS = [
    ...NAV_ITEMS,
    { to: '/organisation', label: t('nav.organisationDashboard'), icon: Building2 },
    { to: '/organisation', label: t('nav.csrReports'), icon: BarChart2 },
    { to: '/organisation', label: t('nav.employeeAnalytics'), icon: Users },
  ];

  const links = isAdmin ? ADMIN_NAV_ITEMS : user?.role === 'ORG_ADMIN' ? ORG_ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col',
          'bg-[#eaf0e6] dark:bg-[#030712]/75 dark:backdrop-blur-md',
          'border-r border-slate-200 dark:border-white/5',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:z-auto',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 dark:border-white/5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-teal-500 shadow-sm">
            <Leaf className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              CarbonTrack
            </span>
            <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300 font-semibold mt-0.5 leading-none">Sustainability Platform</p>
          </div>
        </div>

        {/* User pill */}
        <div className="mx-3 mt-4 mb-2 flex items-center gap-2.5 rounded-xl bg-white/70 dark:bg-[#0e271c]/60 border border-emerald-200/60 dark:border-[#1E4432]/50 px-3 py-2.5 shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-700 text-white text-xs font-bold uppercase overflow-hidden">
            {user?.avatarUrl ? (
              <img src={`http://localhost:8080${user.avatarUrl}`} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              user?.username?.charAt(0) ?? 'U'
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {user?.username ?? 'User'}
            </p>
            <p className="text-[10px] font-semibold text-emerald-800/75 dark:text-slate-300 truncate">{user?.role ?? 'USER'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Sidebar navigation">
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Menu
          </p>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={onClose}
              end={to === '/dashboard'}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Eco tip strip */}
        <div className="mx-3 mb-4 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-[#0a1815]/60 dark:to-[#081a17]/60 border border-green-100 dark:border-[#1E4432]/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-hidden="true" />
            <p className="text-xs font-semibold text-green-800 dark:text-green-300">{t('nav.ecoTipTitle')}</p>
          </div>
          <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed">
            {t('nav.ecoTipText')}
          </p>
        </div>
      </aside>
    </>
  );
}
