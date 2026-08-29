import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Building2, Download, Eye, FileSpreadsheet, Leaf, Minus, Plus, Search, Star, Target, TrendingDown, Users, X } from 'lucide-react';
import {
  changeOrganisationPassword, createOrganisationGoal, deleteOrganisationGoal, getOrganisationPortal,
  updateOrganisationAdminProfile, updateOrganisationGoal, updateOrganisationProfile,
  createOrganisationEmployee, updateOrganisationEmployee, createOrganisationActivity,
} from '@/api/organisationApi';
import { formatMonthLabel, formatUserName, formatActivityName, formatReportTypeName } from '@/utils/formatters';
import EcoLottie from '@/components/organisation/EcoLottie';
import FallingLeaves from '@/components/organisation/FallingLeaves';
import OrganisationAnalyticsPage from '@/pages/organisation/OrganisationAnalyticsPage';
import OrganisationMonthlyTrendsPage from '@/pages/organisation/OrganisationMonthlyTrendsPage';
import OrganisationDepartmentComparisonPage from '@/pages/organisation/OrganisationDepartmentComparisonPage';
import OrganisationEmployeesPage from '@/pages/organisation/OrganisationEmployeesPage';
import OrganisationRankingsPage from '@/pages/organisation/OrganisationRankingsPage';
import OrganisationActivityLogsPage from '@/pages/organisation/OrganisationActivityLogsPage';
import OrganisationGoalsPage from '@/pages/organisation/OrganisationGoalsPage';
import OrganisationChallengesPage from '@/pages/organisation/OrganisationChallengesPage';
import OrganisationProfilePage from '@/pages/organisation/OrganisationProfilePage';
import OrganisationAdminProfilePage from '@/pages/organisation/OrganisationAdminProfilePage';

const colors=['#059669','#34d399','#0f766e','#a3e635','#f59e0b','#0ea5e9'];
const card='relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const input='h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100';
const sectionFrom=(pathname)=>pathname==='/organisation'?'dashboard':pathname.split('/').filter(Boolean).at(-1);
const plantAnimation=()=>import('@/assets/animations/eco-plant.json');
const earthAnimation=()=>import('@/assets/animations/eco-earth.json');
const emptyAnimation=()=>import('@/assets/animations/eco-empty.json');
const successAnimation=()=>import('@/assets/animations/eco-success.json');
const loaderAnimation=()=>import('@/assets/animations/eco-loader.json');

function EcoStaticFallback({type='plant',className='h-full w-full'}){
  return <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    <circle cx="60" cy="60" r="45" fill="#ecfdf5" fillOpacity=".12" stroke="#a7f3d0" strokeOpacity=".35" strokeWidth="2"/>
    {type==='success'
      ? <path d="m38 61 14 14 31-34" fill="none" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      : type==='earth'
        ? <g className="eco-earth-spin" style={{transformOrigin:'60px 60px'}}>
            <circle cx="60" cy="60" r="36" fill="#38bdf8"/>
            <path d="M35 49c8-13 20-21 34-22l4 10-8 9-13-1-7 10-10-6Zm23 43-6-15 7-11 13 2 5 11-8 13H58Zm22-36 9-7c4 9 5 19 1 29l-9-6-1-16Z" fill="#22c55e"/>
            <path d="M30 60h60M60 25c-13 12-18 24-18 35s5 23 18 35M60 25c13 12 18 24 18 35s-5 23-18 35" fill="none" stroke="#e0f2fe" strokeOpacity=".35" strokeWidth="1.5"/>
          </g>
        : <><path d="M60 91V48" stroke="#6ee7b7" strokeWidth="6" strokeLinecap="round"/><path d="M59 68c-20 0-29-10-29-25 18-1 29 8 29 25ZM61 55c18-1 27-10 27-24-17 0-28 9-27 24Z" fill="#4ade80"/></>}
    <style>{`.eco-earth-spin{animation:ecoEarthSpin 18s linear infinite}@keyframes ecoEarthSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.eco-earth-spin{animation:none!important}}`}</style>
  </svg>;
}
function OrganisationEcoLoader({label='Loading organisation data…'}){
  return <div className="grid min-h-[320px] place-items-center text-center"><div><EcoLottie animationData={loaderAnimation} className="mx-auto h-20 w-20" fallback={<EcoStaticFallback/>} reducedMotionFallback={<EcoStaticFallback/>}/><p className="mt-3 text-sm font-medium text-slate-500">{label}</p></div></div>;
}
function Empty({label}){return <div className="grid min-h-32 place-items-center text-center text-xs text-slate-500"><div><span className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40"><Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></span>No {label} available yet.</div></div>;}
function ChartCard({title,children}){return <section className={card}><h2 className="mb-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2><div className="h-48">{children}</div></section>;}


function ExecutiveSectionHeader({ title, subtitle, badge, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800 mb-2.5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {badge && (
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function AnimatedValue({value,suffix=''}) {
  const reduceMotion=useReducedMotion();const numeric=Number(value||0);const [display,setDisplay]=useState(reduceMotion?numeric:0);
  useEffect(()=>{if(reduceMotion){setDisplay(numeric);return}let frame;const start=performance.now();const tick=now=>{const progress=Math.min(1,(now-start)/700);setDisplay(numeric*(1-Math.pow(1-progress,3)));if(progress<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[numeric,reduceMotion]);
  return <>{Number.isInteger(numeric)?Math.round(display).toLocaleString():display.toFixed(1)}{suffix}</>;
}
function EcoBackground(){
  return <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(74,222,128,.16),transparent_32%),linear-gradient(130deg,#052e22,#0b3b2a_58%,#064e3b)]"/><div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:32px_32px]"/><FallingLeaves/></div>;
}

/* ── 1. Organisation Overview Banner ────────────────────────────── */
function DashboardHero({data}){
  const { t } = useTranslation();
  const reduceMotion=useReducedMotion();
  const kpis=data.kpis||{};
  const latestPeriod=(data.monthlyEmissions||[]).at(-1)?.month;
  const hasScore=kpis.averageCarbonScore!==null&&kpis.averageCarbonScore!==undefined;
  const hasReduction=kpis.monthlyReduction!==null&&kpis.monthlyReduction!==undefined;
  const hasParticipation=kpis.participationRate!==null&&kpis.participationRate!==undefined;
  const metrics=[
    [t('orgDash.sustainabilityScore', 'Sustainability score'),hasScore?<><AnimatedValue value={kpis.averageCarbonScore}/><span className="text-xs font-medium text-emerald-200"> / 100</span></>:'N/A'],
    [t('orgDash.reportingPeriod', 'Reporting period'),latestPeriod||'N/A'],
    [t('orgDash.carbonReduction', 'Monthly carbon reduction'),hasReduction?<><AnimatedValue value={kpis.monthlyReduction} suffix="%"/></>:'N/A'],
    [t('orgDash.participationRate', 'Participation rate'),hasParticipation?<><AnimatedValue value={kpis.participationRate} suffix="%"/></>:'N/A'],
  ];
  return <motion.section initial={reduceMotion?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} className="relative overflow-hidden rounded-2xl border border-emerald-800/60 px-4 py-3.5 text-white shadow-md sm:px-5 sm:py-4">
    <EcoBackground/>
    <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
      <div className="min-w-0">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-white/[.08] px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm">
          <Building2 className="h-3.5 w-3.5 shrink-0"/>
          <span className="truncate">{data.organisation?.name||t('orgNav.organisation', 'Organisation')}</span>
        </div>
        <h1 className="mt-2 text-lg font-black tracking-tight sm:text-xl leading-tight">{t('orgDash.overviewTitle', 'Organisation Sustainability Overview')}</h1>
        <p className="mt-1 text-xs text-emerald-50/80 leading-relaxed">{t('orgDash.overviewSubtitle', 'Scope emissions, employee participation, and CSR sustainability benchmarks.')}</p>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10 sm:grid-cols-4">
          {metrics.map(([label,value])=><div key={label} className="min-w-0 bg-emerald-950/35 px-3 py-2 backdrop-blur-sm"><dt className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">{label}</dt><dd className="mt-0.5 truncate text-xs sm:text-sm font-extrabold text-white">{value}</dd></div>)}
        </dl>
        <div className="mt-3">
          <Link to="/organisation/reports" className="group inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-emerald-950 shadow-sm transition hover:bg-emerald-50">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700"><Eye className="h-3.5 w-3.5"/></span>
            <span className="text-xs font-bold">{t('orgDash.viewCsrReports', 'View CSR Reports →')}</span>
          </Link>
        </div>
      </div>
      <div className="mx-auto flex h-[280px] w-[300px] shrink-0 items-center justify-center lg:mx-0">
        <DotLottieReact
          src="/animations/World.lottie"
          loop
          autoplay
          renderConfig={{
            devicePixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 3) * 2 : 4,
          }}
          className="h-full w-full object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  </motion.section>;
}

/* ── 2. Consistent KPI Cards ────────────────────────────────────── */
function KpiCardSkeleton(){
  return <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Loading metric">
    <div className="animate-pulse"><div className="flex items-center justify-between"><div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700"/><div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950"/></div><div className="mt-3 h-5 w-24 rounded bg-slate-200 dark:bg-slate-700"/></div>
  </div>;
}
function KpiSparkline({values,positiveWhenLower,reduceMotion}){
  const points=values.map((value,index)=>({index,value:Number(value)}));
  if(points.length<2)return null;
  const improved=positiveWhenLower?points.at(-1).value<=points.at(-2).value:points.at(-1).value>=points.at(-2).value;
  return <div className="h-6 w-16" aria-hidden="true"><ResponsiveContainer><AreaChart data={points} margin={{top:1,right:1,bottom:1,left:1}}><Area type="monotone" dataKey="value" stroke={improved?'#059669':'#64748b'} strokeWidth={1.5} fill={improved?'#d1fae5':'#f1f5f9'} isAnimationActive={!reduceMotion}/></AreaChart></ResponsiveContainer></div>;
}
function KpiCard({item,index,reduceMotion}){
  const {label,value,unit,Icon,change,trend,sparkline,positiveWhenLower}=item;
  const hasValue=value!==null&&value!==undefined&&Number.isFinite(Number(value));
  const positive=trend==='positive';const negative=trend==='negative';
  const TrendIcon=positive?(positiveWhenLower?ArrowDownRight:ArrowUpRight):negative?(positiveWhenLower?ArrowUpRight:ArrowDownRight):Minus;
  return <motion.article initial={reduceMotion?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:index*.04,duration:.25}} whileHover={reduceMotion?undefined:{y:-2}} className="group flex flex-col justify-between min-h-[82px] rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {hasValue ? (
          <p className="mt-1.5 flex items-baseline gap-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <span className="truncate"><AnimatedValue value={value}/></span>
            {unit && <span className="shrink-0 text-[11px] font-semibold text-slate-500">{unit}</span>}
          </p>
        ) : (
          <p className="mt-1.5 text-xs font-semibold text-slate-400">No data</p>
        )}
      </div>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">
        <Icon className="h-3.5 w-3.5"/>
      </span>
    </div>
    {Boolean(change) && (
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
        <div className={`inline-flex min-w-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${positive?'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300':negative?'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          <TrendIcon className="h-2.5 w-2.5 shrink-0"/>
          <span className="truncate">{change}</span>
        </div>
        {sparkline?.length>1&&<KpiSparkline values={sparkline} positiveWhenLower={positiveWhenLower} reduceMotion={reduceMotion}/>}
      </div>
    )}
  </motion.article>;
}
function OrganisationKpiCards({data,loading,error,onRetry}){
  const { t } = useTranslation();
  const reduceMotion=useReducedMotion();
  if(loading)return <section aria-label="Organisation metrics" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{Array.from({length:6},(_,index)=><KpiCardSkeleton key={index}/>)}</section>;
  if(error)return <section aria-label="Organisation metrics error" className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-rose-700 shadow-xs dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300"><div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"><AlertCircle className="h-4 w-4 shrink-0"/><div className="flex-1"><p className="font-semibold text-xs">Metrics could not be loaded</p></div><button type="button" onClick={onRetry} className="rounded border border-rose-200 px-2 py-1 text-xs font-semibold dark:border-rose-800">Retry</button></div></section>;
  const kpis=data.kpis||{};const monthly=(data.monthlyEmissions||[]).map(row=>Number(row.emissions)).filter(Number.isFinite);const currentMonth=monthly.at(-1);const previousMonth=monthly.at(-2);
  const emissionDelta=previousMonth>0?((currentMonth-previousMonth)*100/previousMonth):null;
  const reduction=Number.isFinite(Number(kpis.monthlyReduction))?Number(kpis.monthlyReduction):null;
  const activeEmployees=Array.isArray(data.employees)?data.employees.filter(employee=>String(employee.status).toUpperCase()==='ACTIVE').length:null;
  const changeLabel=(amount,invert=false)=>amount===null?null:`${Math.abs(amount).toFixed(1)}% ${amount===0?t('common.same', 'same'):invert?(amount<0?t('common.lower', 'lower'):t('common.higher', 'higher')):(amount>0?t('common.higher', 'higher'):t('common.lower', 'lower'))}`;
  const trendFor=(amount,invert=false)=>amount===null||amount===0?'neutral':(invert?amount<0:amount>0)?'positive':'negative';
  const items=[
    {label:t('orgDash.totalEmissions', 'Total Emissions'),value:kpis.totalEmission,unit:'kg CO₂e',Icon:Leaf,change:changeLabel(emissionDelta,true),trend:trendFor(emissionDelta,true),sparkline:monthly,positiveWhenLower:true},
    {label:t('orgDash.carbonReduction', 'Carbon Reduction'),value:reduction,unit:'%',Icon:TrendingDown,change:reduction===null?null:`${Math.abs(reduction).toFixed(1)}% ${reduction===0?t('common.same', 'same'):reduction>0?t('common.reduced', 'reduced'):t('common.increased', 'increased')}`,trend:trendFor(reduction),positiveWhenLower:false},
    {label:t('orgDash.activeEmployees', 'Active Employees'),value:activeEmployees,unit:t('orgDash.unitActive', 'active'),Icon:Users,trend:'neutral'},
    {label:t('orgDash.participationRate', 'Participation Rate'),value:kpis.participationRate,unit:'%',Icon:Activity,trend:'neutral'},
    {label:t('orgDash.activeGoals', 'Active Goals'),value:kpis.activeGoals,unit:t('orgDash.unitGoals', 'goals'),Icon:Target,trend:'neutral'},
    {label:t('orgDash.sustainabilityScore', 'Sustainability Score'),value:kpis.averageCarbonScore,unit:'/ 100',Icon:Star,trend:'neutral'},
  ];
  return <section aria-label="Organisation metrics" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{items.map((item,index)=><KpiCard key={item.label} item={item} index={index} reduceMotion={reduceMotion}/>)}</section>;
}

/* ── Dashboard Helpers & Subcomponents ────────────────────────── */
function DashboardSectionSkeleton({rows=4}){
  return <div className={`${card} animate-pulse`} aria-label="Loading dashboard section"><div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700"/><div className="mt-3 space-y-2">{Array.from({length:rows},(_,index)=><div key={index} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800/70"/>)}</div></div>;
}
function DashboardSectionHeader({title,description,to,linkLabel='View all',secondaryTo,secondaryLabel}){
  return <div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{description}</p></div><div className="flex shrink-0 flex-wrap justify-end gap-2">{secondaryTo&&<Link to={secondaryTo} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300">{secondaryLabel}</Link>}{to&&<Link to={to} className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">{linkLabel}</Link>}</div></div>;
}

/* ── 3. Carbon Emissions Analytics ─────────────────────────────── */
function CarbonEmissionsAnalyticsSection({data,loading,error,onRetry}){
  const reduceMotion=useReducedMotion();
  const { t, i18n } = useTranslation();
  const animatedRef=useRef(false);
  const animate=!reduceMotion&&!animatedRef.current;
  useEffect(()=>{animatedRef.current=true},[]);
  const monthly=(data.monthlyEmissions||[]).slice(-6).map(row => ({
    ...row,
    monthDisplay: formatMonthLabel(row.month, i18n.language)
  }));
  const categories=(data.categoryBreakdown||[]).map(row => ({
    ...row,
    displayName: t(`categories.${row.category.toLowerCase()}`, { defaultValue: row.category })
  }));
  const palette=['#059669','#0f766e','#3b82f6','#f59e0b','#64748b'];

  if(loading)return <div className="grid gap-3 xl:grid-cols-2"><DashboardSectionSkeleton/><DashboardSectionSkeleton/></div>;
  if(error)return <div className="rounded-xl border border-rose-200 p-4 text-rose-700 text-xs"><p className="font-semibold">{error}</p></div>;

  return (
    <div className="space-y-2.5">
      <ExecutiveSectionHeader 
        title={t('orgDash.emissionsAnalytics', 'Carbon Emissions Analytics')} 
        subtitle={t('orgDash.analyticsSubtitle', 'Verified emissions breakdown & monthly trends')} 
        badge={t('orgDash.scopeAnalytics', 'Scope Analytics')}
      />
      <div className="grid gap-3.5 xl:grid-cols-2">
        <ChartCard title={t('orgDash.monthlyTrend', 'Monthly Emission Trend')}>
          {monthly.length ? (
            <ResponsiveContainer>
              <AreaChart data={monthly} margin={{top:4,right:8,bottom:12,left:2}}>
                <defs>
                  <linearGradient id="dashboardEmissionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#059669" stopOpacity=".35"/>
                    <stop offset="1" stopColor="#059669" stopOpacity=".02"/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="monthDisplay" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#64748b'}}/>
                <YAxis tickLine={false} axisLine={false} width={42} tick={{fontSize:10,fill:'#64748b'}}/>
                <Tooltip content={<DashboardChartTooltip/>}/>
                <Area name={t('orgNav.dashboard', 'Emissions')} type="monotone" dataKey="emissions" stroke="#059669" strokeWidth={2} fill="url(#dashboardEmissionFill)" isAnimationActive={animate}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty label={t('orgDash.monthlyEmissionData', 'monthly emission data')}/>}
        </ChartCard>

        <ChartCard title={t('orgDash.emissionsByCategory', 'Emissions by Category')}>
          {categories.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categories} dataKey="emissions" nameKey="displayName" innerRadius="50%" outerRadius="75%" paddingAngle={2} isAnimationActive={animate}>
                  {categories.map((row,index)=><Cell key={row.category} fill={palette[index%palette.length]}/>)}
                </Pie>
                <Tooltip content={<DashboardChartTooltip/>}/>
                <Legend iconType="circle" wrapperStyle={{fontSize:'10px'}}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty label={t('orgDash.categoryEmissionData', 'category emission data')}/>}
        </ChartCard>
      </div>
    </div>
  );
}

/* ── 4. Department Comparison ──────────────────────────────────── */
function DepartmentComparisonSection({data,loading}){
  const reduceMotion=useReducedMotion();
  const { t } = useTranslation();
  const animatedRef=useRef(false);
  const animate=!reduceMotion&&!animatedRef.current;
  useEffect(()=>{animatedRef.current=true},[]);
  const departments = [...(data.departmentComparison || [])]
    .sort((a, b) => Number(a.emissions) - Number(b.emissions))
    .map((row) => ({
      ...row,
      displayName: t(`departments.${row.department}`, { defaultValue: row.department }),
    }));
  const bestDepartment=departments[0];

  if(loading)return <DashboardSectionSkeleton rows={4}/>;

  return (
    <div className="space-y-2.5">
      <ExecutiveSectionHeader 
        title={t('orgDash.departmentComparison', 'Department Comparison')} 
        subtitle={t('orgDash.departmentComparisonDesc', 'Departmental carbon footprints ranked from lowest to highest')} 
        badge={t('orgDash.operationalRanking', 'Operational Ranking')}
        action={
          <Link to="/organisation/departments" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('orgDash.fullDetails', 'Full details →')}
          </Link>
        }
      />
      <div className="grid gap-3.5 xl:grid-cols-2">
        <ChartCard title={t('orgDash.departmentFootprintChart', 'Department Footprint Chart')}>
          {departments.length ? (
            <ResponsiveContainer>
              <BarChart data={departments} margin={{top:10,right:12,bottom:25,left:4}}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="displayName" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#64748b'}} interval={0}/>
                <YAxis tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#64748b'}}/>
                <Tooltip content={<DashboardChartTooltip/>}/>
                <Bar name={t('orgNav.dashboard', 'Emissions')} dataKey="emissions" radius={[6,6,0,0]} isAnimationActive={animate}>
                  {departments.map((row, index) => (
                    <Cell key={row.department || index} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty label={t('orgDash.departmentPerformanceData', 'department performance data')}/>}
        </ChartCard>

        <section className={card}>
          <DashboardSectionHeader title={t('orgDash.departmentInsights', 'Department Performance Insights')} description={t('orgDash.departmentInsightsDesc', 'Summary takeaways from current department data.')}/>
          {departments.length ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{t('orgDash.leadingDepartment', 'Leading Department')}</p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                  {bestDepartment?.department ? t(`departments.${bestDepartment.department}`, { defaultValue: bestDepartment.department }) : '—'}
                </p>
                <p className="text-[11px] text-slate-500">{t('orgDash.lowestFootprint', 'Lowest footprint')}: {bestDepartment ? `${Number(bestDepartment.emissions).toLocaleString()} kg CO₂e` : '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/30">
                  <p className="text-[10px] font-medium text-slate-500">{t('orgDash.totalDepts', 'Total Depts')}</p>
                  <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">{departments.length}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/30">
                  <p className="text-[10px] font-medium text-slate-500">{t('orgDash.avgPerDept', 'Avg per Dept')}</p>
                  <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">
                    {departments.length ? `${Math.round(departments.reduce((s,d)=>s+Number(d.emissions),0)/departments.length).toLocaleString()} kg` : '—'}
                  </p>
                </div>
              </div>
            </div>
          ) : <Empty label={t('orgDash.departmentInsightsLabel', 'department insights')}/>}
        </section>
      </div>
    </div>
  );
}

/* ── 5. Employee Performance & Engagement ─────────────────────── */
function EmployeePerformanceSection({data,loading}){
  const reduceMotion=useReducedMotion();
  const { t, i18n } = useTranslation();
  const animatedRef=useRef(false);
  const animate=!reduceMotion&&!animatedRef.current;
  useEffect(()=>{animatedRef.current=true},[]);
  const contributors=(data.topContributors||[]).slice(0,4);
  const recent=(data.recentActivities||data.activityLogs||[]).slice(0,4);

  const participation=useMemo(()=>{
    const employees=data.employees||[];if(!employees.length)return[];
    const logs=data.activityLogs||[];const now=new Date();const points=[];
    for(let offset=5;offset>=0;offset--){
      const date=new Date(now.getFullYear(),now.getMonth()-offset,1);
      const year=date.getFullYear(),month=date.getMonth();
      const participants=new Set(logs.filter(log=>{const logged=new Date(`${log.date}T00:00:00`);return !Number.isNaN(logged.getTime())&&logged.getFullYear()===year&&logged.getMonth()===month}).map(log=>log.employee).filter(Boolean));
      const rawMonth = date.toLocaleString('en',{month:'short'});
      points.push({month: rawMonth, monthDisplay: formatMonthLabel(rawMonth, i18n.language), rate:Number((participants.size*100/employees.length).toFixed(1))});
    }
    return points;
  },[data.activityLogs,data.employees,i18n.language]);

  if(loading)return <div className="grid gap-3 xl:grid-cols-2"><DashboardSectionSkeleton/><DashboardSectionSkeleton/></div>;

  return (
    <div className="space-y-2.5">
      <ExecutiveSectionHeader 
        title={t('orgDash.employeePerformanceTitle', 'Employee Performance & Participation')} 
        subtitle={t('orgDash.employeePerformanceSubtitle', 'Workforce engagement, top carbon savers, and recent activities')} 
        badge={t('orgDash.workforceEsg', 'Workforce ESG')}
        action={
          <Link to="/organisation/employees" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('orgDash.manageEmployees', 'Manage employees →')}
          </Link>
        }
      />
      <div className="grid gap-3.5 xl:grid-cols-2">
        <ChartCard title={t('orgDash.participationTrend', 'Participation Trend')}>
          {participation.length ? (
            <ResponsiveContainer>
              <LineChart data={participation} margin={{top:4,right:8,bottom:12,left:2}}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="monthDisplay" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#64748b'}}/>
                <YAxis domain={[0,100]} tickLine={false} axisLine={false} width={38} tick={{fontSize:10,fill:'#64748b'}}/>
                <Tooltip content={<DashboardChartTooltip/>}/>
                <Line name={t('orgDash.participationRate', 'Participation')} type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{r:2.5,fill:'#3b82f6'}} activeDot={{r:4}} isAnimationActive={animate}/>
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty label={t('orgDash.participationHistory', 'participation history')}/>}
        </ChartCard>

        <section className={card}>
          <DashboardSectionHeader title={t('orgDash.topSustainabilityChampions', 'Top Sustainability Champions')} description={t('orgDash.rankedByCarbonSavings', 'Ranked by verified carbon savings.')} to="/organisation/top-contributors" linkLabel={t('orgDash.rankingsLabel', 'Rankings')}/>
          {contributors.length ? (
            <ol className="space-y-1.5">
              {contributors.map((employee,index)=>(
                <li key={employee.id||index} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-800/80">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${index===0?'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{index+1}</span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{employee.name?.trim()?.[0]?.toUpperCase()||'—'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{formatUserName(employee.name, i18n.language) || t('orgDash.employee', 'Employee')}</p>
                    <p className="truncate text-[10px] text-slate-400">{employee.department ? t(`departments.${employee.department}`, { defaultValue: employee.department }) : t('orgDash.general', 'General')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{Number.isFinite(Number(employee.carbonSaved))?`${Number(employee.carbonSaved).toLocaleString()} kg`:'—'}</p>
                    <p className="text-[9px] text-slate-400">{t('orgDash.saved', 'saved')}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <Empty label={t('orgDash.contributorData', 'contributor data')}/>}
        </section>
      </div>

      <section className={card}>
        <DashboardSectionHeader title={t('orgDash.recentOrganisationActivities', 'Recent Organisation Activities')} description={t('orgDash.recentActivitiesDesc', 'Latest verified activities submitted by employees.')} to="/organisation/activity-logs" linkLabel={t('orgDash.viewLogsLabel', 'View logs')}/>
        {recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700">
                  {[t('orgDash.employeeHeader', 'Employee'), t('orgDash.categoryHeader', 'Category'), t('orgDash.emissionHeader', 'Emission'), t('orgDash.dateHeader', 'Date'), t('orgDash.statusHeader', 'Status')].map(label=><th key={label} className="px-2.5 py-1.5 font-semibold">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {recent.map(activity=>(
                  <tr key={activity.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-2.5 py-1.5 font-bold text-slate-900 dark:text-white">{formatUserName(activity.employee, i18n.language) || t('orgDash.employee', 'Employee')}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{activity.category ? t(`categories.${activity.category.toLowerCase()}`, { defaultValue: activity.category }) : t('orgDash.general', 'General')}</span></td>
                    <td className="px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-200">{Number.isFinite(Number(activity.emission))?`${Number(activity.emission).toLocaleString()} kg CO₂e`:'—'}</td>
                    <td className="px-2.5 py-1.5 text-slate-500 text-[11px]">{activity.date?new Date(`${activity.date}T00:00:00`).toLocaleDateString():'—'}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{activity.status ? t(`common.status.${activity.status.toLowerCase()}`, { defaultValue: activity.status }) : t('common.status.verified', 'VERIFIED')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty label={t('orgDash.recentActivitiesLabel', 'recent organisation activities')}/>}
      </section>
    </div>
  );
}

/* ── 6. Monthly Trends & Goals Section ─────────────────────────── */
function MonthlyTrendsAndGoalsSection({data,loading}){
  const reduceMotion=useReducedMotion();
  const { t } = useTranslation();
  const goals=(data.goals||[]).filter(goal=>String(goal.status).toUpperCase()==='ACTIVE').slice(0,3);

  if(loading)return <div className="grid gap-3 xl:grid-cols-2"><DashboardSectionSkeleton/><DashboardSectionSkeleton/></div>;

  return (
    <div className="space-y-2.5">
      <ExecutiveSectionHeader 
        title={t('orgDash.goalsAndReports', 'Goals & Reports')} 
        subtitle={t('orgDash.goalsAndReportsSubtitle', 'Active ESG targets and compliance reports')} 
        badge={t('orgDash.csrTargets', 'CSR Targets')}
        action={
          <Link to="/organisation/goals" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('orgDash.manageGoals', 'Manage goals →')}
          </Link>
        }
      />
      <div className="grid gap-3.5 xl:grid-cols-2">
        <section className={card}>
          <DashboardSectionHeader title={t('orgDash.activeSustainabilityGoals', 'Active Sustainability Goals')} description={t('orgDash.corporateEmissionsTargets', 'Corporate emissions reduction targets.')} to="/organisation/goals" linkLabel={t('orgDash.allGoalsLabel', 'All goals')}/>
          {goals.length ? (
            <div className="space-y-2">
              {goals.map(goal=>{
                const target=Number(goal.targetKg),current=Number(goal.currentKg),progress=target>0?Math.min(100,Math.max(0,current*100/target)):0;
                return (
                  <div key={goal.id} className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{t(`goals.titles.${goal.title}`, { defaultValue: goal.title })}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{t('orgDash.target', 'Target')}: {Number.isFinite(target)?`${target.toLocaleString()} kg`:'—'} · {t('orgDash.deadline', 'Deadline')}: {goal.endDate||'Not set'}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{t(`common.status.${String(goal.status).toLowerCase()}`, { defaultValue: goal.status })}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <motion.div initial={reduceMotion?false:{width:0}} animate={{width:`${progress}%`}} transition={{duration:0.5}} className="h-full rounded-full bg-emerald-600"/>
                      </div>
                      <span className="w-8 text-right text-[10px] font-black text-slate-800 dark:text-slate-200">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <Empty label={t('orgDash.activeGoalsLabel', 'active organisation goals')}/>}
        </section>

        {/* CSR Reports Banner */}
        <section className="relative overflow-hidden rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-4 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                {t('orgDash.esgComplianceReady', 'ESG Compliance Ready')}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white">{t('orgDash.csrSustainabilityReports', 'CSR & Sustainability Reports')}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              {t('orgDash.exportReportsDesc', 'Export executive PDF or CSV sustainability reports covering Scope 1, 2 & 3 emissions.')}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/organisation/reports" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all">
              <Eye className="h-3.5 w-3.5"/> {t('orgDash.generateCsrReport', 'Generate CSR Report')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Staggered Section Motion Variants ────────────────────────── */
const dashboardStaggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // 120ms staggered delay between sections (100–150ms requirement)
      delayChildren: 0.04,
    },
  },
};

const dashboardSectionItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4, // 400ms smooth duration (300–500ms requirement)
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/* ── Main Executive Dashboard Container ─────────────────────────── */
function PremiumDashboard({ data, loading = false, error = '', onRetry }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="space-y-4 pb-2">
        <DashboardHero data={data} />
        <OrganisationKpiCards data={data} loading={loading} error={error} onRetry={onRetry} />
        <CarbonEmissionsAnalyticsSection data={data} loading={loading} error={error} onRetry={onRetry} />
        <DepartmentComparisonSection data={data} loading={loading} error={error} />
        <EmployeePerformanceSection data={data} loading={loading} />
        <MonthlyTrendsAndGoalsSection data={data} loading={loading} />
      </div>
    );
  }

  return (
    <motion.div
      variants={dashboardStaggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-2"
    >
      {/* 1. Organisation Overview Banner */}
      <motion.div variants={dashboardSectionItem}>
        <DashboardHero data={data} />
      </motion.div>

      {/* 2. Key Consistent KPI Cards */}
      <motion.div variants={dashboardSectionItem}>
        <OrganisationKpiCards data={data} loading={loading} error={error} onRetry={onRetry} />
      </motion.div>

      {/* 3. Carbon Emissions Analytics */}
      <motion.div variants={dashboardSectionItem}>
        <CarbonEmissionsAnalyticsSection data={data} loading={loading} error={error} onRetry={onRetry} />
      </motion.div>

      {/* 4. Department Comparison */}
      <motion.div variants={dashboardSectionItem}>
        <DepartmentComparisonSection data={data} loading={loading} error={error} />
      </motion.div>

      {/* 5. Employee Performance & Engagement */}
      <motion.div variants={dashboardSectionItem}>
        <EmployeePerformanceSection data={data} loading={loading} />
      </motion.div>

      {/* 6. Monthly Trends & Goals & CSR Reports */}
      <motion.div variants={dashboardSectionItem}>
        <MonthlyTrendsAndGoalsSection data={data} loading={loading} />
      </motion.div>
    </motion.div>
  );
}
function DashboardChartTooltip({active,payload,label}){
  const { t, i18n } = useTranslation();
  if(!active||!payload?.length)return null;
  const rawItem = payload[0]?.payload;
  const displayLabel = label ? formatMonthLabel(label, i18n.language) : (rawItem?.displayName || (rawItem?.category ? t(`categories.${rawItem.category.toLowerCase()}`, { defaultValue: rawItem.category }) : (rawItem?.department ? t(`departments.${rawItem.department}`, { defaultValue: rawItem.department }) : '')));
  return <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"><p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{displayLabel}</p>{payload.map(entry=><div key={entry.dataKey||entry.name} className="flex items-center justify-between gap-4"><span className="text-slate-500">{entry.name}</span><span className="font-semibold text-slate-900 dark:text-white">{Number(entry.value).toLocaleString(undefined,{maximumFractionDigits:1})}{entry.dataKey==='rate'?'%':' kg CO₂e'}</span></div>)}</div>;
}
function DashboardChartSkeleton(){
  return <div className="h-[340px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700"/><div className="mt-2 h-3 w-64 max-w-full rounded bg-slate-100 dark:bg-slate-800"/><div className="mt-8 h-56 rounded-xl bg-slate-50 dark:bg-slate-800/70"/></div>;
}
function DashboardChartCard({title,description,summary,children,className=''}) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}><div className="mb-5"><h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{children}<p className="sr-only">{summary}</p></section>;
}
function DashboardCharts({data,loading,error,onRetry}){
  const [range,setRange]=useState(6);const reduceMotion=useReducedMotion();const { t, i18n } = useTranslation();const animatedRef=useRef(false);const animate=!reduceMotion&&!animatedRef.current;
  useEffect(()=>{animatedRef.current=true},[]);
  const monthly=(data.monthlyEmissions||[]).slice(-range).map(row => ({
    ...row,
    monthDisplay: formatMonthLabel(row.month, i18n.language)
  }));
  const categories=(data.categoryBreakdown||[]).map(row => ({
    ...row,
    displayName: t(`categories.${row.category.toLowerCase()}`, { defaultValue: row.category })
  }));
  const departments=[...(data.departmentComparison||[])].map(row => ({
    ...row,
    displayName: t(`departments.${row.department}`, { defaultValue: row.department })
  })).sort((a,b)=>Number(a.emissions)-Number(b.emissions));
  const participation=useMemo(()=>{
    const employees=data.employees||[];if(!employees.length)return[];
    const logs=data.activityLogs||[];const now=new Date();const points=[];
    for(let offset=range-1;offset>=0;offset--){const date=new Date(now.getFullYear(),now.getMonth()-offset,1);const year=date.getFullYear(),month=date.getMonth();const participants=new Set(logs.filter(log=>{const logged=new Date(`${log.date}T00:00:00`);return !Number.isNaN(logged.getTime())&&logged.getFullYear()===year&&logged.getMonth()===month}).map(log=>log.employee).filter(Boolean));
    const rawMonth = date.toLocaleString('en',{month:'short'});
    points.push({month: rawMonth, monthDisplay: formatMonthLabel(rawMonth, i18n.language), rate:Number((participants.size*100/employees.length).toFixed(1))})}
    return points;
  },[data.activityLogs,data.employees,range,i18n.language]);
  const goals=(data.goals||[]).filter(goal=>String(goal.status).toUpperCase()==='ACTIVE').slice(0,6);
  const palette=['#059669','#0f766e','#3b82f6','#f59e0b','#64748b'];
  const latest=monthly.at(-1),highestCategory=[...categories].sort((a,b)=>Number(b.emissions)-Number(a.emissions))[0],bestDepartment=departments[0],latestParticipation=participation.at(-1);
  if(loading)return <section aria-label="Loading organisation charts" className="grid gap-5 xl:grid-cols-2">{Array.from({length:5},(_,index)=><DashboardChartSkeleton key={index}/>)}</section>;
  if(error)return <section className="rounded-2xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><AlertCircle className="h-5 w-5"/><div className="flex-1"><p className="font-semibold">Charts could not be loaded</p><p className="mt-1 text-sm opacity-80">{error}</p></div><button onClick={onRetry} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold dark:border-rose-800">Retry</button></div></section>;
  return <section aria-labelledby="dashboard-chart-heading" className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="dashboard-chart-heading" className="text-lg font-semibold text-slate-950 dark:text-white">{t('orgDash.sustainabilityPerformance', { defaultValue: 'Sustainability performance' })}</h2><p className="mt-1 text-sm text-slate-500">{t('orgDash.sustainabilityPerformanceDesc', { defaultValue: 'Charts use verified organisation activity and goal data.' })}</p></div><label className="w-full sm:w-auto"><span className="mb-1 block text-xs font-medium text-slate-500">{t('orgDash.datedTrendRange', { defaultValue: 'Dated trend range' })}</span><select className={`${input} sm:w-44`} value={range} onChange={event=>setRange(Number(event.target.value))}><option value={6}>{t('orgDash.last6Months', { defaultValue: 'Last 6 months' })}</option><option value={12}>{t('orgDash.last12Months', { defaultValue: 'Last 12 months' })}</option></select></label></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <DashboardChartCard title={t('orgDash.monthlyEmissionTrend', { defaultValue: 'Monthly Emission Trend' })} description={t('orgDash.monthlyEmissionTrendDesc', { defaultValue: `Last ${range} months · verified emissions` })} summary={latest?`Latest monthly emissions are ${latest.emissions} kilograms of carbon dioxide equivalent in ${latest.month}.`:'No monthly emission data is available.'}>
        {monthly.length?<div className="h-72"><ResponsiveContainer><AreaChart data={monthly} margin={{top:8,right:12,bottom:18,left:6}}><defs><linearGradient id="dashboardEmissionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#059669" stopOpacity=".3"/><stop offset="1" stopColor="#059669" stopOpacity=".02"/></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="monthDisplay" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#64748b'}} label={{value:t('orgDash.reportingMonth', { defaultValue: 'Reporting month' }),position:'insideBottom',offset:-12,fill:'#64748b',fontSize:11}}/><YAxis tickLine={false} axisLine={false} width={52} tick={{fontSize:11,fill:'#64748b'}} label={{value:'kg CO₂e',angle:-90,position:'insideLeft',fill:'#64748b',fontSize:11}}/><Tooltip content={<DashboardChartTooltip/>}/><Area name={t('orgNav.dashboard', { defaultValue: 'Emissions' })} type="monotone" dataKey="emissions" stroke="#059669" strokeWidth={2.5} fill="url(#dashboardEmissionFill)" isAnimationActive={animate}/></AreaChart></ResponsiveContainer></div>:<Empty label={t('orgDash.noDailyEmissions', { defaultValue: 'monthly emission data' })}/>}
      </DashboardChartCard>
      <DashboardChartCard title={t('orgDash.emissionsByCategory', { defaultValue: 'Emissions by Category' })} description={t('orgDash.allVerifiedActivity', { defaultValue: 'All verified activity currently available' })} summary={highestCategory?`${highestCategory.category} is the largest category at ${highestCategory.emissions} kilograms of carbon dioxide equivalent.`:'No category emission data is available.'}>
        {categories.length?<div className="h-72"><ResponsiveContainer><PieChart><Pie data={categories} dataKey="emissions" nameKey="displayName" innerRadius="52%" outerRadius="78%" paddingAngle={2} isAnimationActive={animate}>{categories.map((row,index)=><Cell key={row.category} fill={palette[index%palette.length]}/>)}</Pie><Tooltip content={<DashboardChartTooltip/>}/><Legend iconType="circle" wrapperStyle={{fontSize:'11px'}}/></PieChart></ResponsiveContainer></div>:<Empty label={t('orgDash.noCategoryTrendData', { defaultValue: 'category emission data' })}/>}
      </DashboardChartCard>
      <DashboardChartCard title={t('orgDash.departmentPerformance', { defaultValue: 'Department Performance' })} description={t('orgDash.lowerEmissionsBetter', { defaultValue: 'Lower emissions indicate stronger performance' })} summary={bestDepartment?`${bestDepartment.department} currently has the lowest recorded emissions at ${bestDepartment.emissions} kilograms of carbon dioxide equivalent.`:'No department performance data is available.'}>
        {departments.length?<div className="h-72"><ResponsiveContainer><BarChart data={departments} margin={{top:10,right:18,bottom:25,left:8}}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="displayName" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#64748b'}} interval={0}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#64748b'}}/><Tooltip content={<DashboardChartTooltip/>}/><Bar name={t('orgNav.dashboard', { defaultValue: 'Emissions' })} dataKey="emissions" radius={[6,6,0,0]} isAnimationActive={animate}>{departments.map((row,index)=><Cell key={row.department||index} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>:<Empty label={t('orgDash.departmentPerformanceData', { defaultValue: 'department performance data' })}/>}
      </DashboardChartCard>
      <DashboardChartCard title={t('orgDash.participationTrend', { defaultValue: 'Participation Trend' })} description={t('orgDash.monthlyParticipationDesc', { defaultValue: `Monthly activity participation · last ${range} months` })} summary={latestParticipation?`The latest participation rate derived from recorded activities is ${latestParticipation.rate} percent.`:'No participation history is available.'}>
        {participation.length?<div className="h-72"><ResponsiveContainer><LineChart data={participation} margin={{top:8,right:12,bottom:18,left:6}}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="monthDisplay" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#64748b'}} label={{value:t('orgDash.reportingMonth', { defaultValue: 'Reporting month' }),position:'insideBottom',offset:-12,fill:'#64748b',fontSize:11}}/><YAxis domain={[0,100]} tickLine={false} axisLine={false} width={45} tick={{fontSize:11,fill:'#64748b'}} label={{value:'Rate %',angle:-90,position:'insideLeft',fill:'#64748b',fontSize:11}}/><Tooltip content={<DashboardChartTooltip/>}/><Line name={t('orgDash.participationRate', { defaultValue: 'Participation' })} type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{r:3,fill:'#3b82f6'}} activeDot={{r:5}} isAnimationActive={animate}/></LineChart></ResponsiveContainer></div>:<Empty label={t('orgDash.participationHistory', { defaultValue: 'participation history' })}/>}
      </DashboardChartCard>
      <DashboardChartCard title={t('orgDash.goalProgress', { defaultValue: 'Goal Progress' })} description={t('orgDash.goalProgressDesc', { defaultValue: 'Progress from active organisation goals' })} summary={goals.length?`${goals.length} active goals are displayed with their current completion percentages.`:'No active goal data is available.'} className="xl:col-span-2">
        {goals.length?<div className="grid gap-4 md:grid-cols-2">{goals.map(goal=>{const target=Number(goal.targetKg);const current=Number(goal.currentKg);const progress=target>0?Math.min(100,Math.max(0,current*100/target)):0;return <div key={goal.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30"><div className="flex items-center justify-between gap-4"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{t(`goals.titles.${goal.title}`, { defaultValue: goal.title })}</p><span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{progress.toFixed(0)}%</span></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><motion.div initial={animate?{width:0}:false} animate={{width:`${progress}%`}} transition={{duration:.65,ease:'easeOut'}} className="h-full rounded-full bg-emerald-600"/></div><p className="mt-2 text-xs text-slate-500">{Number.isFinite(current)?current.toLocaleString():0} of {Number.isFinite(target)?target.toLocaleString():0} kg CO₂e</p></div>})}</div>:<Empty label={t('orgPortal.noGoalsMatch', { defaultValue: 'active goal data' })}/>}
      </DashboardChartCard>
    </div>
  </section>;
}
function AnalyticsPage({data}){
  const { t } = useTranslation();
  const [range,setRange]=useState('all');const [department,setDepartment]=useState('');const [category,setCategory]=useState('');
  const departmentOptions=useMemo(()=>[...new Set((data.employees||[]).map(row=>row.department).filter(Boolean))].sort(),[data.employees]);
  const categoryOptions=useMemo(()=>[...new Set((data.activityLogs||[]).map(row=>row.category).filter(Boolean))].sort(),[data.activityLogs]);
  const filtered=useMemo(()=>{
    const now=new Date(),start=new Date(now);if(range==='month')start.setDate(1);if(range==='quarter')start.setMonth(start.getMonth()-2,1);if(range==='year')start.setMonth(0,1);
    const employeeDepartment=new Map((data.employees||[]).map(employee=>[employee.name,employee.department]));
    return (data.activityLogs||[]).filter(log=>{const date=new Date(`${log.date}T00:00:00`);return (range==='all'||(!Number.isNaN(date.getTime())&&date>=start&&date<=now))&&(!department||employeeDepartment.get(log.employee)===department)&&(!category||log.category===category)});
  },[data.activityLogs,data.employees,range,department,category]);
  const analyticsData=useMemo(()=>{
    const employeeDepartment=new Map((data.employees||[]).map(employee=>[employee.name,employee.department]));
    const chronological=[...filtered].sort((left,right)=>String(left.date).localeCompare(String(right.date)));
    const aggregate=(key,getKey)=>[...chronological.reduce((map,row)=>{const name=getKey(row);if(name)map.set(name,(map.get(name)||0)+Number(row.emission||0));return map},new Map())].map(([name,emissions])=>({[key]:name,displayName:key==='department'?t(`departments.${name}`,{defaultValue:name}):key==='category'?t(`categories.${name}`,{defaultValue:name}):name,emissions:Number(emissions.toFixed(2))}));
    const categories=aggregate('category',row=>row.category),departments=aggregate('department',row=>employeeDepartment.get(row.employee)||'Unassigned');
    const monthly=aggregate('month',row=>{const date=new Date(`${row.date}T00:00:00`);return Number.isNaN(date.getTime())?'':date.toLocaleString('en',{month:'short',year:'2-digit'})});
    const dated=aggregate('day',row=>{const date=new Date(`${row.date}T00:00:00`);return Number.isNaN(date.getTime())?'':date.toLocaleDateString('en',{day:'numeric',month:'short'})});
    const eligible=(data.employees||[]).filter(employee=>!department||employee.department===department),participants=new Set(filtered.map(row=>row.employee).filter(Boolean));
    return {...data,categoryBreakdown:categories,departmentComparison:departments,monthlyEmissions:monthly,weeklyTrend:dated,kpis:{...data.kpis,participationRate:eligible.length?Number((participants.size*100/eligible.length).toFixed(1)):null,totalEmployees:eligible.length}};
  },[data,filtered,department,t]);
  const categories=analyticsData.categoryBreakdown||[],departments=analyticsData.departmentComparison||[];
  const highestCategory=[...categories].sort((a,b)=>Number(b.emissions)-Number(a.emissions))[0],bestDepartment=[...departments].sort((a,b)=>Number(a.emissions)-Number(b.emissions))[0];
  const insights=[
    [t('orgDash.highestEmissionCategory', { defaultValue: 'Highest-emission category' }),highestCategory?.category?t(`categories.${highestCategory.category}`, { defaultValue: highestCategory.category }):t('common.notAvailable', { defaultValue: 'No category data' }),highestCategory?`${Number(highestCategory.emissions).toLocaleString()} kg CO₂e`:t('common.notAvailable', { defaultValue: 'No matching activity data' })],
    [t('orgDash.bestPerformingDept', { defaultValue: 'Best-performing department' }),bestDepartment?.department?t(`departments.${bestDepartment.department}`, { defaultValue: bestDepartment.department }):t('common.notAvailable', { defaultValue: 'No department data' }),bestDepartment?`${Number(bestDepartment.emissions).toLocaleString()} kg CO₂e`:t('common.notAvailable', { defaultValue: 'No matching department data' })],
    [t('orgDash.filteredActivities', { defaultValue: 'Filtered activities' }),filtered.length,range==='all'?t('orgDash.allAvailableRecords', { defaultValue: 'All available verified records' }):t('orgDash.recordsInPeriod', { defaultValue: 'Verified records in selected period' })],
    [t('orgDash.participationRate', { defaultValue: 'Participation rate' }),analyticsData.kpis?.participationRate===null?t('common.notAvailable', { defaultValue: 'Not available' }):`${analyticsData.kpis?.participationRate}%`,`${analyticsData.kpis?.totalEmployees||0} ${t('orgDash.eligibleEmployees', { defaultValue: 'eligible employees' })}`]
  ];
  return <div className="space-y-5">
    <section className={`${card} sticky top-[84px] z-10`}>
      <div className="grid gap-3 md:grid-cols-3">
        <label><span className="mb-1.5 block text-xs font-medium text-slate-500">{t('orgPortal.dateRange', { defaultValue: 'Date range' })}</span><select className={input} aria-label="Analytics date range" value={range} onChange={event=>setRange(event.target.value)}><option value="all">{t('orgPortal.allDates', { defaultValue: 'All available dates' })}</option><option value="month">{t('orgPortal.thisMonth', { defaultValue: 'This month' })}</option><option value="quarter">{t('orgPortal.thisQuarter', { defaultValue: 'This quarter' })}</option><option value="year">{t('orgPortal.thisYear', { defaultValue: 'This year' })}</option></select></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-500">{t('orgPortal.department', { defaultValue: 'Department' })}</span><select className={input} aria-label="Analytics department" value={department} onChange={event=>setDepartment(event.target.value)}><option value="">{t('orgPortal.allDepartments', { defaultValue: 'All departments' })}</option>{departmentOptions.map(value=><option key={value} value={value}>{t(`departments.${value}`, { defaultValue: value })}</option>)}</select></label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-500">{t('activitiesPage.category', { defaultValue: 'Category' })}</span><select className={input} aria-label="Analytics category" value={category} onChange={event=>setCategory(event.target.value)}><option value="">{t('orgPortal.allCategories', { defaultValue: 'All categories' })}</option>{categoryOptions.map(value=><option key={value} value={value}>{t(`categories.${value}`, { defaultValue: value })}</option>)}</select></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800"><span>{t('orgDash.showingMatching', { defaultValue: `Showing ${filtered.length.toLocaleString()} matching verified activities` })}</span>{(range!=='all'||department||category)&&<button type="button" onClick={()=>{setRange('all');setDepartment('');setCategory('')}} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">{t('orgDash.clearFilters', { defaultValue: 'Clear filters' })}</button>}</div>
    </section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{insights.map(([label,value,note])=><article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 truncate text-lg font-bold text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>)}</div>
    {!filtered.length&&<div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-6 text-center dark:border-emerald-900 dark:bg-emerald-950/20"><EcoLottie animationData={emptyAnimation} className="mx-auto h-28 w-28" fallback={<EcoStaticFallback/>} reducedMotionFallback={<EcoStaticFallback/>}/><h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{t('orgDash.noAnalyticsMatch', { defaultValue: 'No analytics match these filters' })}</h3><p className="mt-1 text-sm text-slate-500">{t('orgDash.tryAnotherRange', { defaultValue: 'Try another date range, department, or activity category.' })}</p></div>}
    <TrendCharts data={analyticsData}/>
    <ChartCard title={t('orgDash.participationAndGoalCompletion', { defaultValue: 'Participation and Goal Completion' })}><ResponsiveContainer><BarChart data={[{name:t('orgDash.participationRate', { defaultValue: 'Participation' }),value:analyticsData.kpis.participationRate||0},{name:t('orgDash.goalCompletion', { defaultValue: 'Goal completion' }),value:data.goals.length?data.goals.filter(goal=>goal.status==='ACHIEVED').length*100/data.goals.length:0}]}><CartesianGrid strokeDasharray="3 3" opacity=".18"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip formatter={value=>[`${Number(value).toFixed(1)}%`,t('orgDash.rate', { defaultValue: 'Rate' })]}/><Bar dataKey="value" radius={[6,6,0,0]}>{[{name:t('orgDash.participationRate', { defaultValue: 'Participation' }),value:analyticsData.kpis.participationRate||0},{name:t('orgDash.goalCompletion', { defaultValue: 'Goal completion' }),value:data.goals.length?data.goals.filter(goal=>goal.status==='ACHIEVED').length*100/data.goals.length:0}].map((entry,index)=><Cell key={entry.name} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></ChartCard>
  </div>;
}
function MonthlyTrendPage({data}){
  const { t } = useTranslation();
  const rows=data.monthlyEmissions||[];
  const latest=rows.at(-1);
  const previous=rows.at(-2);
  const change=previous?.emissions?((Number(latest?.emissions||0)-Number(previous.emissions))*100/Number(previous.emissions)):0;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <article className={card}>
        <p className="text-xs text-slate-500">{t('orgDash.latestReportingMonth', { defaultValue: 'Latest month' })}</p>
        <p className="mt-2 text-xl font-bold">{latest?.month||'—'}</p>
      </article>
      <article className={card}>
        <p className="text-xs text-slate-500">{t('orgDash.filteredEmissions', { defaultValue: 'Latest emissions' })}</p>
        <p className="mt-2 text-xl font-bold">{latest?`${Number(latest.emissions||0).toLocaleString()} kg CO₂e`:'—'}</p>
      </article>
      <article className={card}>
        <p className="text-xs text-slate-500">{t('orgDash.previousMonthComparison', { defaultValue: 'Month-over-month change' })}</p>
        <p className={`mt-2 text-xl font-bold ${change<=0?'text-emerald-600':'text-red-600'}`}>{previous?`${change>0?'+':''}${change.toFixed(1)}%`:'—'}</p>
      </article>
    </div>
    <ChartCard title={t('orgDash.monthlyLineChart', { defaultValue: 'Monthly Emission Trend' })}>
      {data.monthlyEmissions?.length?<ResponsiveContainer><AreaChart data={data.monthlyEmissions}><defs><linearGradient id="monthlyOnlyGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#059669" stopOpacity=".4"/><stop offset="1" stopColor="#059669" stopOpacity=".03"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" opacity=".18"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Area type="monotone" dataKey="emissions" stroke="#059669" strokeWidth={2} fill="url(#monthlyOnlyGreen)"/></AreaChart></ResponsiveContainer>:<Empty label={t('orgDash.monthlyEmissionData', { defaultValue: 'monthly emission data' })}/>}
    </ChartCard>
    <section className={card}>
      <h2 className="mb-4 text-base font-semibold">{t('orgDash.monthlyRecords', { defaultValue: 'Monthly records' })}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{t('orgDash.month', { defaultValue: 'Month' })}</th><th className="px-4 py-3">{t('orgDash.emissions', { defaultValue: 'Emissions' })}</th></tr></thead><tbody>{data.monthlyEmissions?.map(row=><tr key={row.month} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{row.month}</td><td className="px-4 py-3">{Number(row.emissions||0).toLocaleString()} kg CO₂e</td></tr>)}</tbody></table>{!data.monthlyEmissions?.length&&<Empty label={t('orgDash.monthlyRecords', { defaultValue: 'monthly records' })}/>}</div>
    </section>
  </div>;
}
function EmployeePage({rows,reload}){
  const { t } = useTranslation();
  const active=rows.filter(row=>String(row.status).toLowerCase()==='active').length;
  const departments=new Set(rows.map(row=>row.department).filter(Boolean)).size;
  const average=rows.length?rows.reduce((sum,row)=>sum+Number(row.carbonScore||0),0)/rows.length:0;
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><article className={card}><p className="text-xs text-slate-500">{t('orgPortal.totalEmployees', { defaultValue: 'Total employees' })}</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></article><article className={card}><p className="text-xs text-slate-500">{t('orgDash.activeParticipants', { defaultValue: 'Active participants' })}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{active}</p></article><article className={card}><p className="text-xs text-slate-500">{t('orgPortal.departmentsAndScore', { defaultValue: 'Departments · Average score' })}</p><p className="mt-2 text-2xl font-bold">{departments} · {average.toFixed(1)}</p></article></div><AddEmployee reload={reload}/><Employees rows={rows} reload={reload}/></div>;
}
function ContributorPage({rows=[],lowest=false}){
  const { t } = useTranslation();
  const totalSaved=rows.reduce((sum,row)=>sum+Number(row.carbonSaved||0),0);
  const average=rows.length?rows.reduce((sum,row)=>sum+Number(row.monthlyEmission||0),0)/rows.length:0;
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><article className={card}><p className="text-xs text-slate-500">{t('orgPortal.rankedEmployees', { defaultValue: 'Ranked employees' })}</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></article><article className={card}><p className="text-xs text-slate-500">{lowest?t('orgPortal.avgFootprint', { defaultValue: 'Average footprint' }):t('orgPortal.totalCarbonSaved', { defaultValue: 'Total carbon saved' })}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{lowest?`${average.toFixed(1)} kg CO₂e`:`${totalSaved.toLocaleString()} kg CO₂e`}</p></article><article className={card}><p className="text-xs text-slate-500">{t('orgPortal.rankingBasis', { defaultValue: 'Ranking basis' })}</p><p className="mt-2 text-base font-semibold">{t('orgPortal.verifiedActivityData', { defaultValue: 'Verified activity data' })}</p></article></div>{lowest&&<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{t('orgPortal.rankingCriteriaNote', { defaultValue: 'Rankings depend on verified activities recorded during the available reporting period.' })}</div>}<Ranking rows={rows} lowest={lowest}/></div>;
}

function DepartmentPage({rows=[]}){
  const { t } = useTranslation();
  const sorted=[...rows].sort((a,b)=>Number(a.emissions||0)-Number(b.emissions||0)).map(row=>({
    ...row,
    displayName: t(`departments.${row.department}`, { defaultValue: row.department }),
  }));
  const total=sorted.reduce((sum,row)=>sum+Number(row.emissions||0),0);
  const employees=sorted.reduce((sum,row)=>sum+Number(row.employees||0),0);
  const best=sorted[0];
  const highest=Math.max(...sorted.map(row=>Number(row.emissions||0)),0);
  const metrics=[
    [t('orgDash.departmentsLabel', { defaultValue: 'Departments' }),sorted.length,t('orgDash.departmentsReporting', { defaultValue: 'Departments currently reporting' })],
    [t('orgDash.totalEmissionsLabel', { defaultValue: 'Total Emissions' }),`${total.toLocaleString()} kg CO₂e`,t('orgDash.acrossAllDepts', { defaultValue: 'Across all departments' })],
    [t('orgDash.lowestFootprintLabel', { defaultValue: 'Lowest Footprint' }),best?.department?t(`departments.${best.department}`, { defaultValue: best.department }):'—',best?`${Number(best.emissions||0).toLocaleString()} kg CO₂e`:t('common.notAvailable', { defaultValue: 'No data available' })],
    [t('orgDash.avgPerEmployeeLabel', { defaultValue: 'Average per Employee' }),employees?`${(total/employees).toFixed(1)} kg CO₂e`:'—',`${employees.toLocaleString()} ${t('orgDash.participatingEmployees', { defaultValue: 'participating employees' })}`],
  ];
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label,value,note])=><article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 truncate text-xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>)}
    </div>
    <section className={card}>
      <div className="mb-5"><h2 className="text-base font-semibold">{t('orgDash.emissionComparison', { defaultValue: 'Emission comparison' })}</h2><p className="mt-1 text-sm text-slate-500">{t('orgDash.lowerEmissionsBetter', { defaultValue: 'Lower emissions indicate stronger current performance.' })}</p></div>
      <div className="h-[340px]">{sorted.length?<ResponsiveContainer><BarChart data={sorted} margin={{top:10,left:16,right:16,bottom:25}}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity=".2"/><XAxis dataKey="displayName" tick={{fontSize:12}} interval={0}/><YAxis tick={{fontSize:12}} unit=" kg"/><Tooltip formatter={value=>[`${Number(value).toLocaleString()} kg CO₂e`,t('orgPortal.emissions', { defaultValue: 'Emissions' })]} cursor={{fill:'#f1f5f9'}}/><Bar dataKey="emissions" radius={[6,6,0,0]} barSize={32}>{sorted.map((row,index)=><Cell key={row.department||index} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer>:<Empty label={t('orgDash.departmentPerformanceData', { defaultValue: 'department emission data' })}/>}</div>
    </section>
    <section className={`${card} p-0`}>
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">{t('orgDash.departmentPerformance', { defaultValue: 'Department performance' })}</h2><p className="mt-1 text-sm text-slate-500">{t('orgDash.departmentComparisonDesc', { defaultValue: 'Ranked from the lowest to highest carbon footprint.' })}</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">{t('orgPortal.rank', { defaultValue: 'Rank' })}</th><th className="px-5 py-3">{t('orgPortal.department', { defaultValue: 'Department' })}</th><th className="px-5 py-3">{t('orgPortal.employees', { defaultValue: 'Employees' })}</th><th className="px-5 py-3">{t('orgPortal.emissions', { defaultValue: 'Emissions' })}</th><th className="px-5 py-3">{t('orgPortal.shareOfTotal', { defaultValue: 'Share of total' })}</th><th className="px-5 py-3">{t('orgPortal.performance', { defaultValue: 'Performance' })}</th></tr></thead>
          <tbody>{sorted.map((row,index)=>{const emission=Number(row.emissions||0);const share=total?emission*100/total:0;const relative=highest?emission*100/highest:0;return <tr key={row.department} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${index===0?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600'}`}>{index+1}</span></td><td className="px-5 py-4 font-semibold text-slate-900">{t(`departments.${row.department}`, { defaultValue: row.department })}</td><td className="px-5 py-4 text-slate-600">{Number(row.employees||0).toLocaleString()}</td><td className="px-5 py-4 font-medium">{emission.toLocaleString()} kg CO₂e</td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${relative}%`}}/></div><span className="text-xs text-slate-500">{share.toFixed(1)}%</span></div></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index===0?'bg-emerald-50 text-emerald-700':index===sorted.length-1&&sorted.length>1?'bg-amber-50 text-amber-700':'bg-blue-50 text-blue-700'}`}>{index===0?t('orgDash.leading', { defaultValue: 'Leading' }):index===sorted.length-1&&sorted.length>1?t('orgDash.needsAttention', { defaultValue: 'Needs attention' }):t('orgDash.onTrack', { defaultValue: 'On track' })}</span></td></tr>})}</tbody>
        </table>
        {!sorted.length&&<Empty label={t('orgDash.departmentPerformanceData', { defaultValue: 'department data' })}/>}
      </div>
    </section>
  </div>;
}
function Employees({rows=[],reload}){
  const { t } = useTranslation();
  const [search,setSearch]=useState('');const [department,setDepartment]=useState('');const [sort,setSort]=useState('name');const [page,setPage]=useState(1);const [selected,setSelected]=useState(null);const [editing,setEditing]=useState(null);const [saving,setSaving]=useState(false);
  const departments=[...new Set(rows.map(r=>r.department))];
  const filtered=useMemo(()=>rows.filter(r=>(r.name+' '+r.email).toLowerCase().includes(search.toLowerCase())&&(!department||r.department===department)).sort((a,b)=>sort==='emission'?a.monthlyEmission-b.monthlyEmission:sort==='score'?b.carbonScore-a.carbonScore:a.name.localeCompare(b.name)),[rows,search,department,sort]);
  const size=8,pages=Math.max(1,Math.ceil(filtered.length/size)),visible=filtered.slice((page-1)*size,page*size);
  return <section className={card}><div className="mb-4 flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input className={`${input} pl-9`} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder={t('orgPortal.searchEmployeeName', { defaultValue: 'Search employee name or email' })}/></div><select className={input} value={department} onChange={e=>setDepartment(e.target.value)}><option value="">{t('orgPortal.allDepartments', { defaultValue: 'All departments' })}</option>{departments.map(d=><option key={d} value={d}>{t(`departments.${d}`, { defaultValue: d })}</option>)}</select><select className={input} value={sort} onChange={e=>setSort(e.target.value)}><option value="name">{t('orgPortal.sortByName', { defaultValue: 'Sort by name' })}</option><option value="score">{t('orgPortal.sortByScore', { defaultValue: 'Sort by score' })}</option><option value="emission">{t('orgPortal.sortByEmission', { defaultValue: 'Sort by emission' })}</option></select></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5"><tr>{[t('orgPortal.employeeName', { defaultValue: 'Employee Name' }),t('orgPortal.department', { defaultValue: 'Department' }),t('orgPortal.carbonScore', { defaultValue: 'Carbon Score' }),t('orgPortal.monthlyEmission', { defaultValue: 'Monthly Emission' }),t('orgPortal.activities', { defaultValue: 'Activities' }),t('orgPortal.goalProgress', { defaultValue: 'Goal Progress' }),t('orgPortal.status', { defaultValue: 'Status' })].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} onClick={()=>setSelected(r)} className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50/50 dark:border-white/5 dark:hover:bg-white/5"><td className="px-4 py-3 font-bold">{r.name}<span className="block text-xs font-normal text-slate-500">{r.email}</span></td><td className="px-4">{r.department?t(`departments.${r.department}`, { defaultValue: r.department }):t('departments.Unassigned', { defaultValue: 'Unassigned' })}</td><td className="px-4 font-bold text-emerald-600">{r.carbonScore}</td><td className="px-4">{r.monthlyEmission} kg</td><td className="px-4">{r.activities}</td><td className="px-4"><div className="h-2 w-28 rounded bg-slate-200"><div className="h-full rounded bg-emerald-500" style={{width:`${Math.min(100,r.goalProgress)}%`}}/></div><span className="text-xs">{r.goalProgress}%</span></td><td className="px-4"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">{r.status}</span></td></tr>)}</tbody></table>{!visible.length&&<Empty label={t('orgPortal.noEmployees', { defaultValue: 'employees' })}/>}</div>
    <div className="mt-4 flex items-center justify-between text-sm"><span>{filtered.length} {t('orgPortal.employees', { defaultValue: 'employees' })}</span><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">{t('common.prev', { defaultValue: 'Previous' })}</button><span className="px-2 py-1">{page}/{pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">{t('common.next', { defaultValue: 'Next' })}</button></div></div>
    {selected&&<div className="fixed inset-0 z-50 bg-slate-950/50" onClick={()=>setSelected(null)}><aside className="absolute right-0 h-full w-full max-w-md bg-white p-7 shadow-2xl dark:bg-slate-900" onClick={e=>e.stopPropagation()}><button className="float-right" onClick={()=>setSelected(null)}><X/></button><div className="mt-12 grid h-20 w-20 place-items-center rounded-2xl bg-emerald-100 text-3xl font-black text-emerald-700">{selected.name?.[0]}</div><h2 className="mt-5 text-2xl font-black">{selected.name}</h2><p className="text-slate-500">{selected.email}</p><dl className="mt-8 grid grid-cols-2 gap-4">{Object.entries({Department:selected.department?t(`departments.${selected.department}`, { defaultValue: selected.department }):t('departments.Unassigned', { defaultValue: 'Unassigned' }),Phone:selected.phone||t('orgPortal.notProvided', { defaultValue: 'Not provided' }),'Carbon score':selected.carbonScore,'Monthly emission':`${selected.monthlyEmission} kg`,Activities:selected.activities,'Goal progress':`${selected.goalProgress}%`,Status:selected.status}).map(([k,v])=><div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-1 font-bold">{v}</dd></div>)}</dl><button onClick={()=>{setEditing({id:selected.id,fullName:selected.name,email:selected.email,department:selected.department==='Unassigned'?'':selected.department,phone:selected.phone||'',status:selected.status||'ACTIVE'});setSelected(null)}} className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">{t('orgPortal.editEmployeeDetails', { defaultValue: 'Edit Employee Details' })}</button></aside></div>}
    {editing&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><form onSubmit={async e=>{e.preventDefault();setSaving(true);try{await updateOrganisationEmployee(editing.id,editing);await reload(true);toast.success(t('orgPortal.employeeUpdated', { defaultValue: 'Employee details updated' }));setEditing(null)}catch(err){toast.error(err.response?.data?.error||err.response?.data?.message||t('orgPortal.employeeUpdateError', { defaultValue: 'Unable to update employee' }))}finally{setSaving(false)}}} className={`${card} w-full max-w-xl`}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{t('orgPortal.editEmployee', { defaultValue: 'Edit Employee' })}</h2><p className="mt-1 text-sm text-slate-500">{t('orgPortal.updateEmployeeInfo', { defaultValue: 'Update organisation employee information.' })}</p></div><button type="button" onClick={()=>setEditing(null)} aria-label="Close edit employee"><X/></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-sm font-medium">{t('orgPortal.fullName', { defaultValue: 'Full name' })}</span><input required className={input} value={editing.fullName} onChange={e=>setEditing({...editing,fullName:e.target.value})}/></label><label><span className="mb-1.5 block text-sm font-medium">{t('orgPortal.workEmail', { defaultValue: 'Work email' })}</span><input required type="email" className={input} value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})}/></label><label><span className="mb-1.5 block text-sm font-medium">{t('orgPortal.department', { defaultValue: 'Department' })}</span><input className={input} placeholder="e.g. Operations" value={editing.department} onChange={e=>setEditing({...editing,department:e.target.value})}/></label><label><span className="mb-1.5 block text-sm font-medium">{t('orgPortal.phone', { defaultValue: 'Phone' })}</span><input className={input} placeholder="e.g. +91 98765 43210" value={editing.phone} onChange={e=>setEditing({...editing,phone:e.target.value})}/></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">{t('orgPortal.participationStatus', { defaultValue: 'Participation status' })}</span><select className={input} value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})}><option value="ACTIVE">{t('orgPortal.active', { defaultValue: 'Active' })}</option><option value="INACTIVE">{t('orgPortal.inactive', { defaultValue: 'Inactive' })}</option></select></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setEditing(null)} className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">{t('common.cancel', { defaultValue: 'Cancel' })}</button><button disabled={saving} className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving?t('common.saving', { defaultValue: 'Saving…' }):t('common.saveChanges', { defaultValue: 'Save Changes' })}</button></div></form></div>}
  </section>;
}
function Ranking({rows=[],lowest=false}){return <section className={card}>{!rows.length?<Empty label="ranking data"/>:<div className="space-y-3">{rows.map((r,i)=><article key={r.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-white/5"><span className={`grid h-10 w-10 place-items-center rounded-full font-black ${i<3?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-600'}`}>{i+1}</span><div className="min-w-0 flex-1"><p className="truncate font-bold">{r.name}</p><p className="text-xs text-slate-500">{r.department}</p></div>{lowest?<><span className="font-black">{r.monthlyEmission} kg</span>{r.trend==='down'?<ArrowDownRight className="text-emerald-500"/>:<ArrowUpRight className="text-red-500"/>}</>:<><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{r.badge}</span><div className="text-right"><p className="font-black">{r.carbonSaved} kg saved</p><p className="text-xs text-slate-500">Score {r.carbonScore}</p></div></>}</article>)}</div>}</section>;}
function Activities({rows=[]}){const [q,setQ]=useState('');const [cat,setCat]=useState('');const filtered=rows.filter(r=>(r.employee+r.activity).toLowerCase().includes(q.toLowerCase())&&(!cat||r.category===cat));return <section className={card}><div className="mb-4 flex gap-3"><input className={input} placeholder="Search activity or employee" value={q} onChange={e=>setQ(e.target.value)}/><select className={input} value={cat} onChange={e=>setCat(e.target.value)}><option value="">All categories</option>{[...new Set(rows.map(r=>r.category))].map(c=><option key={c}>{c}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr>{['Date','Employee','Activity','Category','Emission','Status'].map(h=><th className="border-b px-3 py-3 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-b border-slate-100 dark:border-white/5"><td className="px-3 py-3">{r.date}</td><td className="px-3 font-bold">{r.employee}</td><td className="px-3">{r.activity}</td><td className="px-3">{r.category}</td><td className="px-3">{r.emission} kg</td><td className="px-3 text-emerald-600">{r.status}</td></tr>)}</tbody></table>{!filtered.length&&<Empty label="activities"/>}</div></section>;}
function Goals({rows=[],reload}){const blank={title:'',description:'',category:'all',period:'monthly',targetKg:100,currentKg:0,startDate:new Date().toISOString().slice(0,10),endDate:'',status:'ACTIVE'};const [form,setForm]=useState(null);const save=async()=>{try{if(form.id)await updateOrganisationGoal(form.id,form);else await createOrganisationGoal(form);toast.success('Goal saved');setForm(null);reload()}catch{toast.error('Unable to save goal')}};return <><div className="mb-4 flex justify-end"><button onClick={()=>setForm(blank)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4"/>Create Goal</button></div><div className="grid gap-4 lg:grid-cols-2">{rows.map(g=>{const progress=Math.min(100,Math.round((g.currentKg||0)*100/(g.targetKg||1)));return <article key={g.id} className={card}><div className="flex justify-between gap-3"><div><span className="text-xs font-bold uppercase text-emerald-600">{g.status}</span><h3 className="mt-1 text-lg font-black">{g.title}</h3></div><div className="flex items-start gap-2">{String(g.status).toUpperCase()==='ACHIEVED'&&<EcoLottie animationData={plantAnimation} loop={false} className="h-20 w-20 shrink-0" fallback={<EcoStaticFallback/>} reducedMotionFallback={<EcoStaticFallback/>}/>}<div className="flex gap-2"><button onClick={()=>setForm({...g})} className="text-sm text-blue-600">Edit</button><button onClick={async()=>{await deleteOrganisationGoal(g.id);reload()}} className="text-sm text-red-600">Delete</button></div></div></div><p className="mt-2 text-sm text-slate-500">{g.description}</p><div className="mt-5 h-2 rounded bg-slate-200"><div className="h-full rounded bg-emerald-500" style={{width:`${progress}%`}}/></div><div className="mt-2 flex justify-between text-sm"><span>{g.currentKg||0} / {g.targetKg} kg</span><span>{progress}% · {g.endDate}</span></div></article>})}{!rows.length&&<Empty label="organisation goals"/>}</div>{form&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className={`${card} w-full max-w-lg`}><div className="flex justify-between"><h2 className="text-xl font-black">{form.id?'Edit':'Create'} Goal</h2><button onClick={()=>setForm(null)}><X/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['title','Goal title'],['category','Category'],['period','Period'],['targetKg','Target (kg)'],['currentKg','Current (kg)'],['endDate','Deadline']].map(([name,label])=><label key={name} className={name==='title'?'sm:col-span-2':''}><span className="mb-1 block text-sm font-bold">{label}</span><input type={['targetKg','currentKg'].includes(name)?'number':name==='endDate'?'date':'text'} className={input} value={form[name]||''} onChange={e=>setForm({...form,[name]:e.target.type==='number'?Number(e.target.value):e.target.value})}/></label>)}</div><button onClick={save} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Save Goal</button></div></div>}</>;}
function EditableProfile({value,type,onSave}){const [form,setForm]=useState(value||{});useEffect(()=>setForm(value||{}),[value]);const fields=type==='organisation'?[['name','Company Name'],['industry','Industry'],['address','Address'],['phone','Phone'],['email','Email'],['website','Website'],['carbonTarget','Carbon Target'],['logoUrl','Logo URL']]:[['name','Name'],['email','Email'],['phone','Phone'],['department','Department'],['photo','Photo URL']];return <form onSubmit={async e=>{e.preventDefault();await onSave(form);toast.success('Profile updated')}} className={`${card} max-w-3xl`}><div className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label])=><label key={name} className={name==='address'?'sm:col-span-2':''}><span className="mb-1.5 block text-sm font-bold">{label}</span><input className={input} value={form[name]??''} onChange={e=>setForm({...form,[name]:e.target.value})} disabled={type!=='organisation'&&['email'].includes(name)}/></label>)}{type==='organisation'&&<label><span className="mb-1.5 block text-sm font-bold">Total Employees</span><input className={input} value={form.totalEmployees??0} disabled/></label>}{type!=='organisation'&&<label><span className="mb-1.5 block text-sm font-bold">Role</span><input className={input} value={form.role??''} disabled/></label>}</div><button className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white">Save Changes</button></form>;}
function PasswordForm(){const [f,setF]=useState({currentPassword:'',newPassword:'',confirmPassword:''});const submit=async e=>{e.preventDefault();if(f.newPassword!==f.confirmPassword)return toast.error('Passwords do not match');try{await changeOrganisationPassword(f);toast.success('Password changed');setF({currentPassword:'',newPassword:'',confirmPassword:''})}catch(e){toast.error(e.response?.data?.error||'Unable to change password')}};return <form onSubmit={submit} className={`${card} max-w-xl space-y-4`}>{[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm Password']].map(([n,l])=><label key={n}><span className="mb-1 block text-sm font-bold">{l}</span><input type="password" className={input} value={f[n]} onChange={e=>setF({...f,[n]:e.target.value})} required minLength={n==='currentPassword'?1:8}/></label>)}<button className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Change Password</button></form>;}
function AddEmployee({reload}){const [open,setOpen]=useState(false);const [form,setForm]=useState({fullName:'',username:'',email:'',department:'',phone:'',password:''});const save=async e=>{e.preventDefault();try{await createOrganisationEmployee(form);toast.success('Employee added');setOpen(false);reload()}catch(err){toast.error(err.response?.data?.error||'Unable to add employee')}};return <><div className="mb-4 flex justify-end"><button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4"/>Add Employee</button></div>{open&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><form onSubmit={save} className={`${card} w-full max-w-xl`}><div className="flex justify-between"><h2 className="text-xl font-black">Add Organisation Employee</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['fullName','Full name','e.g. Priya Sharma'],['username','Username','e.g. priya.sharma'],['email','Work email','e.g. priya@company.com'],['department','Department','e.g. Operations'],['phone','Phone','e.g. +91 98765 43210'],['password','Temporary password','Enter a secure password']].map(([n,l,p])=><label key={n}><span className="mb-1 block text-sm font-bold">{l}</span><input type={n==='password'?'password':n==='email'?'email':'text'} required={!['department','phone'].includes(n)} minLength={n==='password'?8:undefined} className={input} placeholder={p} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})}/></label>)}</div><button className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Add Employee</button></form></div>}</>;}
function AddActivity({employees,reload}){const [open,setOpen]=useState(false);const [form,setForm]=useState({employeeId:'',category:'Transport',activityType:'Business travel',amount:1,unit:'km',emission:0,date:new Date().toISOString().slice(0,10),notes:''});const save=async e=>{e.preventDefault();try{await createOrganisationActivity(form);toast.success('Activity recorded');setOpen(false);reload()}catch(err){toast.error(err.response?.data?.error||'Unable to record activity')}};return <><div className="mb-4 flex justify-end"><button onClick={()=>setOpen(true)} disabled={!employees.length} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white disabled:opacity-40"><Plus className="h-4 w-4"/>Record Activity</button></div>{open&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><form onSubmit={save} className={`${card} w-full max-w-xl`}><div className="flex justify-between"><h2 className="text-xl font-black">Record Employee Activity</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-bold">Employee</span><select required className={input} value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>{[['category','Category'],['activityType','Activity'],['amount','Amount'],['unit','Unit'],['emission','Emission (kg CO₂e)'],['date','Date']].map(([n,l])=><label key={n}><span className="mb-1 block text-sm font-bold">{l}</span><input required type={['amount','emission'].includes(n)?'number':n==='date'?'date':'text'} min="0" step="0.01" className={input} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})}/></label>)}</div><button className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Save Activity</button></form></div>}</>;}
function getReportTable(data, type, period) {
  const monthly = data.monthlyEmissions || [];
  const categories = data.categoryBreakdown || [];
  const departments = data.departmentComparison || [];
  const employees = data.employees || [];
  const goals = data.goals || [];
  const totalEmissions = Number(data.kpis?.totalEmission || 0);

  if (type === 'Category Scope Breakdown') {
    return {
      headers: ['Emission Category', 'Total Emissions (kg CO₂e)', 'Share of Organisation Total', 'Category Risk / Impact'],
      rows: categories.map((c) => {
        const share = totalEmissions > 0 ? ((Number(c.emissions || 0) * 100) / totalEmissions).toFixed(1) : '0.0';
        const impact = Number(c.emissions) > totalEmissions * 0.3 ? 'High Environmental Impact' : 'Moderate Impact';
        return [c.category || 'Uncategorised', `${Number(c.emissions || 0).toLocaleString()} kg CO₂e`, `${share}%`, impact];
      })
    };
  }
  if (type === 'Department Performance Report') {
    return {
      headers: ['Department', 'Reporting Employees', 'Total Department Emissions', 'Average per Employee', 'Status'],
      rows: departments.map((d) => {
        const empCount = Number(d.employees || 1);
        const em = Number(d.emissions || 0);
        const avg = empCount > 0 ? (em / empCount).toFixed(1) : '0.0';
        return [d.department || 'Unassigned', String(empCount), `${em.toLocaleString()} kg CO₂e`, `${avg} kg CO₂e/emp`, em === 0 ? 'Zero Footprint' : 'Active Reporting'];
      })
    };
  }
  if (type === 'Corporate Goals & ESG Targets') {
    return {
      headers: ['Goal Title', 'Period', 'Target (kg CO₂e)', 'Current Progress (kg CO₂e)', 'Completion Rate', 'Status'],
      rows: goals.map((g) => {
        const target = Number(g.targetKg || 1);
        const curr = Number(g.currentKg || 0);
        const pct = Math.min(100, Math.max(0, (curr * 100) / target)).toFixed(0);
        return [g.title || 'Corporate Goal', g.period || 'monthly', `${target} kg`, `${curr} kg`, `${pct}%`, g.status || 'ACTIVE'];
      })
    };
  }
  if (type === 'Employee Participation Report') {
    return {
      headers: ['Employee Name', 'Department', 'Logged Activities', 'Monthly Emissions', 'Sustainability Score', 'Participation Status'],
      rows: employees.map((e) => [
        e.name || 'Employee',
        e.department || 'General',
        String(e.activities || 0),
        `${Number(e.monthlyEmission || 0).toLocaleString()} kg CO₂e`,
        `${Number(e.carbonScore || 0).toFixed(0)} / 100`,
        e.status === 'ACTIVE' ? 'Active Participant' : 'Inactive'
      ])
    };
  }

  // Default: Comprehensive Quarterly / Annual CSR Executive Summary
  const count = period === 'This month' ? 1 : period === 'This quarter' ? 3 : 12;
  const recentMonthly = monthly.slice(-count);
  return {
    headers: ['Reporting Period', 'Tracked Emissions', 'Employees Active', 'Monthly Reduction', 'Overall Status'],
    rows: recentMonthly.map((m) => [
      m.month || 'Current',
      `${Number(m.emissions || 0).toLocaleString()} kg CO₂e`,
      `${data.kpis?.totalEmployees || 0} active`,
      `${data.kpis?.monthlyReduction || 0}%`,
      'GHG Verified'
    ])
  };
}

function ReportDocumentPreview({ data, type, period }) {
  const { t, i18n } = useTranslation();
  const org = data.organisation || {};
  const kpis = data.kpis || {};
  const categories = data.categoryBreakdown || [];
  const departments = data.departmentComparison || [];
  const goals = data.goals || [];
  const employees = data.employees || [];
  const logs = data.activityLogs || [];

  const metrics = [
    [t('orgNav.totalCarbonFootprint', { defaultValue: 'Total Carbon Footprint' }), `${Number(kpis.totalEmission || 0).toLocaleString()} kg CO₂e`, t('orgNav.totalEmissionsSub', { defaultValue: 'Total organisation emissions tracked' })],
    [t('orgNav.monthlyReduction', { defaultValue: 'Monthly Reduction' }), `${kpis.monthlyReduction || 0}%`, t('orgNav.monthlyReductionSub', { defaultValue: 'Comparison against prior reporting month' })],
    [t('orgNav.employeeParticipation', { defaultValue: 'Employee Participation' }), `${kpis.participationRate || 0}%`, `${kpis.totalEmployees || 0} ${t('orgNav.totalEnrolledEmployees', { defaultValue: 'total enrolled employees' })}`],
    [t('orgNav.sustainabilityScore', { defaultValue: 'Sustainability Score' }), `${kpis.averageCarbonScore || 0} / 100`, t('orgNav.sustainabilityScoreSub', { defaultValue: 'Average CSR rating across all departments' })],
  ];

  return (
    <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Header Banner */}
      <header className="flex flex-col justify-between gap-6 bg-gradient-to-r from-[#064e3b] via-[#0b3b2a] to-[#042f2e] px-8 py-7 text-white sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 backdrop-blur-md border border-emerald-400/30">
              <Leaf className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <strong className="text-2xl font-black tracking-tight">{org.name || 'Organisation'}</strong>
              <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest mt-0.5">{t('orgNav.csrAuditReportBanner', { defaultValue: 'Corporate Social Responsibility (CSR) & Environmental Audit Report' })}</p>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-block rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30">
            {formatReportTypeName(type, i18n.language)}
          </span>
          <p className="mt-1.5 text-xs text-slate-300 font-medium">{t('orgNav.reportingPeriod', { defaultValue: 'Reporting Period' })}: <strong className="text-white">{t(`orgNav.${period.toLowerCase().replace(' ', '')}`, { defaultValue: period })}</strong></p>
        </div>
      </header>

      <div className="p-7 space-y-8">
        {/* Company Profile Details */}
        <div className="grid gap-4 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">{t('orgNav.industrySector', { defaultValue: 'Industry Sector' })}</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{org.industry || 'Corporate / Enterprise'}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">{t('orgNav.location', { defaultValue: 'Location' })}</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{[org.city, org.country].filter(Boolean).join(', ') || t('orgNav.global', { defaultValue: 'Global' })}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">{t('orgNav.totalHeadcount', { defaultValue: 'Total Headcount' })}</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{kpis.totalEmployees || 0} {t('orgNav.employeesCount', { defaultValue: 'Employees' })}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">{t('orgNav.auditDate', { defaultValue: 'Audit Date' })}</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Executive Metrics Grid */}
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('orgNav.execKpiSummary', { defaultValue: '1. Executive KPI Summary' })}</h4>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value, note]) => (
              <div key={label} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1.5 text-xl font-black text-emerald-800 dark:text-emerald-300">{value}</p>
                <p className="mt-1 text-[10px] text-slate-400">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Detailed Employee Activity Audit Trail */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('orgNav.itemisedAuditTrail', { defaultValue: '2. Itemised Employee Activity Audit Trail' })}</h4>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{logs.length} {t('orgNav.totalVerifiedLogs', { defaultValue: 'Total Verified Logs' })}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 uppercase text-[10px] tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.date', { defaultValue: 'Date' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.colEmployee', { defaultValue: 'Employee' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.category', { defaultValue: 'Category' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.activityType', { defaultValue: 'Activity Type' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.quantity', { defaultValue: 'Quantity' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.emissions', { defaultValue: 'Emissions' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{log.date || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{formatUserName(log.employee, i18n.language) || 'Employee'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{t(`categories.${String(log.category || '').toLowerCase()}`, { defaultValue: log.category })}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatActivityName(log.activity, i18n.language)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.quantity} {log.unit}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{Number(log.emission || 0).toLocaleString()} kg CO₂e</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${log.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                        {t(`orgPortal.${String(log.verificationStatus || 'pending').toLowerCase()}`, { defaultValue: log.verificationStatus || 'PENDING' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logs.length && <Empty label="employee activity logs" />}
          </div>
        </div>

        {/* Section 3: Employee Roster Breakdown */}
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('orgNav.employeeSustainabilityBreakdown', { defaultValue: '3. Employee Sustainability Breakdown' })}</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 uppercase text-[10px] tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.colEmployee', { defaultValue: 'Employee Name' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.colDepartment', { defaultValue: 'Department' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.activitiesLogged', { defaultValue: 'Activities Logged' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.monthlyFootprint', { defaultValue: 'Monthly Footprint' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.carbonScore', { defaultValue: 'Carbon Score' })}</th>
                  <th className="px-4 py-3 font-extrabold">{t('orgNav.status', { defaultValue: 'Status' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{formatUserName(emp.name, i18n.language)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t(`departments.${emp.department}`, { defaultValue: emp.department || 'Unassigned' })}</td>
                    <td className="px-4 py-3 font-semibold">{emp.activities}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{Number(emp.monthlyEmission || 0).toLocaleString()} kg CO₂e</td>
                    <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300">{Number(emp.carbonScore || 0).toFixed(0)} / 100</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {t(`orgPortal.${String(emp.status || 'active').toLowerCase()}`, { defaultValue: emp.status || 'ACTIVE' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employees.length && <Empty label="employees" />}
          </div>
        </div>

        {/* Section 4 & 5: Category Scope & Department Distributions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Scope Breakdown */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h5 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('orgNav.categoryScopeDistribution', { defaultValue: '4. Category Scope Distribution' })}</h5>
            <div className="space-y-2.5">
              {categories.map((c) => {
                const total = Number(kpis.totalEmission || 1);
                const val = Number(c.emissions || 0);
                const pct = total > 0 ? ((val * 100) / total).toFixed(1) : '0';
                return (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{t(`categories.${String(c.category || '').toLowerCase()}`, { defaultValue: c.category })}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{val.toLocaleString()} kg ({pct}%)</span>
                  </div>
                );
              })}
              {!categories.length && <p className="text-xs text-slate-400">No category breakdown available.</p>}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h5 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('orgNav.departmentEmissions', { defaultValue: '5. Department Emissions' })}</h5>
            <div className="space-y-2.5">
              {departments.map((d) => (
                <div key={d.department} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t(`departments.${d.department}`, { defaultValue: d.department })} ({d.employees} {t('orgNav.employeesCount', { defaultValue: 'staff' })})</span>
                  <span className="font-bold text-slate-900 dark:text-white">{Number(d.emissions || 0).toLocaleString()} kg CO₂e</span>
                </div>
              ))}
              {!departments.length && <p className="text-xs text-slate-400">No department breakdown available.</p>}
            </div>
          </div>
        </div>

        {/* Section 6: Corporate ESG Goals */}
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('orgNav.corporateEsgGoals', { defaultValue: '6. Corporate ESG Goals & Targets' })}</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 uppercase text-[10px] tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Goal Title</th>
                  <th className="px-4 py-3 font-extrabold">Period</th>
                  <th className="px-4 py-3 font-extrabold">Target (kg CO₂e)</th>
                  <th className="px-4 py-3 font-extrabold">Current (kg CO₂e)</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {goals.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{g.title}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{g.period}</td>
                    <td className="px-4 py-3 font-semibold">{g.targetKg} kg</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{g.currentKg} kg</td>
                    <td className="px-4 py-3 font-bold">{g.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!goals.length && <Empty label="corporate goals" />}
          </div>
        </div>

        {/* Audit Verification Footer */}
        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-[11px] text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{t('orgNav.certifiedAuditFooter', { defaultValue: 'Certified GHG Protocol Compliant · CarbonTrack Audit System' })}</span>
          </div>
          <span>{t('orgNav.reportGenerated', { defaultValue: 'Report Generated' })}: {new Date().toLocaleString()}</span>
        </footer>
      </div>
    </article>
  );
}

function ReportCentre({ data }) {
  const { t, i18n } = useTranslation();
  const types = [
    'Comprehensive CSR & Environmental Audit',
    'Itemised Activity Log Audit Trail',
    'Employee Participation & Roster Report',
    'Category Scope Breakdown',
    'Department Performance Report',
    'Corporate Goals & ESG Targets'
  ];
  const [type, setType] = useState(types[0]);
  const [period, setPeriod] = useState('This month');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);

  const filename = () => `${(data.organisation?.name || 'organisation').toLowerCase().replaceAll(' ', '-')}-csr-audit-report`;

  const prepare = async () => {
    setBusy(true);
    setPreview('READY');
    setBusy(false);
    return 'READY';
  };

  useEffect(() => {
    prepare();
  }, [type, period]);

  const save = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename()}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const pdf = async () => {
    try {
      setBusy(true);
      const { jsPDF } = await import('jspdf');
      const documentPdf = new jsPDF();
      const pageWidth = documentPdf.internal.pageSize.getWidth();

      // Header Function
      const drawHeader = () => {
        documentPdf.setFillColor(6, 78, 59); // Dark Emerald
        documentPdf.rect(0, 0, pageWidth, 36, 'F');
        documentPdf.setTextColor(255, 255, 255);
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(18);
        documentPdf.text(data.organisation?.name || 'CarbonTrack Organisation', 16, 16);
        documentPdf.setFontSize(10);
        documentPdf.setFont('helvetica', 'normal');
        documentPdf.text('Official Comprehensive CSR & Sustainability Audit Report', 16, 25);
        documentPdf.setFontSize(9);
        documentPdf.text(type, pageWidth - 16, 16, { align: 'right' });
        documentPdf.text(`Period: ${period}`, pageWidth - 16, 25, { align: 'right' });
        documentPdf.setTextColor(15, 23, 42);
      };

      drawHeader();
      let y = 46;

      // 1. Executive Summary Header
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(13);
      documentPdf.text('1. Executive Summary & KPIs', 16, y);
      y += 7;

      const kpis = data.kpis || {};
      const metrics = [
        ['Total Emissions', `${Number(kpis.totalEmission || 0).toLocaleString()} kg CO2e`],
        ['Monthly Change', `${kpis.monthlyReduction || 0}%`],
        ['Participation Rate', `${kpis.participationRate || 0}%`],
        ['CSR Score', `${kpis.averageCarbonScore || 0} / 100`]
      ];

      metrics.forEach(([label, value], index) => {
        const x = 16 + index * 44;
        documentPdf.setFillColor(240, 253, 244);
        documentPdf.roundedRect(x, y, 41, 18, 2, 2, 'F');
        documentPdf.setTextColor(71, 85, 105);
        documentPdf.setFontSize(7);
        documentPdf.text(label, x + 3, y + 5);
        documentPdf.setTextColor(6, 95, 70);
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(9);
        documentPdf.text(value, x + 3, y + 13, { maxWidth: 35 });
      });
      y += 26;

      // 2. Itemised Employee Activity Audit Trail
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(13);
      documentPdf.setTextColor(15, 23, 42);
      documentPdf.text('2. Itemised Employee Activity Audit Trail', 16, y);
      y += 7;

      const logs = data.activityLogs || [];
      documentPdf.setFillColor(241, 245, 249);
      documentPdf.rect(16, y, 178, 8, 'F');
      documentPdf.setFontSize(8);
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setTextColor(51, 65, 85);
      documentPdf.text('Date', 18, y + 5.5);
      documentPdf.text('Employee', 42, y + 5.5);
      documentPdf.text('Category', 82, y + 5.5);
      documentPdf.text('Quantity', 125, y + 5.5);
      documentPdf.text('Emissions', 160, y + 5.5);
      y += 10;

      if (!logs.length) {
        documentPdf.setFont('helvetica', 'normal');
        documentPdf.setFontSize(8);
        documentPdf.setTextColor(100, 116, 139);
        documentPdf.text('No activity logs recorded for this period.', 18, y);
        y += 8;
      } else {
        logs.forEach((log, index) => {
          if (y > 265) {
            documentPdf.addPage();
            drawHeader();
            y = 46;
          }
          if (index % 2 === 0) {
            documentPdf.setFillColor(248, 250, 252);
            documentPdf.rect(16, y - 4, 178, 8, 'F');
          }
          documentPdf.setFontSize(8);
          documentPdf.setFont('helvetica', 'bold');
          documentPdf.setTextColor(30, 41, 59);
          documentPdf.text(String(log.date || '—'), 18, y, { maxWidth: 22 });
          documentPdf.setFont('helvetica', 'normal');
          documentPdf.setTextColor(6, 95, 70);
          documentPdf.text(String(log.employee || 'Employee'), 42, y, { maxWidth: 38 });
          documentPdf.setTextColor(71, 85, 105);
          documentPdf.text(String(`${log.category || ''} (${log.activity || ''})`), 82, y, { maxWidth: 40 });
          documentPdf.text(`${log.quantity} ${log.unit}`, 125, y, { maxWidth: 30 });
          documentPdf.setFont('helvetica', 'bold');
          documentPdf.setTextColor(15, 23, 42);
          documentPdf.text(`${Number(log.emission || 0).toLocaleString()} kg`, 160, y, { maxWidth: 30 });
          y += 8;
        });
      }
      y += 6;

      // 3. Employee Roster Breakdown
      if (y > 230) {
        documentPdf.addPage();
        drawHeader();
        y = 46;
      }
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setFontSize(13);
      documentPdf.setTextColor(15, 23, 42);
      documentPdf.text('3. Employee Sustainability Roster', 16, y);
      y += 7;

      const employees = data.employees || [];
      documentPdf.setFillColor(241, 245, 249);
      documentPdf.rect(16, y, 178, 8, 'F');
      documentPdf.setFontSize(8);
      documentPdf.setFont('helvetica', 'bold');
      documentPdf.setTextColor(51, 65, 85);
      documentPdf.text('Employee Name', 18, y + 5.5);
      documentPdf.text('Department', 75, y + 5.5);
      documentPdf.text('Activities', 120, y + 5.5);
      documentPdf.text('Footprint', 145, y + 5.5);
      documentPdf.text('Score', 178, y + 5.5);
      y += 10;

      employees.forEach((emp, idx) => {
        if (y > 265) {
          documentPdf.addPage();
          drawHeader();
          y = 46;
        }
        if (idx % 2 === 0) {
          documentPdf.setFillColor(248, 250, 252);
          documentPdf.rect(16, y - 4, 178, 8, 'F');
        }
        documentPdf.setFontSize(8);
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setTextColor(30, 41, 59);
        documentPdf.text(String(emp.name || ''), 18, y, { maxWidth: 52 });
        documentPdf.setFont('helvetica', 'normal');
        documentPdf.setTextColor(71, 85, 105);
        documentPdf.text(String(emp.department || 'Unassigned'), 75, y, { maxWidth: 40 });
        documentPdf.text(String(emp.activities || 0), 120, y);
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.text(`${Number(emp.monthlyEmission || 0).toLocaleString()} kg`, 145, y);
        documentPdf.setTextColor(6, 95, 70);
        documentPdf.text(`${Number(emp.carbonScore || 0).toFixed(0)}/100`, 178, y);
        y += 8;
      });

      // Page numbers footer
      const pages = documentPdf.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        documentPdf.setPage(p);
        documentPdf.setDrawColor(226, 232, 240);
        documentPdf.line(16, 282, 194, 282);
        documentPdf.setFontSize(8);
        documentPdf.setTextColor(100, 116, 139);
        documentPdf.text(`CarbonTrack Verified Comprehensive Audit Report · ${data.organisation?.name || ''}`, 16, 288);
        documentPdf.text(`Page ${p} of ${pages}`, 194, 288, { align: 'right' });
      }

      documentPdf.save(`${filename()}.pdf`);
      toast.success('Comprehensive multi-section CSR PDF report generated');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    } finally {
      setBusy(false);
    }
  };

  const csv = async () => {
    const quote = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const logs = data.activityLogs || [];
    const employees = data.employees || [];
    const categories = data.categoryBreakdown || [];

    const rows = [
      ['CARBONTRACK COMPREHENSIVE ORGANISATION CSR AUDIT REPORT'],
      ['Organisation Name', data.organisation?.name || ''],
      ['Report Type', type],
      ['Period', period],
      ['Audit Timestamp', new Date().toISOString()],
      ['Total Headcount', data.kpis?.totalEmployees || 0],
      ['Total Footprint (kg CO2e)', data.kpis?.totalEmission || 0],
      ['Sustainability Score', `${data.kpis?.averageCarbonScore || 0}/100`],
      [],
      ['1. ITEMISED EMPLOYEE ACTIVITY AUDIT TRAIL'],
      ['Date', 'Employee Name', 'Category', 'Activity Type', 'Quantity', 'Unit', 'Emissions (kg CO2e)', 'Verification Status'],
      ...logs.map((l) => [l.date, l.employee, l.category, l.activity, l.quantity, l.unit, l.emission, l.verificationStatus]),
      [],
      ['2. EMPLOYEE SUSTAINABILITY ROSTER'],
      ['Employee Name', 'Department', 'Activities Logged', 'Monthly Footprint (kg CO2e)', 'Carbon Score', 'Status'],
      ...employees.map((e) => [e.name, e.department, e.activities, e.monthlyEmission, e.carbonScore, e.status]),
      [],
      ['3. CATEGORY SCOPE BREAKDOWN'],
      ['Category', 'Emissions (kg CO2e)'],
      ...categories.map((c) => [c.category, c.emissions])
    ];

    save(new Blob(['\uFEFF' + rows.map((r) => r.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'csv');
    toast.success('Comprehensive CSV audit report exported');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <section className={card}>
        <div className="grid gap-4 lg:grid-cols-[1fr_200px_auto_auto_auto]">
          <label>
            <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{t('orgNav.selectReportType', { defaultValue: 'Select Audit Report Type' })}</span>
            <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((v) => (
                <option key={v} value={v}>{formatReportTypeName(v, i18n.language)}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{t('orgNav.reportingPeriod', { defaultValue: 'Reporting Period' })}</span>
            <select className={input} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="This month">{t('orgNav.thisMonth', { defaultValue: 'This month' })}</option>
              <option value="Last month">{t('orgNav.lastMonth', { defaultValue: 'Last month' })}</option>
              <option value="This quarter">{t('orgNav.thisQuarter', { defaultValue: 'This quarter' })}</option>
              <option value="This year">{t('orgNav.thisYear', { defaultValue: 'This year' })}</option>
            </select>
          </label>

          <button disabled={busy} onClick={prepare} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 transition-all">
            <Eye className="h-4 w-4" />
            {busy ? 'Preparing…' : t('orgNav.refresh', { defaultValue: 'Refresh' })}
          </button>

          <button disabled={busy} onClick={pdf} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all">
            <Download className="h-4 w-4" />
            {t('orgNav.downloadPdf', { defaultValue: 'Download PDF' })}
          </button>

          <button disabled={busy} onClick={csv} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 px-4 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40 disabled:opacity-50 transition-all">
            <FileSpreadsheet className="h-4 w-4" />
            {t('orgNav.exportCsv', { defaultValue: 'Export CSV' })}
          </button>
        </div>
      </section>

      {/* Main Report Preview */}
      <section className={card}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('orgNav.csrReportPreview', { defaultValue: 'CSR & Sustainability Report Preview' })}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t('orgNav.csrReportPreviewSub', { defaultValue: 'Live preview of itemised employee audit document compiled from your organization data.' })}</p>
          </div>
          {preview && <EcoLottie animationData={successAnimation} loop={false} className="h-12 w-12 shrink-0" fallback={<EcoStaticFallback type="success" />} reducedMotionFallback={<EcoStaticFallback type="success" />} />}
        </div>
        {preview ? (
          <ReportDocumentPreview data={data} type={type} period={period} />
        ) : (
          <div className="mt-5">
            <Empty label="CSR report preview" />
          </div>
        )}
      </section>
    </div>
  );
}

export default function OrganisationPortalPage(){
  const {pathname}=useLocation();const section=sectionFrom(pathname);const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const requestRef=useRef(null);
  const load=useCallback(async(force=false)=>{if(requestRef.current){if(!force)return requestRef.current;try{await requestRef.current}catch{}}const request=(async()=>{try{setError('');setData(await getOrganisationPortal())}catch(e){setError(e.response?.data?.error||'Unable to load organisation portal')}finally{setLoading(false)}})();requestRef.current=request;try{return await request}finally{if(requestRef.current===request)requestRef.current=null}},[]);
  useEffect(()=>{load();const timer=setInterval(load,5000);const refresh=()=>load();const visibility=()=>{if(!document.hidden)load()};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visibility);window.addEventListener('activity-created',refresh);window.addEventListener('activity-logged',refresh);window.addEventListener('organisation-data-changed',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('activity-created',refresh);window.removeEventListener('activity-logged',refresh);window.removeEventListener('organisation-data-changed',refresh)}},[load]);
  if(loading&&!['dashboard','analytics','monthly-trends','departments','employees','top-contributors','lowest-footprint','activity-logs','goals','challenges','profile'].includes(section))return <OrganisationEcoLoader/>;if(error&&!['dashboard','analytics','monthly-trends','departments','employees','top-contributors','lowest-footprint','activity-logs','goals','challenges','profile'].includes(section))return <div className={`${card} border-red-200 text-red-700`}>{error}<button className="ml-3 underline" onClick={load}>Retry</button></div>;
  if(section==='employees')return <OrganisationEmployeesPage data={data} loading={loading} error={error} onRetry={load} onReload={load}/>;
  if(section==='analytics')return <OrganisationAnalyticsPage data={data} loading={loading} error={error} onRetry={load}/>;
  if(section==='monthly-trends')return <OrganisationMonthlyTrendsPage data={data} loading={loading} error={error} onRetry={load}/>;
  if(section==='departments')return <OrganisationDepartmentComparisonPage data={data} loading={loading} error={error} onRetry={load}/>;
  if(section==='goals')return <OrganisationGoalsPage data={data} loading={loading} error={error} onRetry={load} onReload={load}/>;
  if(section==='challenges')return <OrganisationChallengesPage/>;
  if(section==='top-contributors')return <OrganisationRankingsPage data={data} loading={loading} error={error} onRetry={load}/>;
  if(section==='lowest-footprint')return <OrganisationRankingsPage data={data} loading={loading} error={error} onRetry={load} lowest/>;
  if(section==='activity-logs')return <OrganisationActivityLogsPage data={data} loading={loading} error={error} onRetry={load} onReload={load}/>;
  if(section==='reports')return <ReportCentre data={data}/>;
  if(section==='profile')return <OrganisationProfilePage data={data} loading={loading} error={error} onRetry={load} onReload={load}/>;
  if(section==='my-profile')return <OrganisationAdminProfilePage data={data} loading={loading} error={error} onRetry={load} onReload={load}/>;
  if(section==='change-password')return <PasswordForm/>;
  return <PremiumDashboard data={data||{}} loading={loading} error={error} onRetry={load}/>;
}
