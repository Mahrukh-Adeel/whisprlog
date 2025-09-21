import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

let client;
let privacyCollection;
let journalCollection;
let backupHistoryCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    try {
      await client.connect();
      const db = client.db(COSMOSDB_DBNAME);
      privacyCollection = db.collection('privacySettings');
      journalCollection = db.collection('journalEntries');
      backupHistoryCollection = db.collection('backupHistory');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!privacyCollection || !journalCollection || !backupHistoryCollection) {
    const db = client.db(COSMOSDB_DBNAME);
    privacyCollection = db.collection('privacySettings');
    journalCollection = db.collection('journalEntries');
    backupHistoryCollection = db.collection('backupHistory');
  }
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Get users who have autoBackup enabled and haven't had a recent backup
 * @returns {Array} Array of user objects eligible for backup
 */
export const getUsersForBackup = async () => {
  try {
    await connectDB();

    const usersWithAutoBackup = await privacyCollection.find({
      autoBackup: true
    }).toArray();

    console.log(`Found ${usersWithAutoBackup.length} users with autoBackup enabled`);

    const usersNeedingBackup = [];

    for (const user of usersWithAutoBackup) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentBackup = await backupHistoryCollection.findOne({
        uid: user.uid,
        backupType: 'auto',
        completedAt: { $gte: sevenDaysAgo }
      });

      if (!recentBackup) {
        try {
          const userRecord = await admin.auth().getUser(user.uid);
          usersNeedingBackup.push({
            uid: user.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User',
            privacySettings: user
          });
        } catch (firebaseError) {
          console.error(`Error fetching user ${user.uid} from Firebase:`, firebaseError.message);
        }
      }
    }

    console.log(`Found ${usersNeedingBackup.length} users needing automated backup`);
    return usersNeedingBackup;
  } catch (error) {
    console.error('Error getting users for backup:', error);
    return [];
  }
};

/**
 * Create a backup of user's journal data
 * @param {Object} user - User object with uid, email, displayName
 * @returns {Object} Backup results
 */
export const createUserBackup = async (user) => {
  try {
    console.log(`Starting backup for ${user.email} (${user.displayName})`);

    await connectDB();
    ensureBackupDirectory();

    const entries = await journalCollection.find({ uid: user.uid })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${entries.length} entries for user ${user.uid}`);

    if (entries.length === 0) {
      console.log(`No entries to backup for user ${user.uid}`);
      await recordBackupOperation(user.uid, 'auto', 0, null, 'no_data');
      return { skipped: true, reason: 'no_data' };
    }

    const privacySettings = await privacyCollection.findOne({ uid: user.uid });

    const backupData = {
      metadata: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        backupType: 'auto',
        createdAt: new Date().toISOString(),
        entryCount: entries.length,
        privacySettings: {
          dataRetention: privacySettings?.dataRetention || 'forever',
          exportFormat: privacySettings?.exportFormat || 'json'
        }
      },
      entries: entries.map(entry => ({
        id: entry._id,
        entry: entry.entry,
        tags: entry.tags || [],
        analysis: entry.analysis || null,
        createdAt: entry.createdAt
      }))
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `whisprlog-backup-${user.uid}-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

    const stats = fs.statSync(filepath);
    const fileSize = stats.size;

    console.log(`Created backup file: ${filename} (${(fileSize / 1024).toFixed(2)} KB)`);

    await recordBackupOperation(user.uid, 'auto', entries.length, filename, 'success', fileSize);

    return {
      success: true,
      filename,
      filepath,
      entryCount: entries.length,
      fileSize
    };
  } catch (error) {
    console.error(`Error creating backup for user ${user.uid}:`, error);

    await recordBackupOperation(user.uid, 'auto', 0, null, 'error', 0, error.message);

    return { error: error.message };
  }
};

/**
 * Record a backup operation in the history
 * @param {string} uid - User ID
 * @param {string} backupType - Type of backup ('auto', 'manual')
 * @param {number} entryCount - Number of entries backed up
 * @param {string} filename - Backup filename (if successful)
 * @param {string} status - Status ('success', 'error', 'no_data')
 * @param {number} fileSize - Size of backup file in bytes
 * @param {string} errorMessage - Error message if failed
 */
export const recordBackupOperation = async (uid, backupType, entryCount, filename, status, fileSize = 0, errorMessage = null) => {
  try {
    await connectDB();

    await backupHistoryCollection.insertOne({
      uid,
      backupType,
      entryCount,
      filename,
      status,
      fileSize,
      errorMessage,
      completedAt: new Date(),
      createdAt: new Date()
    });

    console.log(`Recorded backup operation for user ${uid}: ${status}`);
  } catch (error) {
    console.error('Error recording backup operation:', error);
  }
};

/**
 * Get backup statistics for monitoring
 * @returns {Object} Backup statistics
 */
export const getBackupStats = async () => {
  try {
    await connectDB();

    const totalBackups = await backupHistoryCollection.countDocuments();
    const successfulBackups = await backupHistoryCollection.countDocuments({ status: 'success' });
    const failedBackups = await backupHistoryCollection.countDocuments({ status: 'error' });

    const totalSizeResult = await backupHistoryCollection.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]).toArray();

    const recentBackups = await backupHistoryCollection.find({
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).toArray();

    const userBackupStats = await backupHistoryCollection.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$uid', count: { $sum: 1 }, totalEntries: { $sum: '$entryCount' }, totalSize: { $sum: '$fileSize' } } }
    ]).toArray();

    return {
      totalBackups,
      successfulBackups,
      failedBackups,
      successRate: totalBackups > 0 ? ((successfulBackups / totalBackups) * 100).toFixed(2) : 0,
      totalSizeBytes: totalSizeResult[0]?.total || 0,
      recentBackupsCount: recentBackups.length,
      uniqueUsersBackedUp: userBackupStats.length,
      lastBackup: recentBackups.length > 0 ? recentBackups[0].completedAt : null
    };
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return { error: error.message };
  }
};

/**
 * Clean up old backup files (keep only last N backups per user)
 * @param {number} keepCount - Number of recent backups to keep per user (default: 5)
 */
export const cleanupOldBackups = async (keepCount = 5) => {
  try {
    console.log(`Starting cleanup of old backup files (keeping ${keepCount} per user)`);

    await connectDB();

    const allBackups = await backupHistoryCollection.find({
      status: 'success',
      filename: { $exists: true }
    }).sort({ completedAt: -1 }).toArray();

    const backupsByUser = {};
    allBackups.forEach(backup => {
      if (!backupsByUser[backup.uid]) {
        backupsByUser[backup.uid] = [];
      }
      backupsByUser[backup.uid].push(backup);
    });

    let totalDeleted = 0;
    let totalSizeFreed = 0;

    for (const [uid, userBackups] of Object.entries(backupsByUser)) {
      if (userBackups.length <= keepCount) {
        continue; // Keep all if under the limit
      }

      const backupsToDelete = userBackups.slice(keepCount);

      for (const backup of backupsToDelete) {
        try {
          const filepath = path.join(BACKUP_DIR, backup.filename);
          if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            fs.unlinkSync(filepath);
            totalSizeFreed += stats.size;
            totalDeleted++;
            console.log(`Deleted old backup: ${backup.filename}`);
          }
        } catch (fileError) {
          console.error(`Error deleting backup file ${backup.filename}:`, fileError);
        }
      }
    }

    console.log(`Cleanup completed: deleted ${totalDeleted} files, freed ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`);
    return { deleted: totalDeleted, sizeFreed: totalSizeFreed };
  } catch (error) {
    console.error('Error during backup cleanup:', error);
    return { error: error.message };
  }
};

/**
 * Main function to process and create backups for all users
 * This should be called by a cron job or scheduled task
 */
export const processBackups = async () => {
  try {

    const usersNeedingBackup = await getUsersForBackup();

    if (usersNeedingBackup.length === 0) {
      console.log('No users require automated backup at this time.');
      return { processed: 0, successful: 0, failed: 0 };
    }

    let totalProcessed = 0;
    let successful = 0;
    let failed = 0;
    let totalEntries = 0;
    let totalSize = 0;

    for (const user of usersNeedingBackup) {
      try {
        const result = await createUserBackup(user);

        if (result.success) {
          successful++;
          totalEntries += result.entryCount;
          totalSize += result.fileSize;
          console.log(` Successfully backed up ${result.entryCount} entries for user ${user.uid}`);
        } else if (result.skipped) {
          console.log(`Skipped backup for user ${user.uid}: ${result.reason}`);
        } else {
          console.error(`Failed to backup user ${user.uid}: ${result.error}`);
          failed++;
        }

        totalProcessed++;

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Unexpected error processing user ${user.uid}:`, error);
        failed++;
      }
    }

    try {
      const cleanupResult = await cleanupOldBackups();
      if (cleanupResult.deleted > 0) {
        console.log(`🧹 Cleaned up ${cleanupResult.deleted} old backup files`);
      }
    } catch (cleanupError) {
      console.error('Error during backup cleanup:', cleanupError);
    }

    return {
      processed: totalProcessed,
      successful,
      failed,
      totalEntries,
      totalSize
    };
  } catch (error) {
    console.error('Error in backup processing job:', error);
    throw error;
  }
};

// For testing purposes - can be called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processBackups().then((result) => {
    console.log('Backup job finished:', result);
    process.exit(0);
  }).catch((error) => {
    console.error('Backup job failed:', error);
    process.exit(1);
  });
}