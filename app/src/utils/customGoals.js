export const GOAL_TYPES = {
  FREQUENCY: 'frequency', // e.g., "write 3 times a week"
  STREAK: 'streak', // e.g., "maintain 7-day streak"
  WORD_COUNT: 'word_count', // e.g., "write 500 words per entry"
  TIME_SPENT: 'time_spent', // e.g., "spend 15 minutes journaling"
  CONSISTENCY: 'consistency', // e.g., "journal every other day"
  EMOTION_FOCUS: 'emotion_focus' // e.g., "focus on gratitude entries"
};

export const FREQUENCY_OPTIONS = {
  DAILY: { label: 'Daily', value: 'daily', days: 1 },
  WEEKLY: { label: 'Weekly', value: 'weekly', days: 7 },
  MONTHLY: { label: 'Monthly', value: 'monthly', days: 30 },
  BIWEEKLY: { label: 'Every 2 weeks', value: 'biweekly', days: 14 }
};

export const GOAL_TEMPLATES = [
  {
    id: 'write_3_weekly',
    title: 'Write 3 times a week',
    description: 'Build a consistent weekly journaling habit',
    type: GOAL_TYPES.FREQUENCY,
    frequency: 'weekly',
    target: 3,
    icon: '📝'
  },
  {
    id: 'maintain_week_streak',
    title: '7-day streak',
    description: 'Keep your daily journaling streak alive',
    type: GOAL_TYPES.STREAK,
    target: 7,
    icon: '🔥'
  },
  {
    id: 'deep_reflection',
    title: 'Deep reflections',
    description: 'Write at least 300 words per entry',
    type: GOAL_TYPES.WORD_COUNT,
    target: 300,
    icon: '📖'
  },
  {
    id: 'gratitude_focus',
    title: 'Gratitude practice',
    description: 'Include gratitude in 80% of entries',
    type: GOAL_TYPES.EMOTION_FOCUS,
    target: 80,
    icon: '🙏'
  },
  {
    id: 'monthly_consistency',
    title: 'Monthly consistency',
    description: 'Journal at least 20 days this month',
    type: GOAL_TYPES.CONSISTENCY,
    frequency: 'monthly',
    target: 20,
    icon: '📅'
  }
];

export const createCustomGoal = (goalData) => {
  const goal = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: goalData.title,
    description: goalData.description,
    type: goalData.type,
    target: goalData.target,
    frequency: goalData.frequency || 'daily',
    icon: goalData.icon || '🎯',
    createdAt: new Date().toISOString(),
    isActive: true,
    progress: 0,
    streakCount: 0,
    lastUpdated: new Date().toISOString(),
    completedDates: []
  };

  return goal;
};

export const getUserGoals = (userId) => {
  try {
    const goals = JSON.parse(localStorage.getItem(`custom_goals_${userId}`) || '[]');
    return goals.filter(goal => goal.isActive);
  } catch (error) {
    console.error('Error loading custom goals:', error);
    return [];
  }
};

export const saveUserGoals = (userId, goals) => {
  try {
    localStorage.setItem(`custom_goals_${userId}`, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error saving custom goals:', error);
    return false;
  }
};

export const addUserGoal = (userId, goalData) => {
  const goals = getUserGoals(userId);
  const newGoal = createCustomGoal(goalData);
  goals.push(newGoal);
  saveUserGoals(userId, goals);
  return newGoal;
};

export const updateGoalProgress = (userId, goalId, newProgress, date = new Date()) => {
  const goals = getUserGoals(userId);
  const goalIndex = goals.findIndex(g => g.id === goalId);

  if (goalIndex === -1) return false;

  const goal = goals[goalIndex];
  const dateStr = date.toISOString().split('T')[0];

  goal.progress = newProgress;
  goal.lastUpdated = new Date().toISOString();

  if (goal.type === GOAL_TYPES.FREQUENCY || newProgress >= goal.target) {
    if (!goal.completedDates.includes(dateStr)) {
      goal.completedDates.push(dateStr);
      goal.streakCount = calculateCurrentStreak(goal.completedDates);
    }
  }

  goals[goalIndex] = goal;
  saveUserGoals(userId, goals);
  return goal;
};

export const calculateCurrentStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const sortedDates = completedDates.sort();
  let streak = 0;
  let currentDate = new Date();

  // Count consecutive days backwards from today
  const today = currentDate.toISOString().split('T')[0];
  const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // If today is completed, start counting from today
  // If yesterday is completed but today isn't, start counting from yesterday
  // If neither today nor yesterday is completed, find the most recent completion and count from there
  let startDate = currentDate;

  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    const mostRecentDate = sortedDates[sortedDates.length - 1];
    if (!mostRecentDate) return 0;

    const mostRecent = new Date(mostRecentDate);
    const daysSince = Math.floor((currentDate - mostRecent) / (24 * 60 * 60 * 1000));

    if (daysSince > 1) return 0;

    startDate = mostRecent;
  } else if (!sortedDates.includes(today) && sortedDates.includes(yesterday)) {
    // Start from yesterday if today isn't completed but yesterday is
    startDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000);
    const checkDateStr = checkDate.toISOString().split('T')[0];

    if (sortedDates.includes(checkDateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export const getGoalProgress = (goal, timeframe = 'week') => {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const periodCompletions = goal.completedDates.filter(date => {
    const completionDate = new Date(date);
    return completionDate >= startDate && completionDate <= now;
  });

  return {
    completed: periodCompletions.length,
    target: goal.target,
    percentage: Math.min((periodCompletions.length / goal.target) * 100, 100),
    isCompleted: periodCompletions.length >= goal.target,
    streak: goal.streakCount || 0
  };
};

export const deleteUserGoal = (userId, goalId) => {
  const goals = getUserGoals(userId);
  const updatedGoals = goals.filter(g => g.id !== goalId);
  saveUserGoals(userId, updatedGoals);
  return true;
};

export const toggleGoalStatus = (userId, goalId) => {
  const goals = getUserGoals(userId);
  const goalIndex = goals.findIndex(g => g.id === goalId);

  if (goalIndex === -1) return false;

  goals[goalIndex].isActive = !goals[goalIndex].isActive;
  saveUserGoals(userId, goals);
  return goals[goalIndex];
};

export const getGoalAchievements = (goal) => {
  const achievements = [];

  if (goal.streakCount >= 7) {
    achievements.push({
      id: 'week_streak',
      title: 'Week Streak!',
      description: 'Maintained goal for 7 consecutive days',
      icon: '🔥'
    });
  }

  if (goal.streakCount >= 30) {
    achievements.push({
      id: 'month_streak',
      title: 'Monthly Champion',
      description: 'Maintained goal for 30 consecutive days',
      icon: '👑'
    });
  }

  if (goal.completedDates.length >= 50) {
    achievements.push({
      id: 'consistency_master',
      title: 'Consistency Master',
      description: 'Completed goal 50 times',
      icon: '🎯'
    });
  }

  return achievements;
};

export const syncGoalsWithEntries = (userId, entries) => {
  const goals = getUserGoals(userId);

  goals.forEach(goal => {
    let progress = 0;
    let newCompletedDates = [...goal.completedDates];

    switch (goal.type) {
      case GOAL_TYPES.FREQUENCY: {
        const periodStart = getPeriodStart(goal.frequency);
        const periodEntries = entries.filter(entry => {
          const entryDate = new Date(entry.createdAt || entry.date);
          return entryDate >= periodStart;
        });

        progress = periodEntries.length;

        periodEntries.forEach(entry => {
          const entryDate = new Date(entry.createdAt || entry.date);
          const dateStr = entryDate.toISOString().split('T')[0];
          if (!newCompletedDates.includes(dateStr)) {
            newCompletedDates.push(dateStr);
          }
        });

        break;
      }

      case GOAL_TYPES.WORD_COUNT: {
        const qualifyingEntries = entries.filter(entry => {
          const wordCount = (entry.entry || entry.content || '').split(' ').length;
          return wordCount >= goal.target;
        });

        progress = qualifyingEntries.length;

        qualifyingEntries.forEach(entry => {
          const entryDate = new Date(entry.createdAt || entry.date);
          const dateStr = entryDate.toISOString().split('T')[0];
          if (!newCompletedDates.includes(dateStr)) {
            newCompletedDates.push(dateStr);
          }
        });

        break;
      }

      case GOAL_TYPES.STREAK: {
        progress = goal.streakCount || 0;
        break;
      }

      case GOAL_TYPES.EMOTION_FOCUS: {
        const focusEntries = entries.filter(entry => {
          const content = (entry.entry || entry.content || '').toLowerCase();
          return content.includes('grateful') || content.includes('thankful') || content.includes('gratitude');
        });

        progress = Math.round((focusEntries.length / entries.length) * 100);

        focusEntries.forEach(entry => {
          const entryDate = new Date(entry.createdAt || entry.date);
          const dateStr = entryDate.toISOString().split('T')[0];
          if (!newCompletedDates.includes(dateStr)) {
            newCompletedDates.push(dateStr);
          }
        });

        break;
      }

      default:
        progress = goal.progress || 0;
    }

    goal.progress = progress;
    goal.completedDates = newCompletedDates;
    goal.streakCount = calculateCurrentStreak(newCompletedDates);
    goal.lastUpdated = new Date().toISOString();

    updateGoalProgress(userId, goal.id, progress);
  });

  return goals;
};const getPeriodStart = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'daily': {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    case 'weekly': {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    }
    case 'monthly': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case 'biweekly': {
      const biweekStart = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToSubtract = (dayOfWeek + 7) % 14;
      biweekStart.setDate(now.getDate() - daysToSubtract);
      return new Date(biweekStart.getFullYear(), biweekStart.getMonth(), biweekStart.getDate());
    }
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};