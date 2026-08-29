import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, Leaf } from 'lucide-react';
import EcoLottie from '@/components/organisation/EcoLottie';
import { formatMonthLabel, formatUserName } from '@/utils/formatters';

const FILTER_KEY='carbontrack.organisation.analytics.filters';
const EMPTY_ANALYTICS_DATA={};
const palette=['#059669','#0f766e','#3b82f6','#f59e0b','#64748b','#84cc16'];
const card = 'rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900';
const select = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const emptyAnimation = () => import('@/assets/animations/eco-empty.json');

function EmptyIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="43" fill="#ecfdf5" />
      <path d="M60 88V52M58 69c-18 0-27-9-27-23 16-1 27 7 27 23Zm4-12c16-1 25-9 25-22-16 0-25 8-25 22Z" fill="#4ade80" stroke="#059669" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Empty({ label }) {
  return (
    <div className="grid h-full min-h-40 place-items-center text-center text-xs text-slate-500">
      <div>
        <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Leaf className="h-4 w-4" />
        </span>
        No {label} available yet.
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-4" aria-label="Loading analytics">
      <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid gap-3.5 xl:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, description, summary, children, reduceMotion }) {
  return (
    <section className={card}>
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <div className="h-56">{children}</div>
      <p className="sr-only">{summary}</p>
    </section>
  );
}

function Tip({ active, payload, label }) {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length) return null;
  const rawItem = payload[0]?.payload;
  const displayTitle = label ? formatMonthLabel(label, i18n.language) : (rawItem?.displayName || (rawItem?.category ? t(`categories.${rawItem.category.toLowerCase()}`, { defaultValue: rawItem.category }) : (rawItem?.department ? t(`departments.${rawItem.department}`, { defaultValue: rawItem.department }) : '')));
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{displayTitle}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey || entry.name} className="flex items-center justify-between gap-4">
          <span className="text-slate-500">{entry.name}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e
          </span>
        </div>
      ))}
    </div>
  );
}

const monthKey = (row) => {
  const date = new Date(`${row.date}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (key, lang = 'en') => {
  const [year, month] = key.split('-');
  return formatMonthLabel(new Date(Number(year), Number(month) - 1, 1).toLocaleString('en', { month: 'short', year: '2-digit' }), lang);
};

const startFor = (range) => {
  const now = new Date(),
    start = new Date(now);
  if (range === 'month') start.setDate(1);
  if (range === 'quarter') start.setMonth(start.getMonth() - 2, 1);
  if (range === 'year') start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

export default function OrganisationAnalyticsPage({ data = {}, loading = false, error = '', onRetry }) {
  const reduceMotion = useReducedMotion();
  const { t, i18n } = useTranslation();
  const source = data || EMPTY_ANALYTICS_DATA;
  const stored = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(FILTER_KEY) || '{}');
    } catch {
      return {};
    }
  }, []);

  const [range, setRange] = useState(stored.range || 'all');
  const [department, setDepartment] = useState(stored.department || '');
  const [category, setCategory] = useState(stored.category || '');

  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({ range, department, category }));
  }, [range, department, category]);

  const employees = useMemo(() => source.employees || [], [source.employees]);
  const logs = useMemo(() => source.activityLogs || [], [source.activityLogs]);
  const goals = useMemo(() => source.goals || [], [source.goals]);
  const departments = useMemo(() => [...new Set(employees.map((row) => row.department).filter(Boolean))].sort(), [employees]);
  const categories = useMemo(() => [...new Set(logs.map((row) => row.category).filter(Boolean))].sort(), [logs]);

  useEffect(() => {
    if (department && !departments.includes(department)) setDepartment('');
    if (category && !categories.includes(category)) setCategory('');
  }, [department, category, departments, categories]);

  const filtered = useMemo(() => {
    const employeeDepartments = new Map(employees.map((row) => [row.name, row.department])),
      start = startFor(range),
      now = new Date();
    return logs.filter((row) => {
      const date = new Date(`${row.date}T00:00:00`);
      return (
        (range === 'all' || (!Number.isNaN(date.getTime()) && date >= start && date <= now)) &&
        (!department || employeeDepartments.get(row.employee) === department) &&
        (!category || row.category === category)
      );
    });
  }, [logs, employees, range, department, category]);

  const result = useMemo(() => {
    const employeeDepartments = new Map(employees.map((row) => [row.name, row.department])),
      ordered = [...filtered].sort((a, b) => String(a.date).localeCompare(String(b.date)));

    const monthWindow = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const period = formatMonthLabel(d.toLocaleString('en', { month: 'short', year: '2-digit' }), i18n.language);
      monthWindow.push({ key, period });
    }
    const emissions = (key, name) =>
      [
        ...ordered.reduce((map, row) => {
          const k = key(row);
          if (!k) return map;
          map.set(k, (map.get(k) || 0) + Number(row.emissions || 0));
          return map;
        }, new Map()),
      ].map(([label, value]) => ({ [name]: label, emissions: Number(value.toFixed(2)) }));

    // 6-month continuous emission trend
    const emissionMap = ordered.reduce((map, row) => {
      const key = monthKey(row);
      if (key) map.set(key, (map.get(key) || 0) + Number(row.emission || 0));
      return map;
    }, new Map());

    const trend = monthWindow.map(({ key, period }) => ({
      period,
      emissions: Number((emissionMap.get(key) || 0).toFixed(2)),
    }));

    const categoryRows = emissions((row) => row.category, 'category').map((row) => ({
      ...row,
      displayName: t(`categories.${row.category}`, { defaultValue: row.category }),
    })),
      departmentRows = emissions((row) => employeeDepartments.get(row.employee) || 'Unassigned', 'department').map((row) => ({
        ...row,
        displayName: t(`departments.${row.department}`, { defaultValue: row.department }),
      }));
    const employeeRows = emissions((row) => row.employee || 'Unknown', 'employee')
      .sort((a, b) => b.emissions - a.emissions)
      .slice(0, 12)
      .map((row) => ({
        ...row,
        displayName: formatUserName(row.employee, i18n.language),
      }));
    const eligible = employees.filter((row) => !department || row.department === department),
      participants = new Set(filtered.map((row) => row.employee).filter(Boolean));

    // 6-month continuous participation trend
    const participationMap = ordered.reduce((map, row) => {
      const key = monthKey(row);
      if (key) {
        if (!map.has(key)) map.set(key, new Set());
        if (row.employee) map.get(key).add(row.employee);
      }
      return map;
    }, new Map());

    const participation = monthWindow.map(({ key, period }) => {
      const names = participationMap.get(key);
      const count = names ? names.size : 0;
      const rate = eligible.length ? Number(((count * 100) / eligible.length).toFixed(1)) : 0;
      return { period, rate, participants: count };
    });

    const rangedGoals = goals.filter((goal) => {
      if (range === 'all') return true;
      const date = new Date(`${goal.endDate || goal.startDate}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date >= startFor(range) && date <= new Date();
    });

    // 6-month continuous goal progress trend
    const goalMap = rangedGoals.reduce((map, goal) => {
      const date = new Date(`${goal.endDate || goal.startDate}T00:00:00`);
      if (Number.isNaN(date.getTime())) return map;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const value = map.get(key) || { total: 0, sumProgress: 0 };
      value.total++;
      const target = Number(goal.targetKg || 0);
      const current = Number(goal.currentKg || 0);
      const progress = target > 0 ? Math.min(100, Math.max(0, (current * 100) / target)) : 0;
      value.sumProgress += progress;
      map.set(key, value);
      return map;
    }, new Map());

    const goalTrend = monthWindow.map(({ key, period }) => {
      const val = goalMap.get(key);
      const rate = val && val.total > 0 ? Number((val.sumProgress / val.total).toFixed(1)) : 0;
      return { period, rate };
    });

    const total = filtered.reduce((sum, row) => sum + Number(row.emission || 0), 0);
    return {
      trend,
      categoryRows,
      departmentRows,
      employeeRows,
      participation,
      goalTrend,
      total: Number(total.toFixed(2)),
      average: filtered.length ? Number((total / filtered.length).toFixed(2)) : null,
      participants: participants.size,
      eligible: eligible.length,
      participationRate: eligible.length ? Number(((participants.size * 100) / eligible.length).toFixed(1)) : null,
    };
  }, [employees, filtered, goals, department, range]);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-4 text-rose-700 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className="ml-auto rounded border border-rose-200 px-2 py-1 text-xs font-semibold dark:border-rose-800">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const highest = [...result.categoryRows].sort((a, b) => b.emissions - a.emissions)[0],
    best = [...result.departmentRows].sort((a, b) => a.emissions - b.emissions)[0],
    latestParticipation = result.participation.at(-1),
    latestGoal = result.goalTrend.at(-1),
    animate = !reduceMotion;

  const kpis = [
    [t('orgDash.filteredEmissions', 'Filtered emissions'), `${result.total.toLocaleString()} kg CO₂e`, `${filtered.length.toLocaleString()} ${t('orgDash.verifiedActivities', 'verified activities')}`],
    [t('orgDash.averagePerActivity', 'Average per activity'), result.average === null ? t('orgDash.notAvailable', 'Not available') : `${result.average.toLocaleString()} kg CO₂e`, t('orgDash.matchingActivityAverage', 'Matching activity average')],
    [t('orgDash.activeParticipants', 'Active participants'), result.participants.toLocaleString(), `${result.eligible.toLocaleString()} ${t('orgDash.eligibleEmployees', 'eligible employees')}`],
    [t('orgDash.participationRate', 'Participation rate'), result.participationRate === null ? t('orgDash.notAvailable', 'Not available') : `${result.participationRate}%`, t('orgDash.selectedFilterResult', 'Selected filter result')],
  ];

  return (
    <div className="space-y-4">
      <motion.header initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">{t('orgNav.intelligence', 'Organisation intelligence')}</p>
        <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">{t('orgNav.analytics', 'Analytics')}</h1>
        <p className="mt-0.5 max-w-2xl text-xs text-slate-500">{t('orgNav.analyticsDesc', 'Explore verified emissions, employee participation and goal performance using live organisation data.')}</p>
      </motion.header>

      <section className={card} aria-label={t('orgDash.analyticsFilters', 'Analytics filters')}>
        <div className="grid gap-2.5 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('orgDash.dateRange', 'Date range')}</span>
            <select aria-label="Analytics date range" className={select} value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="all">{t('orgDash.allAvailableDates', 'All available dates')}</option>
              <option value="month">{t('orgDash.thisMonth', 'This month')}</option>
              <option value="quarter">{t('orgDash.thisQuarter', 'This quarter')}</option>
              <option value="year">{t('orgDash.thisYear', 'This year')}</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('orgDash.departmentComparison', 'Department')}</span>
            <select aria-label="Analytics department" className={select} value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">{t('orgDash.allDepartments', 'All departments')}</option>
              {departments.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t('orgDash.categoryHeader', 'Category')}</span>
            <select aria-label="Analytics category" className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('orgDash.allCategories', 'All categories')}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800">
          <span aria-live="polite">{t('orgDash.showingMatchingActivities', 'Showing {{count}} matching activities', { count: filtered.length })}</span>
          {(range !== 'all' || department || category) && (
            <button
              type="button"
              onClick={() => {
                setRange('all');
                setDepartment('');
                setCategory('');
              }}
              className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              {t('orgDash.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>
      </section>

      <section aria-label={t('orgDash.analyticsSummary', 'Analytics summary')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, note], index) => (
          <motion.article key={label} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.04 }} className={card}>
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">{label}</p>
            <p className="mt-3 text-xl font-bold text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{note}</p>
          </motion.article>
        ))}
      </section>

      {!filtered.length && (
        <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-7 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
          <EcoLottie animationData={emptyAnimation} loop={false} className="mx-auto h-28 w-28" fallback={<EmptyIcon />} reducedMotionFallback={<EmptyIcon />} />
          <h2 className="mt-2 font-semibold text-slate-900 dark:text-white">{t('orgDash.noAnalyticsMatch', 'No analytics match these filters')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('orgDash.chooseOtherFilter', 'Choose another date range, department, or category.')}</p>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Overall Emission Trend */}
        <ChartCard title={t('orgDash.monthlyTrend', 'Overall Emission Trend')} description={t('orgDash.analyticsSubtitle', 'Emissions grouped by reporting month')} summary={`${result.trend.length} ${t('orgDash.periodsDisplayed', { defaultValue: 'periods displayed.' })}`} reduceMotion={reduceMotion}>
          <ResponsiveContainer>
            <AreaChart data={result.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsEmission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis width={46} tick={{ fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Area
                name={t('common.emissions', 'Emissions')}
                type="monotone"
                dataKey="emissions"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#analyticsEmission)"
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                isAnimationActive={animate}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title={t('orgDash.categoryDistribution', 'Category Distribution')} description={t('orgDash.categoryDistributionDesc', 'Share of matching emissions by category')} summary={highest ? `${t(`categories.${highest.category}`, { defaultValue: highest.category })} ${t('orgDash.isHighest', { defaultValue: 'is highest.' })}` : t('orgDash.noCategoryData', { defaultValue: 'No category data.' })} reduceMotion={reduceMotion}>
          {result.categoryRows.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={result.categoryRows} dataKey="emissions" nameKey="displayName" innerRadius="50%" outerRadius="76%" paddingAngle={3} isAnimationActive={animate}>
                  {result.categoryRows.map((row, index) => (
                    <Cell key={row.category} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty label={t('orgDash.categoryEmissionData', 'category emission data')} />
          )}
        </ChartCard>

        {/* Department Comparison */}
        <ChartCard title={t('orgDash.departmentComparison', 'Department Comparison')} description={t('orgDash.departmentComparisonDesc', 'Matching emissions by department')} summary={best ? `${t(`departments.${best.department}`, { defaultValue: best.department })} ${t('orgDash.hasLowestEmissions', { defaultValue: 'has the lowest emissions.' })}` : t('orgDash.noDepartmentData', { defaultValue: 'No department data.' })} reduceMotion={reduceMotion}>
          {result.departmentRows.length ? (
            <ResponsiveContainer>
              <BarChart data={result.departmentRows} margin={{ left: 10, right: 10, top: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayName" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<Tip />} />
                <Bar name={t('common.emissions', 'Emissions')} dataKey="emissions" radius={[6, 6, 0, 0]} isAnimationActive={animate}>
                  {result.departmentRows.map((row, index) => (
                    <Cell key={row.department || index} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty label={t('orgDash.departmentPerformanceData', 'department performance data')} />
          )}
        </ChartCard>

        {/* Employee Performance Distribution */}
        <ChartCard title={t('orgDash.employeePerformanceDistribution', 'Employee Performance Distribution')} description={t('orgDash.employeePerformanceDistributionDesc', 'Employee emissions for the selected filters')} summary={`${result.employeeRows.length} ${t('orgDash.employeesDisplayed', { defaultValue: 'employees displayed.' })}`} reduceMotion={reduceMotion}>
          {result.employeeRows.length ? (
            <ResponsiveContainer>
              <BarChart data={result.employeeRows} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayName" angle={-25} textAnchor="end" interval={0} height={50} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<Tip />} />
                <Bar name={t('common.emissions', 'Emissions')} dataKey="emissions" radius={[6, 6, 0, 0]} isAnimationActive={animate}>
                  {result.employeeRows.map((row, index) => (
                    <Cell key={row.employee} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty label={t('orgDash.contributorData', 'employee performance data')} />
          )}
        </ChartCard>

        {/* Participation Trend */}
        <ChartCard title={t('orgDash.participationTrend', 'Participation Trend')} description={t('orgDash.participationTrendDesc', 'Unique participating employees by month')} summary={latestParticipation ? `${t('orgDash.latestParticipationIs', { defaultValue: 'Latest participation is' })} ${latestParticipation.rate}%.` : t('orgDash.noParticipationData', { defaultValue: 'No participation data.' })} reduceMotion={reduceMotion}>
          <ResponsiveContainer>
            <LineChart data={result.participation} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="participationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} width={46} tick={{ fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Line
                name={t('orgDash.participationRate', 'Participation')}
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                isAnimationActive={animate}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Goal Completion Trend */}
        <ChartCard title={t('orgDash.goalCompletionTrend', 'Goal Completion Trend')} description={t('orgDash.goalCompletionTrendDesc', 'Completed goals grouped by target month')} summary={latestGoal ? `${t('orgDash.latestCompletionIs', { defaultValue: 'Latest completion is' })} ${latestGoal.rate}%.` : t('orgDash.noGoalTrendData', { defaultValue: 'No goal trend data.' })} reduceMotion={reduceMotion}>
          <ResponsiveContainer>
            <LineChart data={result.goalTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} width={46} tick={{ fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Line
                name={t('orgDash.completionRate', 'Completion rate')}
                type="monotone"
                dataKey="rate"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                isAnimationActive={animate}
              />
            </LineChart>
          </ResponsiveContainer>

        </ChartCard>
      </div>

      <motion.section initial={reduceMotion ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={card}>
        <h2 className="font-semibold text-slate-950 dark:text-white">{t('orgDash.keyInsights', 'Key Insights')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [t('orgDash.highestEmissionCategory', 'Highest emission category'), highest && t(`categories.${highest.category}`, { defaultValue: highest.category }), highest && `${highest.emissions.toLocaleString()} kg CO₂e`],
            [t('orgDash.bestPerformingDept', 'Best performing department'), best?.department && t(`departments.${best.department}`, { defaultValue: best.department }), best && `${best.emissions.toLocaleString()} kg CO₂e`],
            [t('orgDash.participationTrend', 'Participation trend'), latestParticipation && `${latestParticipation.rate}%`, t('orgDash.latestReportingMonth', 'Latest reporting month')],
            [t('orgDash.goalCompletionTrend', 'Goal completion trend'), latestGoal && `${latestGoal.rate}%`, t('orgDash.latestTargetMonth', 'Latest target month')],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-white">{value || t('orgDash.notAvailable', 'Not available')}</p>
              {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
