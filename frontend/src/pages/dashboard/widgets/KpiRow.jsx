/**
 * KpiRow — Today / Weekly / Monthly / Avg stat cards
 */
import { useTranslation } from 'react-i18next';
import { Sun, CalendarDays, BarChart2, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { CardSkeleton } from '@/components/skeletons';
import { formatEmission } from '@/utils/formatters';

const CARDS = [
  {
    key:      'today',
    titleKey: 'dashboard.todaysCarbon',
    icon:     Sun,
    iconBg:   'bg-[#e8f0e6] dark:bg-green-900/30',
    iconColor:'text-[#2d6a4f] dark:text-green-400',
  },
  {
    key:      'weekly',
    titleKey: 'dashboard.thisWeek',
    icon:     CalendarDays,
    iconBg:   'bg-[#e8f0e6] dark:bg-green-900/30',
    iconColor:'text-[#2d6a4f] dark:text-green-400',
  },
  {
    key:      'monthly',
    titleKey: 'dashboard.thisMonth',
    icon:     BarChart2,
    iconBg:   'bg-[#e8f0e6] dark:bg-green-900/30',
    iconColor:'text-[#2d6a4f] dark:text-green-400',
  },
  {
    key:      'avgPerDay',
    titleKey: 'dashboard.dailyAverage',
    icon:     TrendingDown,
    iconBg:   'bg-[#e8f0e6] dark:bg-green-900/30',
    iconColor:'text-[#2d6a4f] dark:text-green-400',
  },
];

export default function KpiRow({ kpi, isLoading }) {
  const { t } = useTranslation();


  if (isLoading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map((c) => <CardSkeleton key={c.key} lines={2} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map(({ key, titleKey, icon, iconBg, iconColor }) => {
        const stat = kpi[key];
        return (
          <StatCard
            key={key}
            title={t(titleKey)}
            value={formatEmission(stat.value, 2, t)}
            icon={icon}
            iconBg={iconBg}
            iconColor={iconColor}
            trend={stat.trend}
            trendValue={`${stat.delta > 0 ? '+' : ''}${stat.delta.toFixed(2)} ${t('activitiesPage.units.kg', { defaultValue: 'kg' })}`}
            trendLabel={stat.deltaLabel}
          />
        );
      })}
    </div>
  );
}
