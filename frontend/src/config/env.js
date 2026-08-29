/**
 * env.js
 * ─────────────────────────────────────────────────────────────
 * Environment configuration utilities.
 * Centralizes all environment variable access with type safety.
 * 
 * Usage:
 *   import { env } from '@/config/env'
 *   console.log(env.api.baseURL)  // 'http://localhost:8080'
 */

/**
 * Get environment variable with optional default value.
 * Logs warning if variable is missing and no default provided.
 * 
 * @param {string} key - Environment variable name (e.g., 'VITE_API_BASE_URL')
 * @param {any} defaultValue - Default value if env var not found
 * @returns {string} Value or default
 */
const getEnv = (key, defaultValue = null) => {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    console.warn(`[ENV] Missing environment variable: ${key}`);
    return null;
  }
  
  return value;
};

/**
 * Parse boolean environment variable.
 * Handles string 'true'/'false' values correctly.
 * 
 * @param {string} key - Environment variable name
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean}
 */
const getBooleanEnv = (key, defaultValue = false) => {
  const value = getEnv(key);
  if (value === null) return defaultValue;
  return value === 'true' || value === '1' || value === true;
};

/**
 * Parse numeric environment variable.
 * 
 * @param {string} key - Environment variable name
 * @param {number} defaultValue - Default value if not found
 * @returns {number}
 */
const getNumberEnv = (key, defaultValue = 0) => {
  const value = getEnv(key);
  if (value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Centralized environment configuration object.
 * This is the single source of truth for environment values.
 */
export const env = {
  // ── Environment Info ──────────────────────────────────────────────
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  environment: getEnv('VITE_ENV', 'development'),
  appName: getEnv('VITE_APP_NAME', 'CarbonTrack'),
  appVersion: getEnv('VITE_APP_VERSION', '0.1.0'),

  // ── API Configuration ─────────────────────────────────────────────
  api: {
    // Base URL without /api suffix (Axios instance adds it)
    baseURL: getEnv('VITE_API_BASE_URL', 'https://carbontrack-backend-d060.onrender.com'),
    timeout: getNumberEnv('VITE_API_TIMEOUT', 15000),
    debugAPI: getBooleanEnv('VITE_DEBUG_API', false),
  },


  // ── Authentication ────────────────────────────────────────────────
  auth: {
    tokenKey: getEnv('VITE_TOKEN_KEY', 'carbontrack_token'),
    rememberMeDays: getNumberEnv('VITE_REMEMBER_ME_DAYS', 30),
    autoLogoutOn401: getBooleanEnv('VITE_AUTO_LOGOUT_ON_401', true),
  },

  // ── Feature Flags ────────────────────────────────────────────────
  features: {
    useMockData: getBooleanEnv('VITE_USE_MOCK_DATA', false),
    leaderboard: getBooleanEnv('VITE_ENABLE_LEADERBOARD', true),
    organisationDashboard: getBooleanEnv('VITE_ENABLE_ORGANISATION_DASHBOARD', true),
    csrReports: getBooleanEnv('VITE_ENABLE_CSR_REPORTS', true),
    recommendations: getBooleanEnv('VITE_ENABLE_RECOMMENDATIONS', true),
  },

  // ── API Behavior ─────────────────────────────────────────────────
  retries: {
    maxRetries: getNumberEnv('VITE_MAX_RETRIES', 3),
    retryDelay: getNumberEnv('VITE_RETRY_DELAY', 1000),
  },

  // ── Pagination ───────────────────────────────────────────────────
  pagination: {
    defaultPageSize: getNumberEnv('VITE_DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getNumberEnv('VITE_MAX_PAGE_SIZE', 100),
  },

  // ── Cache ────────────────────────────────────────────────────────
  cache: {
    duration: getNumberEnv('VITE_CACHE_DURATION', 3600),
  },

  // ── Error Handling ───────────────────────────────────────────────
  errors: {
    verbose: getBooleanEnv('VITE_VERBOSE_ERRORS', true),
  },
};

/**
 * Validate environment configuration.
 * Runs on module load to catch missing critical variables early.
 * 
 * @throws {Error} If critical environment variables are missing
 */
export function validateEnv() {
  const critical = [
    'VITE_API_BASE_URL',
    'VITE_TOKEN_KEY',
  ];

  const missing = critical.filter(key => !getEnv(key));
  
  if (missing.length > 0) {
    console.error('[ENV] Missing critical environment variables:', missing);
    // Don't throw in development to allow mock data
    if (import.meta.env.PROD) {
      throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
    }
  }

  // Log current configuration in development
  if (import.meta.env.DEV) {
    console.log('[ENV] Configuration loaded:', {
      environment: env.environment,
      apiBase: env.api.baseURL,
      useMockData: env.features.useMockData,
    });
  }
}

// Validate on module load
validateEnv();

export default env;
