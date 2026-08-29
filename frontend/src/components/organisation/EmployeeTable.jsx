import { useTranslation } from 'react-i18next';
import { Trophy, Leaf, Zap } from 'lucide-react';
import Table from '@/components/ui/Table';

export default function EmployeeTable({ employees = [], title }) {
  const { t } = useTranslation();
  const displayTitle = title || t('orgDashboard.topContributors');

  // Define table columns
  const columns = [
    { 
      key: 'rank', 
      header: t('orgDashboard.rank'), 
      align: 'left', 
      width: '80px',
      render: (value) => {
        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        return (
          <div className="flex items-center gap-2">
            {medals[value] && <span className="text-lg">{medals[value]}</span>}
            <span>#{value}</span>
          </div>
        );
      }
    },
    { 
      key: 'username', 
      header: t('orgDashboard.employeeName'), 
      align: 'left',
      render: (value, row) => (
        <div className="flex flex-col">
          <p className="font-semibold text-slate-900 dark:text-slate-50">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
        </div>
      )
    },
    { 
      key: 'department', 
      header: t('orgDashboard.department'), 
      align: 'left',
      hidden: 'md',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {value}
        </span>
      )
    },
    { 
      key: 'totalEmissionsSaved', 
      header: t('orgDashboard.emissions'), 
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-2">
          <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-50">
            {value?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || 0}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">kg</span>
        </div>
      )
    },
    { 
      key: 'activityCount', 
      header: t('nav.activities'), 
      align: 'right',
      hidden: 'sm',
      render: (value) => (
        <div className="flex items-center justify-end gap-2">
          <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-slate-50">{value}</span>
        </div>
      )
    },
  ];

  // Map employees to row data with styling
  const rowData = employees.map((employee) => ({
    id: employee.userId ?? employee.id,
    rank: employee.rank ?? 0,
    username: employee.username ?? employee.name,
    email: employee.email,
    department: employee.department,
    totalEmissionsSaved: employee.totalEmissionsSaved ?? employee.emissions,
    activityCount: employee.activityCount,
    isTopThree: employee.rank <= 3,
    __original: employee,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-card dark:shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          {displayTitle}
        </h2>
      </div>

      {/* Table */}
      {employees && employees.length > 0 ? (
        <Table
          columns={columns}
          data={rowData}
          isLoading={false}
          emptyTitle={t('orgDashboard.noData')}
          emptyDescription=""
          zebra={false}
          stickyHeader={false}
          className="rounded-none shadow-none border-none"
        />
      ) : (
        <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
          {t('orgDashboard.noData')}
        </div>
      )}
    </div>
  );
}
