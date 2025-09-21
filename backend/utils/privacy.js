import { MongoClient } from 'mongodb';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let privacyCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    try {
      await client.connect();
      const db = client.db(COSMOSDB_DBNAME);
      privacyCollection = db.collection('privacySettings');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!privacyCollection) {
    const db = client.db(COSMOSDB_DBNAME);
    privacyCollection = db.collection('privacySettings');
  }
}

/**
 * Check if AI analysis is enabled for a user based on their privacy settings
 * @param {string} uid - User ID
 * @returns {boolean} - True if AI analysis is enabled, false otherwise
 */
export const isAIAnalysisEnabled = async (uid) => {
  if (!uid) return false;

  try {
    await connectDB();
    if (!privacyCollection) return false;

    const settings = await privacyCollection.findOne({ uid });
    if (settings) {
      return settings.aiAnalysisEnabled !== false; // Default to true if not set
    } else {
      return true; // Default to true for new users
    }
  } catch (err) {
    console.error('Error checking AI analysis privacy setting:', err.message);
    return false; // Default to false on error for safety
  }
};