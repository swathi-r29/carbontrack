import { useTranslation } from 'react-i18next';
import { Users, Leaf, TrendingUp, Target } from 'lucide-react';

export default function MetricsCards({ data }) {
  const { t } = useTranslation();
  if (!data) return null;
  const cards = [
    [t('orgDashboard.activeEmployees'), data.totalEmployees, '', Users, 'blue'],
    [t('orgDashboard.totalEmissions'), data.totalEmissionsCO2?.toFixed(1), 'kg', Leaf, 'green'],
    [t('orgDashboard.avgPerEmployee'), data.metrics?.avgEmissionsPerEmployee?.toFixed(1) ?? 0, 'kg', TrendingUp, 'teal'],
    [t('orgDashboard.goals'), data.metrics?.goalCompletionPercent?.toFixed(1) ?? 0, '%', Target, 'amber'],
    [t('orgDashboard.participationRate'), data.metrics?.participationPercent?.toFixed(1) ?? 0, '%', Users, 'indigo'],
    [t('orgDashboard.sustainabilityScore'), data.metrics?.sustainabilityScore?.toFixed(1) ?? 0, '/100', Leaf, 'emerald'],
  ];

  return (
    <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(([title, value, unit, Icon, color]) => (
        <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <Icon className={`w-6 h-6 text-${color}-600 mb-4`} />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {value}<span className="text-lg ml-1 text-slate-500">{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
