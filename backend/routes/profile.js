import express from 'express';
import { exportEntries, deleteAccount, getUserStats, getPrivacySettings, savePrivacySettings, updateUserProfile } from '../controllers/profileController.js';
import { getUsersForReminders } from '../services/reminderService.js';
import { getCleanupStats, getUsersForCleanup } from '../services/dataCleanupService.js';

const router = express.Router();

router.get('/stats', getUserStats);

router.get('/export', exportEntries);

router.post('/delete', deleteAccount);

router.get('/privacy', getPrivacySettings);

router.post('/privacy', savePrivacySettings);

router.post('/update', updateUserProfile);

// Reminder system endpoints
router.get('/reminders/status', async (req, res) => {
  try {
    const eligibleUsers = await getUsersForReminders();
    res.json({
      eligibleUsersCount: eligibleUsers.length,
      timestamp: new Date().toISOString(),
      status: 'active'
    });
  } catch (error) {
    console.error('Error checking reminder status:', error);
    res.status(500).json({ error: 'Failed to check reminder status' });
  }
});

// Data cleanup endpoints
router.get('/cleanup/status', async (req, res) => {
  try {
    const stats = await getCleanupStats();
    const usersNeedingCleanup = await getUsersForCleanup();

    res.json({
      stats,
      usersNeedingCleanup: usersNeedingCleanup.length,
      timestamp: new Date().toISOString(),
      status: 'active'
    });
  } catch (error) {
    console.error('Error checking cleanup status:', error);
    res.status(500).json({ error: 'Failed to check cleanup status' });
  }
});

router.get('/cleanup/stats', async (req, res) => {
  try {
    const stats = await getCleanupStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
});

export default router;