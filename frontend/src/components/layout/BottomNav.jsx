import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Zap, Target, Users, Settings } from 'lucide-react';

/**
 * BottomNav — mobile-only tab bar (hidden on md+)
 * Sticky at the bottom of the viewport.
 */
export default function BottomNav() {
  const { t } = useTranslation();
  const ITEMS = [
    { to: '/dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { to: '/activities', label: t('nav.log'), icon: Zap },
    { to: '/goals', label: t('nav.goals'), icon: Target },
    { to: '/community', label: t('nav.community'), icon: Users },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around bg-[#eaf0e6]/95 dark:bg-slate-900/90 backdrop-blur-md border-t border-[#cdd8c9] dark:border-slate-800 safe-area-inset-bottom px-1"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
                aria-hidden="true"
              />
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-green-500" aria-hidden="true" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
