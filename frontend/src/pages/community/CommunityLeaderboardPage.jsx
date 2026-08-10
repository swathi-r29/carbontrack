import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Users, ArrowRight } from 'lucide-react';
import { getCommunityLeaderboard, searchLeaderboard } from '@/api/leaderboardApi';
import { useAuth } from '@/context/AuthContext';
import LeaderboardHeroStats from '@/components/leaderboard/LeaderboardHeroStats.jsx';
import LeaderboardToolbar from '@/components/leaderboard/LeaderboardToolbar.jsx';
import LeaderboardTopThree from '@/components/leaderboard/LeaderboardTopThree.jsx';
import LeaderboardPositionCard from '@/components/leaderboard/LeaderboardPositionCard.jsx';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable.jsx';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import BadgeSidebar from '@/components/badges/BadgeSidebar';

export default function CommunityLeaderboardPage() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter States
  const [selectedScope, setSelectedScope] = useState('global');
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedBadge, setSelectedBadge] = useState('all');
  const [selectedSort, setSelectedSort] = useState('co2');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarUser, setSidebarUser] = useState(null);

  const loadLeaderboardData = async () => {
    try {
      setError(null);
      const data = await getCommunityLeaderboard();
      setLeaderboardData(data);
      window.dispatchEvent(new CustomEvent('leaderboard-viewed'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenSidebar = (e) => {
      setSidebarUser(e.detail);
      setSidebarOpen(true);
    };
    window.addEventListener('open-badge-sidebar', handleOpenSidebar);
    window.addEventListener('activity-logged', loadLeaderboardData);

    return () => {
      window.removeEventListener('open-badge-sidebar', handleOpenSidebar);
      window.removeEventListener('activity-logged', loadLeaderboardData);
    };
  }, []);

  // Load initial leaderboard data dynamically from API
  useEffect(() => {
    setIsLoading(true);
    loadLeaderboardData();
  }, []);

  // Handle explicit API search submit
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      loadLeaderboardData();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const data = await searchLeaderboard(searchQuery);
      setLeaderboardData(data);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    loadLeaderboardData();
  };

  const rawUsers = leaderboardData?.all || [];

  // Instant Live Filtering & Sorting
  const filteredUsers = useMemo(() => {
    let list = [...rawUsers];

    // 0. Scope Filter (Global vs Organization)
    if (selectedScope === 'organization' && currentUser?.organisationId) {
      list = list.filter(u => u.organisationId === currentUser.organisationId);
    }

    // 1. Text Search Filter (Username, Email, Rank, Badge)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(u => {
        const uName = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const badge = (u.badge || '').toLowerCase();
        const rank = String(u.rank || '');
        return uName.includes(q) || email.includes(q) || badge.includes(q) || rank === q;
      });
    }

    // 2. Badge Filter
    if (selectedBadge !== 'all') {
      const bQuery = selectedBadge.replace('_', ' ').toLowerCase();
      list = list.filter(u => {
        const uBadge = (u.badge || '').toLowerCase();
        const uBadges = (u.badges || []).map(b => b.toLowerCase());
        return uBadge.includes(bQuery) || uBadges.some(b => b.includes(bQuery));
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (selectedSort === 'activities') {
        return (b.activityCount || 0) - (a.activityCount || 0);
      }
      if (selectedSort === 'streak') {
        return (b.streak || 0) - (a.streak || 0);
      }
      // Default: CO2 saved / emitted ascending
      return (a.totalCO2Saved || 0) - (b.totalCO2Saved || 0);
    });

    // Re-index ranks to represent local ranking within the filtered scope (e.g. organization ranking)
    return list.map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));
  }, [rawUsers, searchQuery, selectedBadge, selectedSort, selectedScope, currentUser]);

  if (isLoading) {
    return <Spinner fullPage label="Loading Community Leaderboard…" />;
  }

  const topThree = searchQuery.trim() || selectedScope === 'organization' || selectedBadge !== 'all'
    ? filteredUsers.slice(0, 3)
    : (leaderboardData?.topThree || rawUsers.slice(0, 3));
  const activeUserCard = leaderboardData?.currentUser || (rawUsers.length > 0 ? rawUsers[0] : null);

  // Dynamic API metrics
  const totalMembers = leaderboardData?.totalCommunityMembers || rawUsers.length;
  const totalCO2Saved = leaderboardData?.totalCO2Saved || 0;
  const activitiesToday = leaderboardData?.activitiesLoggedToday || 0;
  const activeChallenges = leaderboardData?.activeChallenges || 0;
  const recentAchievements = leaderboardData?.recentAchievements || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Title & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {t('community.title')}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('community.subtitle')}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-800">
            <Trophy className="w-4 h-4 text-amber-500" />
            Leaderboard
          </div>
          <Link
            to="/community/details"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white transition-colors"
          >
            <Users className="w-4 h-4" />
            Community Details
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="error" title="Error">{error}</Alert>}

      {/* 1. Hero KPI Summary Cards (Dynamic Backend API Metrics) */}
      <LeaderboardHeroStats 
        totalMembers={totalMembers}
        totalCO2Saved={totalCO2Saved}
        activitiesToday={activitiesToday}
        activeChallenges={activeChallenges}
      />

      {/* 2. Instant Search & Toolbar Filters */}
      <LeaderboardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        selectedScope={selectedScope}
        onScopeChange={setSelectedScope}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        selectedBadge={selectedBadge}
        onBadgeChange={setSelectedBadge}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />

      {/* 3. Top Performers Podium Cards */}
      {!searchQuery.trim() && topThree.length > 0 && (
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-1.5">
            <span>🏆</span> {t('community.topPerformers')}
          </h2>
          <LeaderboardTopThree users={topThree} />
        </div>
      )}

      {/* 4. Your Position Card (Dynamic Progress & Distance with + Log Activity) */}
      {activeUserCard && (
        <div>
          <LeaderboardPositionCard 
            user={activeUserCard}
            allUsers={rawUsers}
            onLogActivity={() => navigate('/activities')} 
          />
        </div>
      )}

      {/* 5. Main Content Grid: Leaderboard Table & Sidebar Widgets */}
      <div className="grid grid-cols-1 gap-3 items-start">
        
        {/* Main Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 py-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
              {searchQuery.trim() ? `🔍 ${t('community.searchResults')} (${filteredUsers.length})` : `📊 ${t('community.rankings')}`}
            </h2>
            <div className="flex items-center gap-3">
              <Link
                to="/community/details"
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                View Community Details <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('community.showing')} {filteredUsers.length} {t('community.of')} {rawUsers.length} {t('community.members')}
              </span>
            </div>
          </div>

          <LeaderboardTable
            users={filteredUsers}
            currentUserId={currentUser?.userId}
            isSearching={isSearching}
          />
        </div>
      </div>

      {/* Badge Detail Sidebar */}
      <BadgeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={sidebarUser}
      />
    </div>
  );
}
