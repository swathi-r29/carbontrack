/**
 * AppRouter.jsx
 * ─────────────────────────────────────────────────────────────
 * Full application route tree with lazy loading.
 *
 *   /                       → redirect → /dashboard
 *   /login                  → LoginPage          (public only)
 *   /register               → RegisterPage       (public only)
 *   /forgot-password        → ForgotPasswordPage (public only)
 *   /dashboard              → DashboardPage      (auth required)
 *   /activities             → ActivitiesPage     (auth required)
 *   /goals                  → GoalsPage          (auth required)
 *   /reports                → ReportsPage        (auth required)
 *   /settings               → SettingsPage       (auth required)
 *   /admin                  → AdminPage          (ADMIN role only)
 *   *                       → NotFound (404)
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import NotFound from '@/components/errors/NotFound';
import LandingPage from '@/pages/landing/LandingPage';

/* ── Lazy page bundles ───────────────────────────────────────── */
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ActivitiesPage = lazy(() => import('@/pages/activities/ActivitiesPage'));
const GoalsPage = lazy(() => import('@/pages/goals/GoalsPage'));
const ChallengesPage = lazy(() => import('@/pages/challenges/ChallengesPage'));
const BadgesPage = lazy(() => import('@/pages/badges/BadgesPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const RecommendationsPage = lazy(() => import('@/pages/recommendations/RecommendationsPage'));
const CommunityLeaderboardPage = lazy(() => import('@/pages/community/CommunityLeaderboardPage'));
const CommunityDetailsPage = lazy(() => import('@/pages/community/CommunityDetailsPage'));
const OrganisationLayout = lazy(() => import('@/components/organisation/OrganisationLayout'));
const OrganisationPortalPage = lazy(() => import('@/pages/organisation/OrganisationPortalPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const RoutePlannerPage = lazy(() => import('@/pages/routes/RoutePlannerPage'));
const OffsetHubPage = lazy(() => import('@/pages/offsets/OffsetHubPage'));
const EnergySimulatorPage = lazy(() => import('@/pages/energy/EnergySimulatorPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const HowItWorksPage = lazy(() => import('@/pages/how-it-works/HowItWorksPage'));

function PageFallback() {
  return <Spinner fullPage label="Loading page…" />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Root & Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />

        <Route path="/admin-login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
        <Route path="/admin/login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />

        {/* ── Public-only auth routes ───────────────────────── */}
        <Route
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Protected app routes ──────────────────────────── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/community" element={<CommunityLeaderboardPage />} />
          <Route path="/community/details" element={<CommunityDetailsPage />} />
          <Route path="/community-details" element={<Navigate to="/community/details" replace />} />
          <Route path="/route-planner" element={<RoutePlannerPage />} />
          <Route path="/offsets" element={<OffsetHubPage />} />
          <Route path="/energy-simulator" element={<EnergySimulatorPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/organisation"
          element={<ProtectedRoute requiredRole="ORG_ADMIN"><OrganisationLayout /></ProtectedRoute>}
        >
          <Route index element={<OrganisationPortalPage />} />
          <Route path="dashboard" element={<OrganisationPortalPage />} />
          <Route path="analytics" element={<OrganisationPortalPage />} />
          <Route path="employees" element={<OrganisationPortalPage />} />
          <Route path="monthly-trends" element={<OrganisationPortalPage />} />
          <Route path="departments" element={<OrganisationPortalPage />} />
          <Route path="goals" element={<OrganisationPortalPage />} />
          <Route path="challenges" element={<OrganisationPortalPage />} />
          <Route path="top-contributors" element={<OrganisationPortalPage />} />
          <Route path="lowest-footprint" element={<OrganisationPortalPage />} />
          <Route path="reports" element={<OrganisationPortalPage />} />
          <Route path="activity-logs" element={<OrganisationPortalPage />} />
          <Route path="profile" element={<OrganisationPortalPage />} />
          <Route path="my-profile" element={<OrganisationPortalPage />} />
          <Route path="change-password" element={<Navigate to="/organisation/my-profile" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
