import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * DepartmentComparison
 * ─────────────────────────────────────────────────────────────
 * Pie chart showing emission distribution by department.
 */

export default function DepartmentComparison({ departments = [] }) {
  const { t } = useTranslation();
  const COLORS = [
    '#16a34a', '#0d9488', '#06b6d4', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
  ];

  if (!departments || departments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card dark:shadow-lg">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
          🏢 {t('orgDashboard.departmentComparison')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('orgDashboard.noData')}</p>
      </div>
    );
  }

  const totalEmissions = departments.reduce(
    (total, department) => total + (Number(department.emissions) || 0),
    0,
  );

  // Support both the existing percentage contract and emission totals.
  const chartData = departments.map(dept => ({
    name: dept.department || 'Unassigned',
    value: Number.isFinite(Number(dept.percentageOfTotal))
      ? Number(dept.percentageOfTotal)
      : totalEmissions > 0
        ? ((Number(dept.emissions) || 0) / totalEmissions) * 100
        : 0,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card dark:shadow-lg">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
        🏢 {t('orgDashboard.departmentComparison')}
      </h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${(Number(value) || 0).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {departments.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${(Number(value) || 0).toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
