import { getBackupStats, recordBackupOperation } from '../services/backupService.js';
import { MongoClient } from 'mongodb';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let backupHistoryCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    try {
      await client.connect();
      const db = client.db(COSMOSDB_DBNAME);
      backupHistoryCollection = db.collection('backupHistory');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!backupHistoryCollection) {
    const db = client.db(COSMOSDB_DBNAME);
    backupHistoryCollection = db.collection('backupHistory');
  }
}

export const getBackupStatistics = async (req, res) => {
  try {
    const stats = await getBackupStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting backup statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup statistics'
    });
  }
};

export const getUserBackupHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    await connectDB();

    const backups = await backupHistoryCollection.find({ uid })
      .sort({ completedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await backupHistoryCollection.countDocuments({ uid });

    res.json({
      success: true,
      data: {
        backups,
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting user backup history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup history'
    });
  }
};

/**
 * Get all backup history (admin endpoint)
 */
export const getAllBackupHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, uid } = req.query;

    await connectDB();

    let query = {};
    if (status) query.status = status;
    if (uid) query.uid = uid;

    const backups = await backupHistoryCollection.find(query)
      .sort({ completedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await backupHistoryCollection.countDocuments(query);

    res.json({
      success: true,
      data: {
        backups,
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting all backup history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup history'
    });
  }
};

export const recordManualBackup = async (req, res) => {
  try {
    const { uid, entryCount, filename, fileSize } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await recordBackupOperation(uid, 'manual', entryCount || 0, filename, 'success', fileSize || 0);

    res.json({
      success: true,
      message: 'Manual backup recorded successfully'
    });
  } catch (error) {
    console.error('Error recording manual backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record manual backup'
    });
  }
};


export const getUserBackupStatus = async (req, res) => {
  try {
    const { uid } = req.params;

    await connectDB();

    const lastBackup = await backupHistoryCollection.findOne(
      { uid },
      { sort: { completedAt: -1 } }
    );

    const privacyCollection = client.db(COSMOSDB_DBNAME).collection('privacySettings');
    const privacySettings = await privacyCollection.findOne({ uid });

    const autoBackupEnabled = privacySettings?.autoBackup || false;

    let daysSinceLastBackup = null;
    if (lastBackup) {
      const now = new Date();
      const lastBackupDate = new Date(lastBackup.completedAt);
      daysSinceLastBackup = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      data: {
        lastBackup: lastBackup ? {
          completedAt: lastBackup.completedAt,
          status: lastBackup.status,
          entryCount: lastBackup.entryCount,
          fileSize: lastBackup.fileSize,
          filename: lastBackup.filename
        } : null,
        daysSinceLastBackup,
        autoBackupEnabled,
        needsBackup: autoBackupEnabled && (!lastBackup || daysSinceLastBackup >= 7)
      }
    });
  } catch (error) {
    console.error('Error getting user backup status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup status'
    });
  }
};