import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Target, Plus, Edit, Trash2, CheckCircle, Circle, TrendingUp, Calendar, X, Save } from 'lucide-react';
import { getUserGoals, addUserGoal, deleteUserGoal, GOAL_TYPES, GOAL_TEMPLATES, FREQUENCY_OPTIONS, getGoalProgress, syncGoalsWithEntries } from '../utils/customGoals';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const GoalTrackingTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, {
      test,
      result,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runGoalTrackingTests = async () => {
    if (!user) {
      addTestResult('Authentication Check', false, 'User not authenticated');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      addTestResult('Goal Retrieval', true, 'Testing goal retrieval functionality');

      const goals = getUserGoals(user.uid || user.id);
      addTestResult('Local Storage Goals', true, `Found ${goals.length} goals in local storage`);

      try {
        const res = await fetch(`${API_BASE}/api/goals?uid=${user.uid || user.id}`);
        if (res.ok) {
          const data = await res.json();
          addTestResult('Backend Connectivity', true, `Backend returned ${data.goals?.length || 0} goals`);
        } else {
          addTestResult('Backend Connectivity', false, `HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (error) {
        addTestResult('Backend Connectivity', false, `Network error: ${error.message}`);
      }

      const testGoalData = {
        title: 'Test Goal - Write Daily',
        description: 'Testing goal creation and tracking',
        type: GOAL_TYPES.FREQUENCY,
        target: 1,
        frequency: 'daily',
        icon: '🧪'
      };

      const newGoal = await addUserGoal(user.uid || user.id, testGoalData);
      addTestResult('Goal Creation', true, `Created goal with ID: ${newGoal.id}`);

      const updatedGoals = getUserGoals(user.uid || user.id);
      const createdGoal = updatedGoals.find(g => g.id === newGoal.id);
      if (createdGoal) {
        addTestResult('Local Storage Sync', true, 'Goal successfully saved to local storage');
      } else {
        addTestResult('Local Storage Sync', false, 'Goal not found in local storage');
      }

      const progress = getGoalProgress(createdGoal, 'week');
      addTestResult('Progress Calculation', true, `Progress: ${progress.completed}/${progress.target} (${Math.round(progress.percentage)}%)`);

      try {
        const entriesRes = await fetch(`${API_BASE}/api/trends?uid=${user.uid || user.id}`);
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          if (Array.isArray(entries) && entries.length > 0) {
            await syncGoalsWithEntries(user.uid || user.id, entries);
            addTestResult('Goal Sync', true, `Synced with ${entries.length} entries`);
          } else {
            addTestResult('Goal Sync', true, 'No entries to sync with (this is normal for new users)');
          }
        } else {
          addTestResult('Goal Sync', false, `Failed to fetch entries: HTTP ${entriesRes.status}`);
        }
      } catch (error) {
        addTestResult('Goal Sync', false, `Sync error: ${error.message}`);
      }

      await deleteUserGoal(user.uid || user.id, newGoal.id);
      const finalGoals = getUserGoals(user.uid || user.id);
      const deletedGoal = finalGoals.find(g => g.id === newGoal.id);
      if (!deletedGoal) {
        addTestResult('Goal Deletion', true, 'Test goal successfully deleted');
      } else {
        addTestResult('Goal Deletion', false, 'Test goal still exists after deletion');
      }

      const allGoals = getUserGoals(user.uid || user.id);
      const issues = [];

      allGoals.forEach(goal => {
        if (!goal.id) issues.push(`${goal.title}: Missing ID`);
        if (!goal.title) issues.push(`${goal.id}: Missing title`);
        if (typeof goal.progress !== 'number') issues.push(`${goal.title}: Invalid progress type`);
        if (!Array.isArray(goal.completedDates)) issues.push(`${goal.title}: Invalid completedDates format`);
      });

      if (issues.length === 0) {
        addTestResult('Data Integrity', true, 'All goals have valid data structure');
      } else {
        addTestResult('Data Integrity', false, `Found ${issues.length} issues: ${issues.join(', ')}`);
      }

    } catch (error) {
      addTestResult('Test Execution', false, `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span>Goal Tracking Test Suite</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive testing of custom goals functionality
          </p>
        </div>
        <button
          onClick={runGoalTrackingTests}
          disabled={isRunning || !user}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Run Tests</span>
            </>
          )}
        </button>
      </div>

      {!user && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please log in to run goal tracking tests.
          </p>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Test Results ({testResults.length} tests)
          </h3>

          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.result
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result.result ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.test}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {result.details && (
                  <p className={`text-sm mt-2 ${
                    result.result
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                ✅ Passed: {testResults.filter(r => r.result).length}
              </span>
              <span className="text-red-600 dark:text-red-400">
                ❌ Failed: {testResults.filter(r => !r.result).length}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Total: {testResults.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            Ready to Test Goal Tracking
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Click "Run Tests" to perform comprehensive testing of the goal tracking system
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalTrackingTest;