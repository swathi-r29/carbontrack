/**
 * DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Full CarbonTrack dashboard — all sections assembled into a
 * responsive three-breakpoint grid:
 *
 *   Mobile  (< 768px)  — single column, stacked
 *   Tablet  (768-1280) — 2-column grid for charts + cards
 *   Desktop (> 1280px) — 3-column wide layout
 *
 * Data: mock (dashboardMock.js) — swap to API calls when ready.
 * Charts: Recharts — WeeklyTrendChart, MonthlyComparisonChart,
 *         CategoryPieChart (all with custom tooltips).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Tabs, Alert } from '@/components/ui';
import { ChartSkeleton } from '@/components/skeletons';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { useGoals } from '@/context/GoalContext';
import { TYPE_MAP } from '@/constants/activities';
import { getCommunityLeaderboard } from '@/api/leaderboardApi';
import { getPlatformAverages, getUserPercentile } from '@/api/benchmarkingApi';
import recommendationsService from '@/services/api/recommendationsService';

/* ── Chart components ─────────────────────────────────────────── */
import WeeklyTrendChart from '@/components/charts/WeeklyTrendChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import PlatformBenchmarkChart from '@/components/charts/PlatformBenchmarkChart';
import { formatEmission } from '@/utils/formatters';

/* ── Widget components ────────────────────────────────────────── */
import WelcomeBanner from './widgets/WelcomeBanner';
import EcoScoreWidget from '@/components/dashboard/EcoScoreWidget';
import KpiRow from './widgets/KpiRow';
import GoalProgress from './widgets/GoalProgress';
import RecentActivities from './widgets/RecentActivities';
import Recommendations from './widgets/Recommendations';
import Leaderboard from './widgets/Leaderboard';

function formatUnit(unitStr, t) {
  const u = String(unitStr || '').toLowerCase().trim();
  if (t(`activitiesPage.units.${u}`, { defaultValue: '' })) {
    return t(`activitiesPage.units.${u}`);
  }
  return unitStr;
}

function formatActivityLabel(v, row, t) {
  const typeKey = (row?.activityType || '').toLowerCase();
  const labelKey = (v || '').toLowerCase();

  if (typeKey && t(`activitiesPage.types.${typeKey}`, { defaultValue: '' })) {
    return t(`activitiesPage.types.${typeKey}`);
  }

  const str = `${typeKey} ${labelKey}`;
  if (str.includes('car_petrol') || str.includes('car petrol')) return t('activitiesPage.types.car_petrol');
  if (str.includes('car_diesel') || str.includes('car diesel')) return t('activitiesPage.types.car_diesel');
  if (str.includes('car_electric') || str.includes('car electric')) return t('activitiesPage.types.car_electric');
  if (str.includes('car_hybrid') || str.includes('car hybrid')) return t('activitiesPage.types.car_hybrid');
  if (typeKey === 'car' || labelKey === 'car') return t('activitiesPage.types.car_petrol');
  if (str.includes('water') || str.includes('bottle')) return t('activitiesPage.types.water_bottle');
  if (str.includes('dairy') || str.includes('milk') || str.includes('cheese')) return t('activitiesPage.types.dairy');
  if (str.includes('chicken') || str.includes('poultry')) return t('activitiesPage.types.chicken');
  if (str.includes('beef')) return t('activitiesPage.types.beef');
  if (str.includes('lamb') || str.includes('mutton')) return t('activitiesPage.types.lamb');
  if (str.includes('pork')) return t('activitiesPage.types.pork');
  if (str.includes('fish') || str.includes('seafood')) return t('activitiesPage.types.fish');
  if (str.includes('egg')) return t('activitiesPage.types.eggs');
  if (str.includes('veg')) return t('activitiesPage.types.vegetables');
  if (str.includes('fruit')) return t('activitiesPage.types.fruit');
  if (str.includes('coffee')) return t('activitiesPage.types.coffee');
  if (str.includes('beverage') || str.includes('soda') || str.includes('soft')) return t('activitiesPage.types.beverages');
  if (str.includes('motorcycle') || str.includes('bike')) return t('activitiesPage.types.motorcycle');
  if (str.includes('bus')) return t('activitiesPage.types.bus');
  if (str.includes('train')) return t('activitiesPage.types.train');
  if (str.includes('subway') || str.includes('metro')) return t('activitiesPage.types.subway');
  if (str.includes('flight')) return t('activitiesPage.types.flight_short');
  if (str.includes('electricity') || str.includes('grid')) return t('activitiesPage.types.electricity_grid');
  if (str.includes('solar')) return t('activitiesPage.types.electricity_solar');
  if (str.includes('wind')) return t('activitiesPage.types.electricity_wind');
  if (str.includes('natural_gas') || str.includes('gas')) return t('activitiesPage.types.natural_gas');
  if (str.includes('lpg') || str.includes('propane')) return t('activitiesPage.types.lpg');
  if (str.includes('heating_oil') || str.includes('oil')) return t('activitiesPage.types.heating_oil');
  if (str.includes('wood')) return t('activitiesPage.types.wood_burning');
  if (str.includes('coal')) return t('activitiesPage.types.coal');
  if (str.includes('clothing') || str.includes('clothes')) return t('activitiesPage.types.clothing_new');
  if (str.includes('smartphone') || str.includes('phone')) return t('activitiesPage.types.smartphone');
  if (str.includes('laptop') || str.includes('tablet')) return t('activitiesPage.types.laptop');
  if (str.includes('tv') || str.includes('television')) return t('activitiesPage.types.tv');
  if (str.includes('furniture')) return t('activitiesPage.types.furniture');
  if (str.includes('book') || str.includes('paper')) return t('activitiesPage.types.books');

  return v ?? row?.activityType?.replace(/_/g, ' ');
}

function getLocalizedTip(item, t) {
  const type = (item.activityType || '').toLowerCase();
  let tipKey = 'general';
  if (type.includes('petrol')) tipKey = 'petrol';
  else if (type.includes('diesel')) tipKey = 'diesel';
  else if (type.includes('transit') || type.includes('bus') || type.includes('train')) tipKey = 'transit';
  else if (type.includes('electricity') || type.includes('energy') || type.includes('grid')) tipKey = 'energy';
  else if (type.includes('meat') || type.includes('beef') || type.includes('food') || type.includes('diet') || type.includes('lamb') || type.includes('chicken') || type.includes('dairy')) tipKey = 'food';
  else if (type.includes('shopping') || type.includes('clothing') || type.includes('furniture')) tipKey = 'shopping';

  const localized = t(`recommendationsPage.activityTips.${tipKey}`);
  return localized || item.tip;
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { logs, isLoading: logsLoading, fetchLogs } = useActivity();
  const { goals, isLoading: goalsLoading } = useGoals();

  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [chartTab, setChartTab] = useState('weekly');
  const [platformAverages, setPlatformAverages] = useState([]);
  const [percentile, setPercentile] = useState(null);

  const chartTabs = [
    { id: 'weekly', label: t('dashboard.weeklyTrend') },
    { id: 'monthly', label: t('dashboard.monthly') },
    { id: 'category', label: t('dashboard.byCategory') },
    { id: 'benchmarks', label: t('dashboard.vsPlatform') },
  ];

  // Load backend logs on mount or when an activity is logged
  useEffect(() => {
    fetchLogs();

    const handleActivityLogged = () => {
      fetchLogs();
    };

    window.addEventListener('activity-logged', handleActivityLogged);
    return () => {
      window.removeEventListener('activity-logged', handleActivityLogged);
    };
  }, [fetchLogs]);

  // Callback to fetch dashboard statistics
  const fetchDashboardStats = useCallback((active) => {
    getCommunityLeaderboard()
      .then((data) => {
        if (!active) return;
        const mapped = (data.all || []).slice(0, 5).map((u) => ({
          rank: u.rank,
          username: u.username,
          monthly: u.totalEmissionsSaved,
          badge: u.rank === 1 ? '🏆' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : null,
          delta: 0,
          isCurrentUser: u.userId === user?.userId,
        }));
        setLeaderboardEntries(mapped);
      })
      .catch((err) => {
        console.error('Failed to load dashboard leaderboard:', err);
      })
      .finally(() => {
        if (active) setLeaderboardLoading(false);
      });

    recommendationsService.getRecommendations()
      .then((data) => {
        if (!active) return;
        const formatted = data.map((item, index) => {
          let icon = "💡";
          let title = t('recommendationsPage.titles.eco');
          const type = (item.activityType || '').toLowerCase();
          if (type.includes('bus') || type.includes('train') || type.includes('transit') || type.includes('subway')) {
            icon = "🚌"; title = t('recommendationsPage.titles.publicTransit');
          } else if (type.includes('car') || type.includes('transport') || type.includes('taxi') || type.includes('flight') || type.includes('petrol') || type.includes('diesel')) {
            icon = "🚗"; title = t('recommendationsPage.titles.transport');
          } else if (type.includes('beef') || type.includes('meat') || type.includes('food') || type.includes('lamb') || type.includes('chicken') || type.includes('dairy')) {
            icon = "🍔"; title = t('recommendationsPage.titles.diet');
          } else if (type.includes('energy') || type.includes('electricity') || type.includes('grid')) {
            icon = "⚡"; title = t('recommendationsPage.titles.energy');
          } else if (type.includes('furniture')) {
            icon = "🛋️"; title = t('recommendationsPage.titles.home');
          } else if (type.includes('clothing') || type.includes('shopping')) {
            icon = "🛍️"; title = t('recommendationsPage.titles.shopping');
          }

          return {
            id: index,
            icon,
            title,
            detail: getLocalizedTip(item, t),
            impact: item.emissions ? formatEmission(item.emissions, 2, t) : t('dashboard.impactLow', { defaultValue: 'Low Impact' }),
            tag: t('dashboard.aiTip', { defaultValue: 'AI Tip' }),
            tagColor: 'amber'
          };
        });
        setRecommendations(formatted);
      })
      .catch((err) => console.error('Failed to load recommendations:', err))
      .finally(() => { if (active) setRecsLoading(false); });

    getPlatformAverages()
      .then((data) => {
        if (!active) return;
        setPlatformAverages(data);
      })
      .catch((err) => console.error('Failed to load platform averages:', err));

    getUserPercentile()
      .then((data) => {
        if (!active) return;
        setPercentile(data.percentile);
      })
      .catch((err) => console.error('Failed to load user percentile:', err));
  }, [user, t]);

  // Load backend stats on mount or when activity is logged
  useEffect(() => {
    let active = true;
    fetchDashboardStats(active);

    const handleActivityLogged = () => {
      fetchDashboardStats(active);
    };

    window.addEventListener('activity-logged', handleActivityLogged);

    return () => {
      active = false;
      window.removeEventListener('activity-logged', handleActivityLogged);
    };
  }, [fetchDashboardStats]);

  // Calculate real KPIs from actual activity logs
  const realKpi = useMemo(() => {
    const getLogDateStr = (l) => {
      const d = l.logDate ?? l.date;
      if (!d) return '';
      if (Array.isArray(d)) {
        return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
      }
      if (typeof d === 'string') {
        return d.split('T')[0];
      }
      return '';
    };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const oneWeekAgoDate = new Date(now); oneWeekAgoDate.setDate(now.getDate() - 7);
    const oneWeekAgoStr = `${oneWeekAgoDate.getFullYear()}-${String(oneWeekAgoDate.getMonth() + 1).padStart(2, '0')}-${String(oneWeekAgoDate.getDate()).padStart(2, '0')}`;
    const twoWeeksAgoDate = new Date(now); twoWeeksAgoDate.setDate(now.getDate() - 14);
    const twoWeeksAgoStr = `${twoWeeksAgoDate.getFullYear()}-${String(twoWeeksAgoDate.getMonth() + 1).padStart(2, '0')}-${String(twoWeeksAgoDate.getDate()).padStart(2, '0')}`;

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfPrevMonthStr = `${startOfPrevMonth.getFullYear()}-${String(startOfPrevMonth.getMonth() + 1).padStart(2, '0')}-01`;

    const todayEmissions = logs
      .filter((l) => getLogDateStr(l) === todayStr)
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const yesterdayEmissions = logs
      .filter((l) => getLogDateStr(l) === yesterdayStr)
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const weeklyEmissions = logs
      .filter((l) => { const ds = getLogDateStr(l); return ds && ds >= oneWeekAgoStr; })
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const prevWeeklyEmissions = logs
      .filter((l) => { const ds = getLogDateStr(l); return ds && ds >= twoWeeksAgoStr && ds < oneWeekAgoStr; })
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const monthlyEmissions = logs
      .filter((l) => { const ds = getLogDateStr(l); return ds && ds >= startOfMonthStr; })
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const prevMonthlyEmissions = logs
      .filter((l) => { const ds = getLogDateStr(l); return ds && ds >= startOfPrevMonthStr && ds < startOfMonthStr; })
      .reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

    const totalAll = logs.reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);
    const distinctDays = new Set(
      logs.map(getLogDateStr).filter(Boolean)
    ).size || 1;
    const avgEmissions = totalAll / distinctDays;

    return {
      today: { value: todayEmissions, trend: todayEmissions >= yesterdayEmissions ? 'up' : 'down', delta: todayEmissions - yesterdayEmissions, deltaLabel: t('dashboardPage.vsYesterday', { defaultValue: 'vs yesterday' }) },
      weekly: { value: weeklyEmissions, trend: weeklyEmissions >= prevWeeklyEmissions ? 'up' : 'down', delta: weeklyEmissions - prevWeeklyEmissions, deltaLabel: t('dashboardPage.vsLastWeek', { defaultValue: 'vs last week' }) },
      monthly: { value: monthlyEmissions, trend: monthlyEmissions >= prevMonthlyEmissions ? 'up' : 'down', delta: monthlyEmissions - prevMonthlyEmissions, deltaLabel: t('dashboardPage.vsLastMonth', { defaultValue: 'vs last month' }) },
      avgPerDay: { value: avgEmissions, trend: avgEmissions > 20 ? 'up' : 'down', delta: avgEmissions - 20, deltaLabel: t('dashboardPage.vsTarget', { defaultValue: 'vs target' }) },
    };
  }, [logs, t]);

  // Map real logs to format expected by RecentActivities widget
  const recentActivitiesList = useMemo(() => {
    return logs.slice(0, 5).map((l) => {
      const typeObj = TYPE_MAP[l.activityType];
      return {
        id: l.id,
        category: l.category,
        activityType: formatActivityLabel(typeObj?.label ?? l.activityType, l, t),
        emissions: l.calculatedEmissions ?? 0,
        amount: l.amount,
        unit: formatUnit(l.unit, t),
        logDate: l.logDate,
        icon: typeObj?.icon ?? '🌱',
      };
    });
  }, [logs, t]);

  // Calculate real Weekly Trend (last 7 days stacked by category)
  const weeklyTrendData = useMemo(() => {
    const getLogDateStr = (l) => {
      const d = l.logDate ?? l.date;
      if (!d) return '';
      if (Array.isArray(d)) {
        return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
      }
      if (typeof d === 'string') {
        return d.split('T')[0];
      }
      return '';
    };

    const parseDateToDateObj = (log) => {
      const d = log.logDate ?? log.date;
      if (!d) return null;
      if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
      return new Date(d);
    };

    if (!logs || logs.length === 0) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const logDates = logs.map(parseDateToDateObj).filter(Boolean);
    let endDate = now;

    if (logDates.length > 0) {
      const maxDate = new Date(Math.max(...logDates.map(d => d.getTime())));
      maxDate.setHours(0, 0, 0, 0);
      // If latest log is more than 3 days old, anchor 7-day window to latest log date so chart displays bars
      if ((now.getTime() - maxDate.getTime()) > 3 * 24 * 60 * 60 * 1000) {
        endDate = maxDate;
      }
    }

    const days7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const dayDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const dayLogs = logs.filter((l) => getLogDateStr(l) === dayDateStr);

      const prevD = new Date(d);
      prevD.setDate(prevD.getDate() - 7);
      const prevDayDateStr = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${String(prevD.getDate()).padStart(2, '0')}`;

      const prevDayLogs = logs.filter((l) => getLogDateStr(l) === prevDayDateStr);

      const prevDayEmissions = prevDayLogs.reduce((sum, l) => sum + (l.calculatedEmissions ?? 0), 0);

      const dayObj = {
        day: dayLabel,
        currentWeek: 0,
        previousWeek: parseFloat(prevDayEmissions.toFixed(2)),
        transport: 0,
        energy: 0,
        food: 0,
        shopping: 0,
        other: 0,
        emissions: 0,
      };

      for (const l of dayLogs) {
        const cat = (l.category ?? 'other').toLowerCase();
        const value = l.calculatedEmissions ?? 0;
        if (cat in dayObj) {
          dayObj[cat] += value;
        } else {
          dayObj.other += value;
        }
        dayObj.emissions += value;
      }
      dayObj.currentWeek = parseFloat(dayObj.emissions.toFixed(2));
      days7.push(dayObj);
    }
    return days7;
  }, [logs]);

  // Calculate real Monthly Comparison (last 6 months vs target)
  const monthlyCompData = useMemo(() => {
    const parseDate = (log) => {
      const d = log.logDate ?? log.date;
      if (!d) return null;
      if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
      return new Date(d);
    };

    const monthlyComp = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mLogs = logs.filter((l) => {
        const ld = parseDate(l);
        return ld && ld >= mStart && ld <= mEnd;
      });

      const sum = mLogs.reduce((s, l) => s + (l.calculatedEmissions ?? 0), 0);
      const targetVal = 150; // default target baseline

      monthlyComp.push({
        month: d.toLocaleString('default', { month: 'short' }),
        emissions: parseFloat(sum.toFixed(2)),
        target: targetVal,
      });
    }
    return monthlyComp;
  }, [logs]);

  // Calculate Category Pie Data (current month or recent activities)
  const categoryData = useMemo(() => {
    const parseDate = (log) => {
      const d = log.logDate ?? log.date;
      if (!d) return null;
      if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
      return new Date(d);
    };

    if (!logs || logs.length === 0) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let mLogs = logs.filter((l) => {
      const ld = parseDate(l);
      return ld && ld >= startOfMonth;
    });

    if (mLogs.length === 0) {
      mLogs = logs;
    }

    const catMap = {
      transport: 0,
      electricity: 0,
      energy: 0,
      food: 0,
      shopping: 0,
      other: 0,
    };

    const normalizeCat = (log) => {
      const cat = (log.category || '').toLowerCase();
      const type = (log.activityType || '').toLowerCase();

      if (cat === 'transport' || type.includes('car') || type.includes('flight') || type.includes('bus') || type.includes('train') || type.includes('subway') || type.includes('taxi')) {
        return 'transport';
      }
      if (cat === 'electricity' || type.includes('electricity') || type.includes('solar') || type.includes('wind') || type.includes('grid')) {
        return 'electricity';
      }
      if (cat === 'energy' || type.includes('gas') || type.includes('oil') || type.includes('lpg') || type.includes('propane') || type.includes('wood') || type.includes('coal')) {
        return 'energy';
      }
      if (cat === 'food' || cat === 'diet' || type.includes('beef') || type.includes('chicken') || type.includes('dairy') || type.includes('water') || type.includes('coffee') || type.includes('egg') || type.includes('fruit') || type.includes('veg') || type.includes('meat') || type.includes('lamb') || type.includes('pork') || type.includes('fish')) {
        return 'food';
      }
      if (cat === 'shopping' || cat === 'retail' || type.includes('clothing') || type.includes('smartphone') || type.includes('laptop') || type.includes('furniture') || type.includes('book') || type.includes('tv')) {
        return 'shopping';
      }
      return 'other';
    };

    for (const l of mLogs) {
      const catKey = normalizeCat(l);
      const val = l.calculatedEmissions ?? 0;
      catMap[catKey] = (catMap[catKey] || 0) + val;
    }

    const labels = {
      transport: t('activitiesPage.catTransport', { defaultValue: 'Transport' }),
      electricity: t('activitiesPage.catElectricity', { defaultValue: 'Electricity' }),
      energy: t('activitiesPage.catEnergy', { defaultValue: 'Home Energy' }),
      food: t('activitiesPage.catFood', { defaultValue: 'Food' }),
      shopping: t('activitiesPage.catShopping', { defaultValue: 'Shopping' }),
      other: t('activitiesPage.catOther', { defaultValue: 'Other' }),
    };

    return Object.entries(catMap)
      .map(([cat, value]) => ({
        name: labels[cat] || cat,
        value: parseFloat(value.toFixed(2)),
        category: cat,
      }))
      .filter((item) => item.value > 0);
  }, [logs, t]);

  // Calculate Benchmark Comparison Data (this month vs platform averages)
  const benchmarkData = useMemo(() => {
    const categories = ['transport', 'energy', 'food', 'shopping', 'waste', 'other'];
    const labels = {
      transport: t('activitiesPage.catTransport', { defaultValue: 'Transport' }),
      electricity: t('activitiesPage.catElectricity', { defaultValue: 'Electricity' }),
      energy: t('activitiesPage.catEnergy', { defaultValue: 'Home Energy' }),
      food: t('activitiesPage.catFood', { defaultValue: 'Food' }),
      shopping: t('activitiesPage.catShopping', { defaultValue: 'Shopping' }),
      waste: t('activitiesPage.catWaste', { defaultValue: 'Waste' }),
      other: t('activitiesPage.catOther', { defaultValue: 'Other' }),
    };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const userCatMap = {};
    (logs || []).forEach((log) => {
      if (new Date(log.logDate) >= startOfMonth) {
        const cat = (log.category || 'other').toLowerCase();
        userCatMap[cat] = (userCatMap[cat] || 0) + (log.emissions || 0);
      }
    });

    const platformCatMap = {};
    (platformAverages || []).forEach((item) => {
      const cat = (item.category || 'other').toLowerCase();
      platformCatMap[cat] = item.averageEmissions || 0;
    });

    return categories.map((cat) => ({
      category: labels[cat] || cat,
      userVal: parseFloat((userCatMap[cat] || 0).toFixed(2)),
      avgVal: parseFloat((platformCatMap[cat] || 0).toFixed(2)),
    }));
  }, [logs, platformAverages, t]);

  const computedStreak = useMemo(() => {
    if (!logs || !logs.length) return 0;
    const dates = Array.from(new Set(logs.map(l => l.logDate ? l.logDate.slice(0, 10) : ''))).filter(Boolean).sort().reverse();
    if (!dates.length) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const latest = dates[0];
    if (latest !== today && latest !== yesterday) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(latest);

    for (let i = 0; i < dates.length; i++) {
      const expected = checkDate.toISOString().slice(0, 10);
      if (dates.includes(expected)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs]);

  const globalLoading = logsLoading || leaderboardLoading || goalsLoading || recsLoading;

  return (
    <div className="space-y-6">
      {/* 1 · Welcome Banner */}
      <WelcomeBanner user={user} kpi={realKpi} percentile={percentile} streak={computedStreak} />

      {user?.status === 'PENDING_APPROVAL' && (
        <Alert
          variant="warning"
          title="Organisation Membership Pending Approval"
        >
          Your request to join the organisation is pending approval from the administrator. Once approved, you will see your organisation-level leaderboard, challenges, and team metrics.
        </Alert>
      )}

      {/* 2 · Eco Score & Key KPI Summary Metrics */}
      <EcoScoreWidget />
      <KpiRow kpi={realKpi} isLoading={globalLoading} />

      {/* 3 · MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left block: tabbed charts */}
        <div className="xl:col-span-2 space-y-6">

          {/* Tabbed chart panel */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t('dashboardPage.emissionsAnalysis', { defaultValue: 'Emissions Analysis' })}
                </h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                   {t('dashboardPage.emissionsUnit', { defaultValue: 'CO₂e · kg' })}
                 </p>
              </div>
              <Tabs
                tabs={chartTabs}
                variant="pills"
                defaultTab="weekly"
                onChange={setChartTab}
              />
            </div>

            {globalLoading ? (
              <ChartSkeleton height={272} />
            ) : (
              <>
                {chartTab === 'weekly' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="green" dot size="sm">
                        {t('dashboardPage.last7Days', { defaultValue: 'Last 7 days' })}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {t('dashboardPage.stackedByCategory', { defaultValue: 'stacked by category' })}
                      </span>
                    </div>
                    {weeklyTrendData.every(d => d.emissions === 0) ? (
                      <div className="flex h-[272px] flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {t('dashboardPage.noActivityLast7Days', { defaultValue: 'No activity data in the last 7 days' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {t('dashboardPage.logActivitiesToSeeTrend', { defaultValue: 'Log activities to see your trend' })}
                        </p>
                      </div>
                    ) : (
                      <WeeklyTrendChart data={weeklyTrendData} height={272} dailyGoal={5} />
                    )}
                  </div>
                )}
                {chartTab === 'monthly' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="teal" dot size="sm">
                        {t('dashboardPage.sixMonthView', { defaultValue: '6-month view' })}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {t('dashboardPage.actualVsTarget', { defaultValue: 'actual vs target' })}
                      </span>
                    </div>
                    <MonthlyComparisonChart data={monthlyCompData} height={272} />
                  </div>
                )}
                {chartTab === 'category' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="purple" dot size="sm">
                        {t('dashboardPage.currentMonth', { defaultValue: 'Current month' })}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {t('dashboardPage.shareOfTotalCo2', { defaultValue: 'share of total CO₂' })}
                      </span>
                    </div>
                    {categoryData.length === 0 ? (
                      <div className="flex h-[272px] flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('dashboard.noActivities')}</p>
                      </div>
                    ) : (
                      <CategoryPieChart data={categoryData} height={272} innerRadius={64} />
                    )}
                  </div>
                )}
                {chartTab === 'benchmarks' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="amber" dot size="sm">
                        {t('dashboardPage.yourFootprintVsCommunity', { defaultValue: 'Your footprint vs community avg' })}
                      </Badge>
                    </div>
                    <PlatformBenchmarkChart data={benchmarkData} height={272} />
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── Two-col sub-grid: Recent Activities + Leaderboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentActivities
              activities={recentActivitiesList}
              isLoading={logsLoading}
            />
            <Leaderboard
              entries={leaderboardEntries}
              isLoading={leaderboardLoading}
            />
          </div>
        </div>

        {/* ── Right sidebar block ─────────────────────────────── */}
        <div className="space-y-6">
          <GoalProgress goals={goals} isLoading={globalLoading} />
          <Recommendations recommendations={recommendations} isLoading={recsLoading} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          5 · MONTHLY COMPARISON  (full width, always visible)
          ════════════════════════════════════════════════════════ */}
      <Card>
        <Card.Header
          title={t('dashboardPage.monthlyComparison', { defaultValue: 'Monthly Comparison' })}
          subtitle={t('dashboardPage.actualVsTarget', { defaultValue: 'Actual emissions vs monthly target' })}
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-green-500 shrink-0" aria-hidden="true" />
                {t('dashboardPage.actual', { defaultValue: 'Actual' })}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600 shrink-0" aria-hidden="true" />
                {t('dashboardPage.target', { defaultValue: 'Target' })}
              </span>
            </div>
          }
        />
        {globalLoading
          ? <ChartSkeleton height={200} />
          : <MonthlyComparisonChart data={monthlyCompData} height={200} />}
      </Card>
    </div>
  );
}
