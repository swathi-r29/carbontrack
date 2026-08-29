import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyEmissionsChart({ monthlyEmissions = [] }) {
  const { t } = useTranslation();
  if (!monthlyEmissions || monthlyEmissions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card dark:shadow-lg">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
          📈 {t('orgDashboard.monthlyTrends')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('orgDashboard.noData')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card dark:shadow-lg">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
        📈 {t('orgDashboard.monthlyTrends')}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyEmissions} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            label={{ value: 'CO₂ (kg)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value) => value.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalEmissions"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ fill: '#16a34a', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total CO₂ Saved (kg)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
