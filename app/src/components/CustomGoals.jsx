import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Target, Plus, Edit, Trash2, CheckCircle, Circle, TrendingUp, Calendar, X, Save } from 'lucide-react';
import { getUserGoals, addUserGoal, deleteUserGoal, GOAL_TYPES, GOAL_TEMPLATES, FREQUENCY_OPTIONS, getGoalProgress, syncGoalsWithEntries, calculateCurrentStreak } from '../utils/customGoals';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const CustomGoals = ({ onGoalUpdate }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: GOAL_TYPES.FREQUENCY,
    target: 1,
    frequency: 'weekly',
    icon: '🎯'
  });

  const loadUserGoals = useCallback(async () => {
    try {
      setLoading(true);
      const userGoals = getUserGoals(user.uid || user.id);
      setGoals(userGoals);

      // Also try to sync with backend
      try {
        const res = await fetch(`${API_BASE}/api/goals?uid=${user.uid || user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.goals && data.goals.length > 0) {
            // Recalculate streak counts for goals loaded from backend
            const goalsWithUpdatedStreaks = data.goals.map(goal => ({
              ...goal,
              streakCount: calculateCurrentStreak(goal.completedDates || [])
            }));
            setGoals(goalsWithUpdatedStreaks);
          }
        }
      } catch {
        // backend not available — fall back to local goals
      }
      try {
        const uid = user.uid || user.id;
        const entriesRes = await fetch(`${API_BASE}/api/trends?uid=${uid}`);
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          if (Array.isArray(entries) && entries.length > 0) {
            await syncGoalsWithEntries(uid, entries);
            setGoals(getUserGoals(uid));
          }
        }
      } catch {
        // non-critical: goal sync failed; continue with local data
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserGoals();
    }
  }, [user, loadUserGoals]);

  const handleCreateGoal = async () => {
    if (!formData.title.trim()) return;

    try {
      const newGoal = await addUserGoal(user.uid || user.id, formData);

      try {
        const res = await fetch(`${API_BASE}/api/goals/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid || user.id,
            goalData: formData
          })
        });

        if (res.ok) {
          const data = await res.json();
          setGoals(prev => [...prev, data.goal]);
        } else {
          setGoals(prev => [...prev, newGoal]);
        }
      } catch {
        setGoals(prev => [...prev, newGoal]);
      }

      setFormData({
        title: '',
        description: '',
        type: GOAL_TYPES.FREQUENCY,
        target: 1,
        frequency: 'weekly',
        icon: '🎯'
      });
      setShowCreateForm(false);

      if (onGoalUpdate) onGoalUpdate();
      try {
        const uid = user.uid || user.id;
        const entriesRes = await fetch(`${API_BASE}/api/trends?uid=${uid}`);
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          if (Array.isArray(entries) && entries.length > 0) {
            await syncGoalsWithEntries(uid, entries);
            setGoals(getUserGoals(uid));
          }
        }
      } catch {
        // non-critical: initializing goal progress failed
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteUserGoal(user.uid || user.id, goalId);

      try {
        await fetch(`${API_BASE}/api/goals/${goalId}?uid=${user.uid || user.id}`, {
          method: 'DELETE'
        });
      } catch {
        // backend delete unavailable — continue with local deletion
      }

      setGoals(prev => prev.filter(g => g.id !== goalId));
      if (onGoalUpdate) onGoalUpdate();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal.id);
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      target: goal.target,
      frequency: goal.frequency,
      icon: goal.icon
    });
  };

  const handleUpdateGoal = async () => {
    if (!formData.title.trim()) return;

    try {
      const updatedGoal = { ...goals.find(g => g.id === editingGoal), ...formData };

      const updatedGoals = goals.map(g => g.id === editingGoal ? updatedGoal : g);
      setGoals(updatedGoals);

      try {
        await fetch(`${API_BASE}/api/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid || user.id,
            goals: updatedGoals
          })
        });
      } catch {
        // backend update unavailable — local update already applied
      }

      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        type: GOAL_TYPES.FREQUENCY,
        target: 1,
        frequency: 'weekly',
        icon: '🎯'
      });

      if (onGoalUpdate) onGoalUpdate();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const applyGoalTemplate = (template) => {
    setFormData({
      title: template.title,
      description: template.description,
      type: template.type,
      target: template.target,
      frequency: template.frequency || 'weekly',
      icon: template.icon
    });
    setShowCreateForm(true);
  };

  const getGoalProgressDisplay = (goal) => {
    const progress = getGoalProgress(goal, 'week');
    return progress;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-300 dark:border-rose-700 border-t-rose-400 dark:border-t-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Custom Goals</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Set personal goals to track your journaling progress
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 dark:from-rose-500 dark:to-pink-600 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 border border-rose-400 dark:border-rose-500 shadow-sm flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {goals.length === 0 && !showCreateForm && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">Get Started with Goal Templates</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GOAL_TEMPLATES.map(template => (
              <div
                key={template.id}
                className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-blue-100 dark:border-blue-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => applyGoalTemplate(template)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{template.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{template.description}</p>
                  </div>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Target: {template.target} {template.frequency === 'weekly' ? 'per week' : 'per month'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Goal Form */}
      {(showCreateForm || editingGoal) && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingGoal(null);
                setFormData({
                  title: '',
                  description: '',
                  type: GOAL_TYPES.FREQUENCY,
                  target: 1,
                  frequency: 'weekly',
                  icon: '🎯'
                });
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Goal Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                placeholder="e.g., Write 3 times a week"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                placeholder="Describe your goal..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Goal Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                >
                  <option value={GOAL_TYPES.FREQUENCY}>Frequency (e.g., write X times per period)</option>
                  <option value={GOAL_TYPES.STREAK}>Streak (maintain consecutive days)</option>
                  <option value={GOAL_TYPES.WORD_COUNT}>Word Count (write X words per entry)</option>
                  <option value={GOAL_TYPES.EMOTION_FOCUS}>Emotion Focus (include specific emotions)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {formData.type === GOAL_TYPES.FREQUENCY && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                >
                  {Object.values(FREQUENCY_OPTIONS).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                placeholder="🎯"
                maxLength="2"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                disabled={!formData.title.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 dark:from-rose-500 dark:to-pink-600 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 border border-rose-400 dark:border-rose-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingGoal ? 'Update Goal' : 'Create Goal'}</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingGoal(null);
                  setFormData({
                    title: '',
                    description: '',
                    type: GOAL_TYPES.FREQUENCY,
                    target: 1,
                    frequency: 'weekly',
                    icon: '🎯'
                  });
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = getGoalProgressDisplay(goal);
            return (
              <div
                key={goal.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      Progress this week: {progress.completed} / {progress.target}
                    </span>
                    <span className={`font-medium ${progress.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {Math.round(progress.percentage)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress.isCompleted
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : 'bg-gradient-to-r from-rose-400 to-pink-500'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    />
                  </div>

                  {goal.streakCount > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>Current streak: {goal.streakCount} days</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Created {new Date(goal.createdAt).toLocaleDateString()}</span>
                    <span>Last updated {new Date(goal.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {goals.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No goals yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Create your first custom goal to start tracking your journaling progress
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 dark:from-rose-500 dark:to-pink-600 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 border border-rose-400 dark:border-rose-500 shadow-sm"
          >
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomGoals;