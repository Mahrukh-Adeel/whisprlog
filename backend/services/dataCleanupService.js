import { MongoClient, ObjectId } from 'mongodb';
import admin from 'firebase-admin';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let privacyCollection;
let journalCollection;
let cleanupHistoryCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    try {
      await client.connect();
      const db = client.db(COSMOSDB_DBNAME);
      privacyCollection = db.collection('privacySettings');
      journalCollection = db.collection('journalEntries');
      cleanupHistoryCollection = db.collection('cleanupHistory');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!privacyCollection || !journalCollection || !cleanupHistoryCollection) {
    const db = client.db(COSMOSDB_DBNAME);
    privacyCollection = db.collection('privacySettings');
    journalCollection = db.collection('journalEntries');
    cleanupHistoryCollection = db.collection('cleanupHistory');
  }
}

/**
 * Calculate cutoff date based on retention policy
 * @param {string} retentionPolicy - 'forever', '1year', or '2years'
 * @returns {Date|null} Cutoff date or null if 'forever'
 */
function getRetentionCutoff(retentionPolicy) {
  const now = new Date();

  switch (retentionPolicy) {
    case '1year':
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return oneYearAgo;
    case '2years':
      const twoYearsAgo = new Date(now);
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      return twoYearsAgo;
    case 'forever':
    default:
      return null; // No cleanup needed
  }
}

/**
 * Get users who have data retention policies that require cleanup
 * @returns {Array} Array of user objects requiring cleanup
 */
export const getUsersForCleanup = async () => {
  try {
    await connectDB();

    const usersWithRetention = await privacyCollection.find({
      dataRetention: { $in: ['1year', '2years'] }
    }).toArray();

    console.log(`Found ${usersWithRetention.length} users with data retention policies`);

    const usersNeedingCleanup = [];

    for (const user of usersWithRetention) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentCleanup = await cleanupHistoryCollection.findOne({
        uid: user.uid,
        cleanupType: 'dataRetention',
        completedAt: { $gte: oneDayAgo }
      });

      if (!recentCleanup) {
        try {
          const userRecord = await admin.auth().getUser(user.uid);
          usersNeedingCleanup.push({
            uid: user.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User',
            privacySettings: user,
            retentionPolicy: user.dataRetention,
            cutoffDate: getRetentionCutoff(user.dataRetention)
          });
        } catch (firebaseError) {
          console.error(`Error fetching user ${user.uid} from Firebase:`, firebaseError.message);
        }
      }
    }

    console.log(`Found ${usersNeedingCleanup.length} users needing data cleanup`);
    return usersNeedingCleanup;
  } catch (error) {
    console.error('Error getting users for cleanup:', error);
    return [];
  }
};

/**
 * Clean up old data for a specific user based on their retention policy
 * @param {Object} user - User object with retention settings
 * @returns {Object} Cleanup results
 */
export const cleanupUserData = async (user) => {
  try {
    console.log(`Starting data cleanup for ${user.email} (${user.displayName})`);
    console.log(`Retention policy: ${user.retentionPolicy}, Cutoff date: ${user.cutoffDate}`);

    if (!user.cutoffDate) {
      console.log(`User ${user.uid} has 'forever' retention policy, skipping cleanup`);
      return { skipped: true, reason: 'forever retention' };
    }

    await connectDB();

    const oldEntries = await journalCollection.find({
      uid: user.uid,
      createdAt: { $lt: user.cutoffDate }
    }).toArray();

    console.log(`Found ${oldEntries.length} entries older than ${user.cutoffDate.toISOString()} for user ${user.uid}`);

    if (oldEntries.length === 0) {
      console.log(`No old entries to clean up for user ${user.uid}`);
      await recordCleanupOperation(user.uid, user.retentionPolicy, 0, []);
      return { deleted: 0, entries: [] };
    }

    const entryIds = oldEntries.map(entry => entry._id);
    const deleteResult = await journalCollection.deleteMany({
      _id: { $in: entryIds }
    });

    console.log(`Deleted ${deleteResult.deletedCount} entries for user ${user.uid}`);

    await recordCleanupOperation(user.uid, user.retentionPolicy, deleteResult.deletedCount, entryIds);

    return {
      deleted: deleteResult.deletedCount,
      entries: oldEntries.map(entry => ({
        id: entry._id,
        createdAt: entry.createdAt,
        entryLength: entry.entry?.length || 0
      }))
    };
  } catch (error) {
    console.error(`Error cleaning up data for user ${user.uid}:`, error);
    return { error: error.message };
  }
};

/**
 * Record a cleanup operation in the history
 * @param {string} uid - User ID
 * @param {string} retentionPolicy - The retention policy applied
 * @param {number} deletedCount - Number of entries deleted
 * @param {Array} deletedEntryIds - IDs of deleted entries
 */
export const recordCleanupOperation = async (uid, retentionPolicy, deletedCount, deletedEntryIds) => {
  try {
    await connectDB();

    await cleanupHistoryCollection.insertOne({
      uid,
      cleanupType: 'dataRetention',
      retentionPolicy,
      deletedCount,
      deletedEntryIds,
      completedAt: new Date(),
      createdAt: new Date()
    });

    console.log(`Recorded cleanup operation for user ${uid}: ${deletedCount} entries deleted`);
  } catch (error) {
    console.error('Error recording cleanup operation:', error);
  }
};

/**
 * Get cleanup statistics for monitoring
 * @returns {Object} Cleanup statistics
 */
export const getCleanupStats = async () => {
  try {
    await connectDB();

    const totalCleanups = await cleanupHistoryCollection.countDocuments();
    const totalEntriesDeleted = await cleanupHistoryCollection.aggregate([
      { $group: { _id: null, total: { $sum: '$deletedCount' } } }
    ]).toArray();

    const recentCleanups = await cleanupHistoryCollection.find({
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).toArray();

    const policyStats = await cleanupHistoryCollection.aggregate([
      { $group: { _id: '$retentionPolicy', count: { $sum: 1 }, totalDeleted: { $sum: '$deletedCount' } } }
    ]).toArray();

    return {
      totalCleanups,
      totalEntriesDeleted: totalEntriesDeleted[0]?.total || 0,
      recentCleanupsCount: recentCleanups.length,
      policyBreakdown: policyStats,
      lastCleanup: recentCleanups.length > 0 ? recentCleanups[0].completedAt : null
    };
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return { error: error.message };
  }
};

/**
 * Main function to process and clean up data for all users
 * This should be called by a cron job or scheduled task
 */
export const processDataCleanup = async () => {
  try {

    const usersNeedingCleanup = await getUsersForCleanup();

    if (usersNeedingCleanup.length === 0) {
      console.log('No users require data cleanup at this time.');
      return { processed: 0, totalDeleted: 0 };
    }

    let totalProcessed = 0;
    let totalDeleted = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const user of usersNeedingCleanup) {
      try {
        const result = await cleanupUserData(user);

        if (result.error) {
          console.error(`Failed to clean up data for user ${user.uid}: ${result.error}`);
          failureCount++;
        } else if (result.skipped) {
          console.log(`Skipped cleanup for user ${user.uid}: ${result.reason}`);
        } else {
          console.log(`Successfully cleaned up ${result.deleted} entries for user ${user.uid}`);
          totalDeleted += result.deleted;
          successCount++;
        }

        totalProcessed++;

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Unexpected error processing user ${user.uid}:`, error);
        failureCount++;
      }
    }

    console.log(`Data cleanup job completed. Processed: ${totalProcessed}, Deleted: ${totalDeleted}, Success: ${successCount}, Failures: ${failureCount}`);

    return {
      processed: totalProcessed,
      totalDeleted,
      successCount,
      failureCount
    };
  } catch (error) {
    console.error('Error in data cleanup job:', error);
    throw error;
  }
};

// For testing purposes - can be called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processDataCleanup().then((result) => {
    console.log('Data cleanup job finished:', result);
    process.exit(0);
  }).catch((error) => {
    console.error('Data cleanup job failed:', error);
    process.exit(1);
  });
}