import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Moon, Sun, Bell, Shield, Leaf, Building2, Lock } from 'lucide-react';
import { useAuth }  from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDensity } from '@/context/DensityContext';
import { Card, Button, Input, Badge, Alert, Tabs } from '@/components/ui';
import { getMyProfile, updateMyProfile, uploadAvatar, changeUserPassword } from '@/api';
import { getPublicOrganisations } from '@/api/organisationApi';
import toast from 'react-hot-toast';

function ProfileTab({ user }) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState('');
  const [organisationName, setOrganisationName] = useState(user?.organisationName ?? '');
  const [selectedOrgId, setSelectedOrgId] = useState(user?.organisationId ?? '');
  const [organisationsList, setOrganisationsList] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicOrganisations()
      .then((orgs) => {
        if (active && Array.isArray(orgs)) {
          setOrganisationsList(orgs);
        }
      })
      .catch((err) => console.error('Failed to fetch organisations:', err));

    getMyProfile()
      .then((profile) => {
        if (!active) return;
        setUsername(profile.username || '');
        setEmail(profile.email || '');
        setOrganisationName(profile.organisationName || user?.organisationName || '');
        if (profile.organisationId) {
          setSelectedOrgId(profile.organisationId);
        }
        setIsAnonymous(!!profile.isAnonymous);
        setAnonymousName(profile.anonymousName || '');
      })
      .catch((err) => {
        console.error('Failed to load profile details:', err);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setErrorMsg(null);
    try {
      const payload = {
        username,
        email,
        isAnonymous,
        anonymousName,
        organisationId: selectedOrgId ? Number(selectedOrgId) : -1
      };
      const updated = await updateMyProfile(payload);
      updateUser({ username: updated.username, organisationName: updated.organisationName });
      if (updated.organisationName) {
        setOrganisationName(updated.organisationName);
      } else if (selectedOrgId === '' || selectedOrgId === '-1') {
        setOrganisationName('');
      }
      setSaved(true);
      toast.success(t('settingsPage.profileUpdated', { defaultValue: 'Profile updated successfully.' }));
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(file);
      updateUser({ avatarUrl: updated.avatarUrl });
      toast.success('Profile picture updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form className="space-y-8 flex flex-col items-center py-6" onSubmit={handleSave}>
      {saved && (
        <Alert variant="success" dismissible onClose={() => setSaved(false)}>
          {t('settingsPage.profileUpdated', { defaultValue: 'Profile updated successfully.' })}
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}
      <div className="flex flex-col items-center gap-3">
        <div 
          className="relative group cursor-pointer rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          {user?.avatarUrl ? (
            <img 
              src={`http://localhost:8080${user.avatarUrl}`} 
              alt="Profile" 
              className={`h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-green-50 dark:ring-green-900/30 ${uploadingAvatar ? 'opacity-50' : ''}`}
            />
          ) : (
            <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white text-4xl font-bold shadow-md ring-4 ring-green-50 dark:ring-green-900/30 ${uploadingAvatar ? 'opacity-50' : ''}`}>
              {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
            <span className="text-white text-xs font-medium">{t('settingsPage.changePhoto', { defaultValue: 'Change' })}</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{user?.username}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="green" size="sm" dot>{user?.role ?? 'USER'}</Badge>
            {organisationName && (
              <Badge variant="slate" size="sm" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {organisationName}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Input 
          label={t('settingsPage.username', { defaultValue: 'Username' })} 	
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          leftIcon={<User className="h-4 w-4" />} 
          required
        />
        <Input 
          label={t('settingsPage.email', { defaultValue: 'Email' })} 	
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="your@email.com" 
          required
        />
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t('settingsPage.organization', { defaultValue: 'Organization' })}
          </label>
          <select 
            value={selectedOrgId ?? ''} 
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="-1">-- None (Independent User) --</option>
            {organisationsList.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Select your organization to join its private portal and leaderboard.
          </p>
        </div>


        {/* Milestone 3: Leaderboard Anonymity & Custom Alias */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4.5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>🛡️ {t('settingsPage.leaderboardAnonymity', { defaultValue: 'Leaderboard Anonymous Mode' })}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('settingsPage.anonymousDesc', { defaultValue: 'Hide your real name from other users on public leaderboards' })}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAnonymous}
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isAnonymous ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isAnonymous && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <Input
                label={t('settingsPage.anonymousName', { defaultValue: 'Anonymous Display Name / Alias' })}
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="e.g. EcoWarrior, SilentSaver, TreePioneer (optional)"
                hint={
                  anonymousName.trim()
                    ? `Public display name: "🕶️ ${anonymousName.trim()}"`
                    : 'If empty, "Anonymous User #ID" will be shown.'
                }
              />
            </div>
          )}
        </div>
      </div>
      <Button 
        type="submit"
        variant="primary" 
        size="md"
        className="w-full max-w-md mt-2"
        isLoading={loading} 
        disabled={!username || !email}
      >
        {t('settingsPage.saveChanges', { defaultValue: 'Save Changes' })}
      </Button>
    </form>
  );
}

function AppearanceTab() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { density, setDensity } = useDensity();

  const densityOptions = [
    { id: 'compact',     label: t('settingsPage.compact', { defaultValue: 'Compact' }) },
    { id: 'default',     label: t('settingsPage.default', { defaultValue: 'Default' }) },
    { id: 'comfortable', label: t('settingsPage.comfortable', { defaultValue: 'Comfortable' }) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('settingsPage.theme', { defaultValue: 'Theme' })}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'light', label: t('settingsPage.light', { defaultValue: 'Light' }), icon: Sun  },
            { id: 'dark',  label: t('settingsPage.dark', { defaultValue: 'Dark' }),  icon: Moon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => theme !== id && toggleTheme()}
              className={[
                'flex items-center gap-3 rounded-xl border-2 p-4 text-sm font-medium transition-all cursor-pointer',
                theme === id
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600',
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
              {label}
              {theme === id && <Badge variant="green" size="xs" className="ml-auto">{t('settingsPage.active', { defaultValue: 'Active' })}</Badge>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('settingsPage.density', { defaultValue: 'Density' })}</p>
        <p className="text-xs text-slate-500 mb-3">{t('settingsPage.densitySubtitle', { defaultValue: 'Control spacing of UI elements' })}</p>
        <div className="flex gap-2">
          {densityOptions.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDensity(id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                density === id
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState({
    weeklyDigest: true,
    goalAlerts: true,
    badgeEarned: true,
    newTips: false,
  });
  return (
    <div className="space-y-4">
      {Object.entries({
        weeklyDigest: { 
          label: t('settingsPage.notifications.weeklyDigest', { defaultValue: 'Weekly digest' }),      
          desc: t('settingsPage.notifications.weeklyDigestDesc', { defaultValue: 'Summary of your carbon activity' }) 
        },
        goalAlerts:   { 
          label: t('settingsPage.notifications.goalAlerts', { defaultValue: 'Goal alerts' }),         
          desc: t('settingsPage.notifications.goalAlertsDesc', { defaultValue: 'Notify when approaching budget' })  
        },
        badgeEarned:  { 
          label: t('settingsPage.notifications.badgeEarned', { defaultValue: 'Badge notifications' }), 
          desc: t('settingsPage.notifications.badgeEarnedDesc', { defaultValue: 'When you earn a new achievement' }) 
        },
        newTips:      { 
          label: t('settingsPage.notifications.newTips', { defaultValue: 'Eco tips' }),            
          desc: t('settingsPage.notifications.newTipsDesc', { defaultValue: 'Sustainability tips & tricks' })    
        },
      }).map(([key, { label, desc }]) => (
        <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[key]}
            onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${prefs[key] ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess]   = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setErrorMsg(t('settingsPage.minPassword', { defaultValue: 'New password must be at least 6 characters long.' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('settingsPage.passwordMismatch', { defaultValue: 'New password and confirmation do not match.' }));
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword({ currentPassword, newPassword });
      setSuccess(true);
      toast.success(t('settingsPage.passwordUpdated', { defaultValue: 'Password updated successfully!' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to change password.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6 max-w-md mx-auto py-2" onSubmit={handlePasswordChange}>
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
          {t('settingsPage.passwordUpdated', { defaultValue: 'Your password has been updated successfully.' })}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <div className="space-y-4">
        <Input 
          label={t('settingsPage.currentPassword', { defaultValue: 'Current Password' })} 
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t('settingsPage.currentPasswordPlaceholder', { defaultValue: 'Enter current password' })} 
          required
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input 
          label={t('settingsPage.newPassword', { defaultValue: 'New Password' })} 
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('settingsPage.newPasswordPlaceholder', { defaultValue: 'Enter new password (min. 6 chars)' })} 
          required
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input 
          label={t('settingsPage.confirmNewPassword', { defaultValue: 'Confirm New Password' })} 
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('settingsPage.confirmNewPasswordPlaceholder', { defaultValue: 'Confirm new password' })} 
          required
          leftIcon={<Lock className="h-4 w-4" />}
        />
      </div>

      <Button 
        type="submit"
        variant="primary" 
        size="md"
        className="w-full"
        isLoading={loading} 
        disabled={!currentPassword || !newPassword || !confirmPassword}
      >
        {t('settingsPage.updatePassword', { defaultValue: 'Update Password' })}
      </Button>

      <div className="card border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4 mt-6">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">{t('settingsPage.dangerZone', { defaultValue: 'Danger Zone' })}</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-3">
          {t('settingsPage.dangerZoneDesc', { defaultValue: 'Permanently delete your account and all associated data.' })}
        </p>
        <Button type="button" variant="danger" size="sm">{t('settingsPage.deleteAccount', { defaultValue: 'Delete Account' })}</Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  const settingTabs = [
    { id: 'profile',       label: t('settingsPage.tabProfile', { defaultValue: 'Profile' }),       icon: User   },
    { id: 'appearance',    label: t('settingsPage.tabAppearance', { defaultValue: 'Appearance' }),     icon: Sun    },
    { id: 'notifications', label: t('settingsPage.tabNotifications', { defaultValue: 'Notifications' }),  icon: Bell   },
    { id: 'security',      label: t('settingsPage.tabSecurity', { defaultValue: 'Security' }),       icon: Shield },
  ];

  const PANELS = {
    profile:       <ProfileTab user={user} />,
    appearance:    <AppearanceTab />,
    notifications: <NotificationsTab />,
    security:      <SecurityTab />,
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
          <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('settingsPage.title', { defaultValue: 'Settings' })}</h2>
          <p className="text-sm text-slate-500">{t('settingsPage.subtitle', { defaultValue: 'Manage your account and preferences' })}</p>
        </div>
      </div>

      <Card>
        <Tabs tabs={settingTabs} variant="line" activeTab={tab} onChange={setTab} />
        <div className="mt-5">{PANELS[tab]}</div>
      </Card>
    </div>
  );
}

