import { MongoClient } from 'mongodb';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let goalsCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    await client.connect();
    goalsCollection = client.db(COSMOSDB_DBNAME).collection('userGoals');
  }
}

export const getUserGoals = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    const userGoals = await goalsCollection.findOne({ uid });
    const goals = userGoals ? userGoals.goals || [] : [];

    res.json({ goals });
  } catch (err) {
    console.error('Error fetching user goals:', err.message);
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
};

export const saveUserGoals = async (req, res) => {
  const { uid, goals } = req.body;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!Array.isArray(goals)) return res.status(400).json({ error: 'Goals must be an array.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    await goalsCollection.updateOne(
      { uid },
      {
        $set: {
          goals,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ success: true, goals });
  } catch (err) {
    console.error('Error saving user goals:', err.message);
    res.status(500).json({ error: 'Failed to save goals.' });
  }
};

// Add a new goal
export const addUserGoal = async (req, res) => {
  const { uid, goalData } = req.body;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!goalData || !goalData.title) return res.status(400).json({ error: 'Goal data with title required.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    const userGoals = await goalsCollection.findOne({ uid });
    const goals = userGoals ? userGoals.goals || [] : [];

    const newGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: goalData.title,
      description: goalData.description || '',
      type: goalData.type || 'frequency',
      target: goalData.target || 1,
      frequency: goalData.frequency || 'daily',
      icon: goalData.icon || '🎯',
      createdAt: new Date(),
      isActive: true,
      progress: 0,
      streakCount: 0,
      lastUpdated: new Date(),
      completedDates: []
    };

    goals.push(newGoal);

    await goalsCollection.updateOne(
      { uid },
      {
        $set: {
          goals,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ success: true, goal: newGoal });
  } catch (err) {
    console.error('Error adding user goal:', err.message);
    res.status(500).json({ error: 'Failed to add goal.' });
  }
};

export const updateGoalProgress = async (req, res) => {
  const { uid } = req.body;
  const { goalId } = req.params;
  const { progress, date } = req.body;

  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!goalId) return res.status(400).json({ error: 'Goal ID required.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    const userGoals = await goalsCollection.findOne({ uid });
    if (!userGoals) return res.status(404).json({ error: 'User goals not found.' });

    const goals = userGoals.goals || [];
    const goalIndex = goals.findIndex(g => g.id === goalId);

    if (goalIndex === -1) return res.status(404).json({ error: 'Goal not found.' });

    const goal = goals[goalIndex];
    const completionDate = date ? new Date(date) : new Date();
    const dateStr = completionDate.toISOString().split('T')[0];

    goal.progress = progress;
    goal.lastUpdated = new Date();

    if (progress >= goal.target && !goal.completedDates.includes(dateStr)) {
      goal.completedDates.push(dateStr);
      goal.streakCount = calculateCurrentStreak(goal.completedDates);
    }

    goals[goalIndex] = goal;

    await goalsCollection.updateOne(
      { uid },
      {
        $set: {
          goals,
          lastUpdated: new Date()
        }
      }
    );

    res.json({ success: true, goal });
  } catch (err) {
    console.error('Error updating goal progress:', err.message);
    res.status(500).json({ error: 'Failed to update goal progress.' });
  }
};

export const deleteUserGoal = async (req, res) => {
  const { uid } = req.query;
  const { goalId } = req.params;

  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!goalId) return res.status(400).json({ error: 'Goal ID required.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    const userGoals = await goalsCollection.findOne({ uid });
    if (!userGoals) return res.status(404).json({ error: 'User goals not found.' });

    const goals = userGoals.goals || [];
    const updatedGoals = goals.filter(g => g.id !== goalId);

    await goalsCollection.updateOne(
      { uid },
      {
        $set: {
          goals: updatedGoals,
          lastUpdated: new Date()
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting goal:', err.message);
    res.status(500).json({ error: 'Failed to delete goal.' });
  }
};

export const syncGoalsWithEntries = async (req, res) => {
  const { uid, entries } = req.body;

  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'Entries must be an array.' });

  try {
    await connectDB();
    if (!goalsCollection) throw new Error('DB collection not initialized');

    const userGoals = await goalsCollection.findOne({ uid });
    if (!userGoals) return res.json({ success: true, goals: [] });

    const goals = userGoals.goals || [];

    goals.forEach(goal => {
      let progress = 0;
      let newCompletedDates = [...goal.completedDates]; // Copy existing completed dates

      switch (goal.type) {
        case 'frequency': {
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

        case 'word_count': {
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

        case 'streak': {
          progress = goal.streakCount || 0;
          break;
        }

        case 'emotion_focus': {
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
      goal.lastUpdated = new Date();
    });

    await goalsCollection.updateOne(
      { uid },
      {
        $set: {
          goals,
          lastUpdated: new Date()
        }
      }
    );

    res.json({ success: true, goals });
  } catch (err) {
    console.error('Error syncing goals:', err.message);
    res.status(500).json({ error: 'Failed to sync goals.' });
  }
};

const calculateCurrentStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const sortedDates = completedDates.sort();
  let streak = 0;
  let currentDate = new Date();

  // Count consecutive days backwards from today
  // Start from today and work backwards, but also check if we should start from yesterday
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

const getPeriodStart = (frequency) => {
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