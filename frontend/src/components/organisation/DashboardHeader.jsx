import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

export default function DashboardHeader({ organisation, lastUpdated }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-50">
            {t('orgDashboard.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {organisation?.name}
          </p>
        </div>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        {t('orgDashboard.subtitle')}
      </p>
    </div>
  );
}
