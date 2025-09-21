import { MongoClient, ObjectId } from 'mongodb';
import { analyzeJournalEntryWithOpenAI } from '../services/openaiService.js';
import { isAIAnalysisEnabled } from '../utils/privacy.js';

const uri = process.env.COSMOSDB_URI;
const dbName = process.env.COSMOSDB_DBNAME || 'whisprlog';
let client;
let collection;

async function connectDB() {
  if (!client) {
    if (!uri) throw new Error('COSMOSDB_URI is not set');
    // Note: modern MongoDB driver ignores useNewUrlParser/useUnifiedTopology options
    client = new MongoClient(uri);
    try {
      await client.connect();
      collection = client.db(dbName).collection('journalEntries');
    } catch (err) {
      // ensure client is unset so next attempt retries
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err && err.message ? err.message : err);
      throw err;
    }
  }
}

export const handleJournalEntry = async (req, res) => {
  const { uid, entry, tags } = req.body;
  if (!uid || !entry) {
    return res.status(400).json({ error: 'Missing uid or entry' });
  }
  try {
    await connectDB();
    const result = await collection.insertOne({
      uid,
      entry,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Journal entry received', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const analyzeJournalEntry = async (req, res) => {
  const { uid, entry, tags } = req.body;
  if (!uid || !entry) {
    return res.status(400).json({ error: 'Missing uid or entry' });
  }
  try {
    const aiEnabled = await isAIAnalysisEnabled(uid);
    
    let analysis = null;
    if (aiEnabled) {
      analysis = await analyzeJournalEntryWithOpenAI(entry);
    } else {
      analysis = {
        sentiment: 'neutral',
        emotions: [],
        themes: [],
        insights: ['AI analysis is disabled in your privacy settings'],
        triggers: []
      };
    }
    
    await connectDB();
    const result = await collection.insertOne({
      uid,
      entry,
      tags: Array.isArray(tags) ? tags : [],
      analysis,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Entry analyzed and saved', id: result.insertedId, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserEntries = async (req, res) => {
  const { userId } = req.params;
  try {
    await connectDB();
    const entries = await collection.find({ uid: userId }).sort({ createdAt: -1 }).toArray();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Server-Sent Events: stream entries for a user
export const streamUserEntries = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).end();

  console.log('streamUserEntries: Starting stream for userId:', userId);

  let client;
  let collection;

  try {
    if (!uri) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(uri);
    await client.connect();
    collection = client.db(dbName).collection('journalEntries');
    console.log('streamUserEntries: Database connected successfully');
  } catch (err) {
    console.error('streamUserEntries: failed to connect to DB', err.message || err);
    res.writeHead(500, { 'Content-Type': 'text/event-stream' });
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'DB connection failed' })}\n\n`);
    return res.end();
  }

  // SSE headers
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  });
  res.write('\n');

  let lastSent = null; // track last createdAt sent
  let interval;
  let sentCollectionError = false;

  const sendEntries = async () => {
    try {
      const q = { uid: userId };
      if (lastSent) q.createdAt = { $gt: lastSent };

      if (!collection || !client) {
        console.warn('sendEntries: collection or client missing, attempting reconnect');
        try {
          if (!client) {
            client = new MongoClient(uri);
            await client.connect();
          }
          collection = client.db(dbName).collection('journalEntries');
          console.log('sendEntries: Reconnected to database');
        } catch (e) {
          console.error('sendEntries: reconnect failed', e && e.message ? e.message : e);
          if (!sentCollectionError) {
            const safeMsg = 'DB reconnection failed';
            res.write(`event: error\ndata: ${JSON.stringify({ error: safeMsg })}\n\n`);
            sentCollectionError = true;
          }
          return;
        }
      }

      const docs = await collection.find(q).sort({ createdAt: 1 }).toArray();
      
      if (docs && docs.length > 0) {
        console.log(`sendEntries: Found ${docs.length} new entries for user ${userId}`);
        docs.forEach(d => {
          const payload = JSON.stringify(d);
          res.write(`data: ${payload}\n\n`);
          lastSent = d.createdAt;
        });
      } else {
        if (docs && docs.length === 0 && Math.random() < 0.1) { // Log ~10% of empty polls to monitor
          console.log(`sendEntries: No new entries for user ${userId}`);
        }
      }
    } catch (err) {
      console.error('streamUserEntries: error polling DB', err && err.message ? err.message : err);
      // send a concise error event but keep the connection open
      const safeMsg = err && err.message ? err.message : 'Unknown DB error';
      res.write(`event: error\ndata: ${JSON.stringify({ error: safeMsg })}\n\n`);
    }
  };

  await sendEntries();

  interval = setInterval(sendEntries, 3000);

  req.on('close', () => {
    console.log('streamUserEntries: Client disconnected, cleaning up');
    if (interval) clearInterval(interval);
    if (client) {
      client.close().catch(err => console.error('Error closing client:', err));
    }
    try { res.end(); } catch (e) { /* ignore */ }
  });
};

export const deleteJournalEntry = async (req, res) => {
  const { id } = req.params;
  try {
    await connectDB();
    await collection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Entry deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};