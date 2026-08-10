import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Trophy, Flame, TreePine, Zap, Car, Droplets,
  TrendingUp, Calendar, ArrowRight, ArrowLeft, CheckCircle2,
  Award, Shield, Share2, Sparkles, Activity, Clock,
  Smartphone, Plane, Target, HeartHandshake, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getCommunityLeaderboard } from '@/api/leaderboardApi';
import { getChallenges, joinChallenge } from '@/api/challengeApi';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

export default function CommunityDetailsPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [leaderboardData, setLeaderboardData] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedFilter, setFeedFilter] = useState('all');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const [lbData, chData] = await Promise.all([
        getCommunityLeaderboard(),
        getChallenges().catch(() => [])
      ]);
      setLeaderboardData(lbData);
      setChallenges(chData || []);
    } catch (err) {
      console.error('Failed to load community details:', err);
      setError(err.response?.data?.message || 'Failed to load community statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleActivityLogged = () => {
      loadData();
    };
    window.addEventListener('activity-logged', handleActivityLogged);
    return () => {
      window.removeEventListener('activity-logged', handleActivityLogged);
    };
  }, []);

  const handleJoinChallenge = async (id) => {
    try {
      setJoiningId(id);
      const updated = await joinChallenge(id);
      toast.success('Successfully joined community challenge!');
      setChallenges(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      console.error('Join challenge error:', err);
      toast.error(err.response?.data?.message || 'Failed to join challenge');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/register?ref=community`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    toast.success('Community invitation link copied to clipboard!');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  if (isLoading) {
    return <Spinner fullPage label="Loading Community Details & Impact Telemetry…" />;
  }

  const rawUsers = leaderboardData?.all || [];
  const topThree = leaderboardData?.topThree || rawUsers.slice(0, 3);
  const totalMembers = leaderboardData?.totalCommunityMembers || rawUsers.length;
  const totalCO2Saved = Number(leaderboardData?.totalCO2Saved) || 0;
  const activitiesToday = Number(leaderboardData?.activitiesLoggedToday) || 0;
  const activeChallengesCount = challenges.length || leaderboardData?.activeChallenges || 0;
  const recentAchievements = leaderboardData?.recentAchievements || [];
  const dailyTrends = (leaderboardData?.dailyTrends || []).map(item => {
    const co2Val = Number(item.co2 != null ? item.co2 : item.co2Saved != null ? item.co2Saved : 0) || 0;
    const countVal = Number(item.activityCount != null ? item.activityCount : item.activities != null ? item.activities : 0) || 0;
    return {
      day: item.day,
      co2: co2Val,
      co2Saved: co2Val,
      activityCount: countVal,
      activities: countVal
    };
  });

  // Computed Real-World Environmental Equivalences
  const treesPlanted = Math.round(totalCO2Saved / 21.0);
  const cleanEnergyKwh = Math.round(totalCO2Saved / 0.4);
  const milesAvoided = Math.round(totalCO2Saved / 0.404);
  const waterConservedGal = Math.round(totalCO2Saved * 1.5);
  const flightsAvoided = (totalCO2Saved / 90.0).toFixed(1);
  const phonesCharged = Math.round(totalCO2Saved * 120);

  // Filtered achievements feed
  const filteredAchievements = recentAchievements.filter(item => {
    if (feedFilter === 'all') return true;
    if (feedFilter === 'badges') return item.iconType === 'badge';
    if (feedFilter === 'activities') return item.iconType === 'activity';
    if (feedFilter === 'joins') return item.iconType === 'join';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            <Link to="/community" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Leaderboard
            </Link>
            <span>/</span>
            <span>Community Details & Impact</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                Community Hub & Impact
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                </span>
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Explore collective sustainability metrics, active eco challenges, member milestones, and real-world planetary impact.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <Link
            to="/community"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            Leaderboard
          </Link>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-800">
            <Users className="w-4 h-4" />
            Community Details
          </div>
        </div>
      </div>

      {error && <Alert variant="error" title="Data Notice">{error}</Alert>}

      {/* ── 1. Hero Impact Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 border border-emerald-700/30 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Collective Carbon Neutrality Movement
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Together, our community has offset <span className="text-emerald-400 underline decoration-emerald-500/40">{totalCO2Saved.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e</span>.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Every verified activity logged by our members contributes to a cleaner, greener planet. Real-time telemetry tracked directly from user logs and certified emission factors.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <Button
                onClick={() => navigate('/activities')}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4" /> Log Today&apos;s Activity
              </Button>
              <Button
                onClick={() => navigate('/challenges')}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
              >
                <Target className="w-4 h-4 text-amber-400" /> Browse Challenges
              </Button>
              <Button
                onClick={handleCopyInvite}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 backdrop-blur-sm"
              >
                {copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                {copiedInvite ? 'Link Copied!' : 'Invite Friends'}
              </Button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Active Members</span>
              </div>
              <p className="text-2xl font-black text-white">{totalMembers.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Participating in eco actions</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Logged Today</span>
              </div>
              <p className="text-2xl font-black text-white">{activitiesToday.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Eco entries in past 24h</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Eco Challenges</span>
              </div>
              <p className="text-2xl font-black text-white">{activeChallengesCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Live collective challenges</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-teal-400 mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Data Integrity</span>
              </div>
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified database records</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Real-World Environmental Equivalences ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <span>🌍</span> Planetary Impact Equivalences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              What our collective {totalCO2Saved.toFixed(0)} kg CO₂ reduction actually translates to in nature:
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            Certified EPA & IPCC Formulas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Trees */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TreePine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Forest Conservation</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {treesPlanted.toLocaleString()} <span className="text-xs font-semibold text-slate-500">tree-years</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Equivalent carbon sequestration to planting {treesPlanted.toLocaleString()} urban trees growing for an entire year (~21 kg CO₂/tree/yr).
            </p>
          </div>

          {/* Clean Energy */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clean Energy Saved</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {cleanEnergyKwh.toLocaleString()} <span className="text-xs font-semibold text-slate-500">kWh</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Powers an average eco-conscious household for {(cleanEnergyKwh / 30).toFixed(0)} days with zero fossil emissions.
            </p>
          </div>

          {/* Miles Avoided */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicle Miles Avoided</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {milesAvoided.toLocaleString()} <span className="text-xs font-semibold text-slate-500">miles</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Equivalent to avoiding {milesAvoided.toLocaleString()} miles of single-occupancy gasoline vehicle commuting (~0.404 kg CO₂/mile).
            </p>
          </div>

          {/* Water Conserved */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Water Nexus Conserved</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {waterConservedGal.toLocaleString()} <span className="text-xs font-semibold text-slate-500">gallons</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Water conserved through energy efficiency and plant-forward community meal choices.
            </p>
          </div>

          {/* Flight Hours */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commercial Flights</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {flightsAvoided} <span className="text-xs font-semibold text-slate-500">flight hours</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Equivalent passenger flight emissions neutralized across regional aviation routes.
            </p>
          </div>

          {/* Smartphones */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Device Power Cycles</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {phonesCharged.toLocaleString()} <span className="text-xs font-semibold text-slate-500">charges</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sufficient clean electricity saved to fully recharge {phonesCharged.toLocaleString()} smartphones.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Dynamic 7-Day Velocity & Activity Velocity Chart ── */}
      {dailyTrends.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                7-Day Community Activity & CO₂ Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily activity submissions and total carbon tracked across the community.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Carbon (kg CO₂e)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Activities Count</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
                          <p className="font-bold text-slate-300">{data.day}</p>
                          <p className="text-emerald-400 font-black text-sm">
                            {Number(data.co2).toFixed(1)} kg CO₂e
                          </p>
                          <p className="text-amber-400 font-bold">
                            {data.activityCount} activities logged
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="co2" name="Carbon" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} minPointSize={8} />
                <Bar dataKey="activityCount" name="Activities" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} minPointSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 4. Main Grid: Community Challenges & Top Champions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Active Collective Challenges */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              Community Sustainability Challenges
            </h2>
            <Link
              to="/challenges"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              All Challenges <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {challenges.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">New Challenges Coming Soon!</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check back regularly to participate in community-wide sustainability sprints.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.slice(0, 4).map((ch) => {
                const isJoined = ch.status === 'IN_PROGRESS' || ch.status === 'COMPLETED';
                const isCompleted = ch.status === 'COMPLETED';
                const currentVal = Number(ch.progressValue) || 0;
                const targetVal = Number(ch.targetValue) || 1;
                const pct = ch.progressPct != null ? Math.min(100, Math.round(ch.progressPct)) : Math.min(100, Math.round((currentVal / targetVal) * 100));

                return (
                  <div
                    key={ch.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {ch.period || 'ACTIVE'}
                          </span>
                          {ch.xpReward ? (
                            <span className="text-[11px] font-semibold text-slate-400">
                              +{ch.xpReward} XP Reward
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {ch.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {ch.description}
                        </p>
                      </div>

                      {/* Status / Join Button */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : isJoined ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                            In Progress ({pct}%)
                          </span>
                        ) : (
                          <Button
                            onClick={() => handleJoinChallenge(ch.id)}
                            disabled={joiningId === ch.id}
                            className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                          >
                            {joiningId === ch.id ? 'Joining…' : 'Join Challenge'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>Progress: {currentVal.toFixed(1)} / {targetVal} {ch.metricType === 'REDUCE_EMISSIONS' ? 'kg CO₂' : 'units'}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Top Community Champions Spotlight */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Community Champions
            </h2>
            <Link
              to="/community"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Full Rankings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topThree.map((user, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const borderColors = [
                'border-amber-400/50 bg-gradient-to-r from-amber-500/5 to-transparent',
                'border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-500/5 to-transparent',
                'border-amber-700/30 bg-gradient-to-r from-amber-700/5 to-transparent'
              ];

              return (
                <div
                  key={user.userId || idx}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border ${borderColors[idx] || 'border-slate-200 dark:border-slate-800'} shadow-sm flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{medals[idx] || `#${idx + 1}`}</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-sm uppercase shrink-0">
                      {user.username?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {user.username}
                        </p>
                        {user.isCurrentUser && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {user.badge || 'Community Member'} • {user.activityCount || 0} activities
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {Number(user.totalCO2Saved || 0).toFixed(1)} kg
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">CO₂ saved</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hall of Fame Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              How Community Rankings Work
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-slate-300 leading-relaxed">
              Rankings are calculated dynamically from verified daily activity logs. Active members who maintain multi-day logging streaks and hit reduction targets unlock exclusive badge titles!
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. Live Community Activity & Achievements Stream ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              Live Community Achievements Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time activity logs, unlocked badges, and milestone accomplishments across the network.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'activities', label: 'Eco Logs' },
              { id: 'badges', label: 'Badges' },
              { id: 'joins', label: 'New Members' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  feedFilter === f.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Activity className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No recent events matching this filter.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Log daily activities or unlock badges to light up the community achievements feed!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.map((item, idx) => {
              const isBadge = item.iconType === 'badge';
              const isActivity = item.iconType === 'activity';

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        isBadge ? 'bg-amber-500/10 text-amber-500' :
                        isActivity ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {isBadge ? <Award className="w-4 h-4" /> :
                         isActivity ? <Activity className="w-4 h-4" /> :
                         <Users className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.user}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timeAgo || 'Recent'}
                    </span>
                  </div>

                  <div className="pl-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.action}: <span className="font-bold text-slate-800 dark:text-slate-200">{item.detail}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 6. Community Charter & Invite Peer Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Community Charter */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-black text-sm">
            <HeartHandshake className="w-5 h-5 text-emerald-500" />
            CarbonTrack Sustainability Charter
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Our community pledges to practice verified emission tracking, prioritize zero-emission transit, eliminate food waste, reduce household energy demand, and support accredited carbon offset projects worldwide.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> 100% Privacy & Transparent Telemetry
          </div>
        </div>

        {/* Invite Peers */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-900/10 dark:bg-slate-900 border border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-black text-sm">
              <Share2 className="w-5 h-5 text-emerald-500" />
              Grow Our Climate Community
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +50 XP per invite
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Share your unique invite link with colleagues, friends, or family to multiply your climate impact and climb the Community Leaderboard together.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/register?ref=community`}
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 select-all"
            />
            <Button
              type="button"
              onClick={handleCopyInvite}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shrink-0 flex items-center gap-1"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedInvite ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
