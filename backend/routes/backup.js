import express from 'express';
import {
  getBackupStatistics,
  getUserBackupHistory,
  getAllBackupHistory,
  recordManualBackup,
  getUserBackupStatus
} from '../controllers/backupController.js';

const router = express.Router();

// Get backup statistics (admin endpoint)
router.get('/stats', getBackupStatistics);

router.get('/history/:uid', getUserBackupHistory);

// Get all backup history (admin endpoint)
router.get('/history', getAllBackupHistory);

router.get('/status/:uid', getUserBackupStatus);

router.post('/record', recordManualBackup);

export default router;