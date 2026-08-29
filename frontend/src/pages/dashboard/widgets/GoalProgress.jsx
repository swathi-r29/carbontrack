/**
 * GoalProgress — Monthly budget tracker with circular + bar progress
 */
import { useTranslation } from 'react-i18next';
import { Target, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, Badge, CircularProgress, ProgressBar } from '@/components/ui';
import { formatEmission, formatGoalTitle } from '@/utils/formatters';
import LazyLottie from '@/components/common/LazyLottie';
import plantAnimation from '@/assets/lottie/eco-plant.json';
import successAnimation from '@/assets/lottie/eco-success.json';
import emptyAnimation from '@/assets/lottie/eco-empty.json';

const CAT_KEY_MAP = {
  transport:   'activitiesPage.catTransport',
  electricity: 'activitiesPage.catElectricity',
  food:        'activitiesPage.catFood',
  shopping:    'activitiesPage.catShopping',
  energy:      'activitiesPage.catEnergy',
};

function GoalItem({ goal }) {
  const { t, i18n } = useTranslation();
  const pct     = Math.min(100, (goal.current / goal.target) * 100);
  const isOver  = goal.current >= goal.target;
  const isWarn  = pct >= 80 && !isOver;
  const color   = isOver ? 'red' : isWarn ? 'yellow' : 'green';
  const variant = isOver ? 'red' : isWarn ? 'yellow' : 'green';
  const daysLeft = goal.endDate
    ? Math.ceil((new Date(goal.endDate) - new Date()) / 86_400_000)
    : null;
  const isCompleted = daysLeft !== null && daysLeft <= 0;
  const isAchieved = isCompleted && !isOver;

  const titleKey = (goal.title || '').toLowerCase();
  const displayTitle = CAT_KEY_MAP[titleKey] ? t(CAT_KEY_MAP[titleKey]) : formatGoalTitle(goal.title, i18n.language);
  const periodText = goal.period === 'monthly' ? t('orgNav.thisMonth', 'monthly') : goal.period === 'quarterly' ? t('orgNav.thisQuarter', 'quarterly') : goal.period === 'annual' ? t('orgNav.thisYear', 'annual') : goal.period;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {/* Circular meter or Growing Tree Lottie animation once for achieved goals */}
      {isAchieved ? (
        <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-green-50 dark:bg-green-950/30 rounded-xl overflow-hidden" title="Goal Achieved!">
          <LazyLottie animationData={successAnimation} loop={false} autoplay={true} height={54} width={54} />
        </div>
      ) : (
        <CircularProgress value={pct} size={56} strokeWidth={5} color={color}>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
            {Math.round(pct)}%
          </span>
        </CircularProgress>
      )}

      {/* Detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {displayTitle}
          </p>
          <Badge variant={variant} size="xs" dot>
            {isOver ? t('dashboard.overBudget') : isWarn ? t('dashboard.watchOut') : t('dashboard.onTrack')}
          </Badge>
        </div>

        <ProgressBar
          value={goal.current}
          max={goal.target}
          size="sm"
          color={color}
          variant="gradient"
          className="mb-1.5"
        />

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{formatEmission(goal.current, 2, t)} {t('dashboard.used')}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {daysLeft != null ? (daysLeft < 0 ? t('dashboard.ended') : t('dashboard.daysLeft', { days: daysLeft })) : '—'} · {periodText}
          </span>
        </div>
      </div>
    </div>
  );
}


export default function GoalProgress({ goals, isLoading }) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <Card.Header title={t('dashboard.goalProgressTitle')} icon={Target} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 py-2">
              <div className="skeleton-shimmer h-14 w-14 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="skeleton-shimmer h-3 w-2/3" />
                <div className="skeleton-shimmer h-2 w-full" />
                <div className="skeleton-shimmer h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const primaryGoal = goals[0];
  const remaining   = primaryGoal
    ? Math.max(0, primaryGoal.target - primaryGoal.current)
    : 0;

  const primaryDaysLeft = primaryGoal?.endDate
    ? Math.ceil((new Date(primaryGoal.endDate) - new Date()) / 86_400_000)
    : null;
  const isPrimaryCompleted = primaryDaysLeft !== null && primaryDaysLeft <= 0;
  const isPrimaryAchieved = isPrimaryCompleted && primaryGoal?.current <= primaryGoal?.target;

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <Card.Header title={t('dashboard.goalProgressTitle')} icon={Target} />
        <div className="py-6 flex flex-col items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          <LazyLottie animationData={emptyAnimation} height={80} width={80} loop={true} />
          <p className="mt-2">{t('dashboard.noGoalsYet')}</p>
          <p className="text-xs mt-1 text-slate-500">{t('dashboard.createGoalSubtitle')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header
        title={t('dashboard.goalProgressTitle')}
        subtitle={t('dashboard.monthlyCarbonBudget')}
        icon={Target}
        iconColor="text-green-600"
        action={
          primaryGoal?.current <= primaryGoal?.target
            ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
            : <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
        }
      />

      {/* Primary goal hero */}
      {primaryGoal && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-100 dark:border-green-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('dashboard.remainingThisMonth')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatEmission(remaining, 2, t)}
              </p>
            </div>
            {isPrimaryAchieved ? (
              <div className="w-[72px] h-[72px] shrink-0 flex items-center justify-center bg-green-100/50 dark:bg-green-950/50 rounded-full overflow-hidden" title="Goal Achieved!">
                <LazyLottie animationData={successAnimation} loop={false} autoplay={true} height={68} width={68} />
              </div>
            ) : (
              <CircularProgress
                value={(primaryGoal.current / primaryGoal.target) * 100}
                size={72}
                strokeWidth={7}
                color={primaryGoal.current >= primaryGoal.target ? 'red' : 'green'}
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {Math.round((primaryGoal.current / primaryGoal.target) * 100)}%
                </span>
              </CircularProgress>
            )}
          </div>
          <ProgressBar
            value={primaryGoal.current}
            max={primaryGoal.target}
            variant="gradient"
            color={primaryGoal.current >= primaryGoal.target ? 'red' : 'green'}
            size="md"
            showValue
            label={`${formatEmission(primaryGoal.current, 2, t)} ${t('dashboard.of')} ${formatEmission(primaryGoal.target, 2, t)}`}
          />
        </div>
      )}

      {/* Sub-goals */}
      <div>
        {goals.slice(1).map((g) => <GoalItem key={g.id} goal={g} />)}
      </div>
    </Card>
  );
}
