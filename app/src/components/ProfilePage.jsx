import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Download, Trash2, Moon, Sun, Bell, BellOff, Shield, Mail, Calendar, BarChart3, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/themeContext.jsx';
import CustomAlert from './CustomAlert.jsx';
import MilestoneCelebrationModal from './MilestoneCelebrationModal.jsx';
import CustomGoals from './CustomGoals.jsx';
import { getNewMilestones, markMilestonesAsSeen, getSeenMilestones } from '../utils/milestones.js';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const ProfilePage = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    aiAnalysisEnabled: true,
    analyticsEnabled: true,
    dataRetention: 'forever', // '1year', '2years', 'forever'
    autoBackup: true,
    weeklyReminders: false
  });
  const [showAccountUpdate, setShowAccountUpdate] = useState(false);
  const [accountUpdateData, setAccountUpdateData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const [newMilestones, setNewMilestones] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const uid = user?.uid || user?.id;
        if (!uid) return;
        
        const res = await fetch(`${API_BASE}/api/profile/privacy?uid=${uid}`);
        if (res.ok) {
          const settings = await res.json();
          setPrivacySettings(settings);
        }
      } catch (error) {
        console.error('Error loading privacy settings from backend:', error);
        const storedSettings = localStorage.getItem('privacySettings');
        if (storedSettings) {
          try {
            const parsedSettings = JSON.parse(storedSettings);
            setPrivacySettings(parsedSettings);
          } catch (localError) {
            console.error('Error parsing localStorage privacy settings:', localError);
          }
        }
      }
    };

    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchStats = async () => {
      if (isInitialLoad) {
        setStatsLoading(true);
      } else {
        setStatsRefreshing(true);
      }
      try {
        const uid = user.uid || user.id;
        const res = await fetch(`${API_BASE}/api/profile/stats?uid=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);

          const seenMilestones = getSeenMilestones();
          const newAchievements = getNewMilestones(data, seenMilestones);
          if (newAchievements.length > 0) {
            setNewMilestones(newAchievements);
            setShowMilestoneModal(true);
          }
        } else {
          console.error('Failed to fetch stats, status:', res.status);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        if (isInitialLoad) {
          setStatsLoading(false);
          isInitialLoad = false;
        }
        setStatsRefreshing(false);
      }
    };
    
    if (user) {
      fetchStats();
      const interval = setInterval(fetchStats, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const refreshStats = async () => {
    if (!user) return;
    setStatsRefreshing(true);
    try {
      const uid = user.uid || user.id;
      const res = await fetch(`${API_BASE}/api/profile/stats?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);

        const seenMilestones = getSeenMilestones();
        const newAchievements = getNewMilestones(data, seenMilestones);
        if (newAchievements.length > 0) {
          setNewMilestones(newAchievements);
          setShowMilestoneModal(true);
        }
      } else {
        console.error('Failed to refresh stats, status:', res.status);
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setStatsRefreshing(false);
    }
  };

  const refreshGoalStats = async () => {
    // Refresh main stats when goals are updated to reflect any changes
    if (!user) return;

    try {
      await refreshStats();
      console.log('Goal stats refreshed and main stats updated');
    } catch (error) {
      console.error('Failed to refresh goal stats:', error);
    }
  };

  const handleLogout = () => {
    setShowSignoutConfirm(true);
  };

  const confirmLogout = async () => {
    setSigningOut(true);
    try {
      localStorage.removeItem('privacySettings');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('journalDraft');
      await logout();
      setShowSignoutConfirm(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleExport = async () => {
    try {
      const uid = user?.uid || user?.id;
      const res = await fetch(`${API_BASE}/api/profile/export?uid=${uid}&format=pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whisprlog-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setUpdatingAccount(true);

    try {
      if (accountUpdateData.newPassword && accountUpdateData.newPassword !== accountUpdateData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (accountUpdateData.newPassword && accountUpdateData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const nameChanged = accountUpdateData.name.trim() !== (user?.name || '');

      if (nameChanged) {
        const uid = user?.uid || user?.id;
        if (!uid) {
          throw new Error('User ID not available');
        }

        const profileRes = await fetch(`${API_BASE}/api/profile/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            name: accountUpdateData.name.trim()
          }),
        });

        if (!profileRes.ok) {
          const errorData = await profileRes.json();
          throw new Error(errorData.error || 'Failed to update profile');
        }
      }

      setAccountUpdateData({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowAccountUpdate(false);

      setAlert({
        type: 'success',
        message: 'Account updated successfully!',
        onClose: () => setAlert(null)
      });

      window.location.reload();

    } catch (error) {
      console.error('Account update error:', error);
      setAlert({
        type: 'error',
        message: error.message,
        onClose: () => setAlert(null)
      });
    } finally {
      setUpdatingAccount(false);
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const saveWeeklyRemindersSetting = async (newValue) => {
    try {
      const uid = user?.uid || user?.id;
      if (!uid) return;

      const res = await fetch(`${API_BASE}/api/profile/privacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, ...privacySettings, weeklyReminders: newValue }),
      });

      if (res.ok) {
        const updatedSettings = { ...privacySettings, weeklyReminders: newValue };
        localStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
      } else {
        console.error('Failed to save weekly reminders setting to backend');
        const updatedSettings = { ...privacySettings, weeklyReminders: newValue };
        localStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
      }
    } catch (error) {
      console.error('Error saving weekly reminders setting:', error);
      const updatedSettings = { ...privacySettings, weeklyReminders: newValue };
      localStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setAccountUpdateData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={alert.onClose}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-slate-100 mb-2 text-center">Profile & Settings</h1>
          <p className="text-slate-600 dark:text-slate-300 text-center">Manage your account and customize your experience</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-600 shadow-lg relative">
            {statsRefreshing && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700/60 px-3 py-1 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 dark:border-slate-300 border-t-transparent"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-200">Updating...</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">Account Information</h2>
              <button
                onClick={() => setShowAccountUpdate(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 dark:from-rose-500 dark:to-pink-600 dark:hover:from-rose-600 dark:hover:to-pink-700 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 border border-rose-400 dark:border-rose-500 shadow-sm"
              >
                Update Account
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-rose-200 dark:from-slate-600 dark:to-slate-500 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">{user?.name || 'Anonymous User'}</h3>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center space-x-2 mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email || 'No email provided'}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatJoinDate(stats?.join_date || user?.created_at)}</span>
                  </p>
                  {user?.isAnonymous && (
                    <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm rounded-full mt-2">
                      Anonymous Session
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                <div className="text-center p-4 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {statsLoading ? (
                      <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-12 rounded mx-auto"></div>
                    ) : (
                      stats?.total_entries || 0
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Total Entries</div>
                </div>
                <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {statsLoading ? (
                      <div className="animate-pulse bg-rose-200 dark:bg-rose-800 h-8 w-12 rounded mx-auto"></div>
                    ) : (
                      stats?.avg_mood?.toFixed(1) || '0.0'
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Avg Mood</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {statsLoading ? (
                      <div className="animate-pulse bg-blue-200 dark:bg-blue-800 h-8 w-12 rounded mx-auto"></div>
                    ) : (
                      stats?.streak_days || 0
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {statsLoading ? (
                      <div className="animate-pulse bg-purple-200 dark:bg-purple-800 h-8 w-12 rounded mx-auto"></div>
                    ) : (
                      stats?.multiple_entry_days || 0
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Multi-Entry Days</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isDark ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Switch to a darker, easier-on-eyes theme</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {notifications ? <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <BellOff className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Gentle Reminders</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Receive occasional prompts to journal</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    notifications ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Weekly Check-ins</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Get a gentle weekly reflection prompt</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !privacySettings.weeklyReminders;
                    setPrivacySettings(prev => ({ ...prev, weeklyReminders: newValue }));
                    await saveWeeklyRemindersSetting(newValue);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    privacySettings.weeklyReminders ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacySettings.weeklyReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Enhanced Analytics</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Enable deeper emotional pattern analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    analyticsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">Data Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Export Your Data</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Download all your entries, insights, and analytics</p>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-blue-600 dark:border-blue-700 shadow-sm"
                >
                  Export PDF Report
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Privacy Settings</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Review and manage your privacy preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrivacySettings(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Delete Account</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Permanently remove all your data (irreversible)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">Goals & Achievements</h2>
            <div className="space-y-6">
              <div className="mb-6">
                <CustomGoals 
                  onGoalUpdate={() => {
                    if (user) {
                      refreshGoalStats();
                    }
                  }}
                />
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                  <h3 className="font-medium text-slate-800 dark:text-rose-200 mb-2">Current Goal</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Write {stats?.total_entries >= 30 ? '50' : '30'} journal entries this month
                  </p>
                  <div className="mt-2 bg-rose-200 dark:bg-rose-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats?.total_entries || 0) / (stats?.total_entries >= 30 ? 50 : 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {stats?.total_entries || 0} / {stats?.total_entries >= 30 ? 50 : 30} entries
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-slate-800 dark:text-blue-200 mb-2">Streak Champion</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Keep your daily streak alive!
                    </p>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      🔥 {stats?.streak_days || 0} {stats?.streak_days === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="font-medium text-slate-800 dark:text-purple-200 mb-2">Mood Master</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Maintain a positive outlook
                    </p>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                      ⭐ {(stats?.avg_mood || 0).toFixed(1)}/10
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-rose-50 dark:from-yellow-900/20 dark:to-rose-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-slate-800 dark:text-yellow-200 mb-2">Emotional Awareness</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {stats?.most_common_emotion 
                      ? `Your journaling reveals a strong connection with ${stats.most_common_emotion} emotions. This awareness is a beautiful step toward emotional intelligence and self-understanding.`
                      : 'Through consistent journaling, you\'re building valuable emotional awareness. Each entry helps you understand your feelings and patterns better.'
                    }
                  </p>
                  {stats?.most_common_emotion && (
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800 dark:to-pink-800 text-rose-800 dark:text-rose-200 text-xs rounded-full mt-2 capitalize">
                      Most common: {stats.most_common_emotion}
                    </span>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                    💡 Tip: Try exploring different emotions in your next entries to deepen your emotional vocabulary.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-medium text-slate-800 dark:text-purple-200 mb-2">Popular Tags</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                    Your most frequently used tags for organizing entries.
                  </p>
                  {statsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-purple-200 dark:bg-purple-700 h-6 w-16 rounded-full"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stats?.most_common_tags?.map(({ tag, count }) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
                          title={`${count} entries`}
                        >
                          #{tag} ({count})
                        </span>
                      )) || <span className="text-sm text-slate-500 dark:text-slate-400">No tags yet</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">Account Actions</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Sign Out</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">End your current session safely</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-slate-100 to-rose-100 dark:from-slate-700 dark:to-rose-900/30 hover:from-slate-200 hover:to-rose-200 dark:hover:from-slate-600 dark:hover:to-rose-800/40 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 border border-rose-200 dark:border-rose-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Delete Account</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone. All your journal entries, insights, and data will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white rounded-lg font-medium transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <LogOut className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Sign Out</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to sign out? Your session will end and you'll need to log in again to access your journal.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSignoutConfirm(false)}
                disabled={signingOut}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={signingOut}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {signingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacySettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">Privacy Settings</h3>
              <button
                onClick={() => setShowPrivacySettings(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">AI Emotional Analysis</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Allow AI to analyze your journal entries for emotional insights</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, aiAnalysisEnabled: !prev.aiAnalysisEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      privacySettings.aiAnalysisEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.aiAnalysisEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When disabled, entries will be saved without AI analysis. You can re-enable this anytime.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Usage Analytics</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Help improve WhisprLog by sharing anonymous usage data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, analyticsEnabled: !prev.analyticsEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      privacySettings.analyticsEnabled ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Anonymous data about app usage patterns helps us improve the experience for everyone.
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Data Retention</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Choose how long to keep your journal entries</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'forever', label: 'Keep forever', desc: 'Never automatically delete entries' },
                    { value: '2years', label: '2 years', desc: 'Automatically delete entries older than 2 years' },
                    { value: '1year', label: '1 year', desc: 'Automatically delete entries older than 1 year' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="retention"
                        value={option.value}
                        checked={privacySettings.dataRetention === option.value}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataRetention: e.target.value }))}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-medium text-slate-800 dark:text-green-200">{option.label}</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Automatic Backups</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Automatically backup your data to secure cloud storage</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                      privacySettings.autoBackup ? 'bg-yellow-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Encrypted backups ensure your data is safe and can be restored if needed.
                </p>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center space-x-3 mb-3">
                  <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Data Export</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Export your data as a detailed PDF report</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDF reports include all your entries, insights, and analytics in a beautifully formatted document.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowPrivacySettings(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const uid = user?.uid || user?.id;
                    if (!uid) {
                      console.error('No user ID available');
                      return;
                    }

                    const res = await fetch(`${API_BASE}/api/profile/privacy`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid, ...privacySettings }),
                    });

                    if (res.ok) {
                      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
                      setShowPrivacySettings(false);
                    } else {
                      console.error('Failed to save privacy settings to backend');
                      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
                      setShowPrivacySettings(false);
                    }
                  } catch (error) {
                    console.error('Error saving privacy settings:', error);
                    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
                    setShowPrivacySettings(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">Update Account</h3>
              <button
                onClick={() => setShowAccountUpdate(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAccountUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={accountUpdateData.name}
                  onChange={(e) => setAccountUpdateData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountUpdateData.email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Change Password (Optional)</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={accountUpdateData.currentPassword}
                      onChange={(e) => setAccountUpdateData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={accountUpdateData.newPassword}
                      onChange={(e) => setAccountUpdateData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={accountUpdateData.confirmPassword}
                      onChange={(e) => setAccountUpdateData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAccountUpdate(false)}
                  disabled={updatingAccount}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAccount}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {updatingAccount ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {showMilestoneModal && newMilestones.length > 0 && (
        <MilestoneCelebrationModal
          milestones={newMilestones}
          onClose={() => setShowMilestoneModal(false)}
          onMarkAsSeen={(milestoneIds) => {
            markMilestonesAsSeen(milestoneIds);
            setNewMilestones([]);
          }}
        />
      )}
    </div>
    </div>
  );
};

export default ProfilePage;