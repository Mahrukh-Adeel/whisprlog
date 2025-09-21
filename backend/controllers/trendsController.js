import { MongoClient } from 'mongodb';
import { analyzeEmotionalTrends, generatePersonalizedPrompts, analyzeEmotionalTriggers, generatePersonalizedInsights } from '../services/openaiService.js';
import { isAIAnalysisEnabled } from '../utils/privacy.js';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let collection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    collection = client.db(COSMOSDB_DBNAME).collection('journalEntries');
  }
}

export const getUserEntries = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
  if (!collection) throw new Error('DB collection not initialized');
  const entries = await collection.find({ uid }).sort({ createdAt: -1 }).toArray();
    res.json(entries);
  } catch (err) {
    console.error('MongoDB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch entries.' });
  }
};

export const getUserTrends = async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  try {
    await connectDB();
    if (!collection) throw new Error('DB collection not initialized');

    const entries = await collection.find({ uid: userId }).sort({ createdAt: -1 }).toArray();

    const basicTrends = entries.map(entry => ({
      date: entry.createdAt.toISOString().split('T')[0],
      mood: entry.analysis?.mood || 5,
      sentiment: entry.analysis?.sentiment || 'neutral',
      emotions: entry.analysis?.emotions || [],
      summary: entry.analysis?.summary || '',
      fullDate: entry.createdAt,
      content: entry.entry
    }));

    let aiAnalysis = null;
    let personalizedPrompts = null;
    let triggerAnalysis = null;
    let personalizedInsights = null;

    // Check if AI analysis is enabled for this user
    const aiEnabled = await isAIAnalysisEnabled(userId);

    if (entries.length >= 2 && aiEnabled) {
      try {
        const [trendsAnalysis, prompts, triggers, insights] = await Promise.allSettled([
          analyzeEmotionalTrends(entries),
          generatePersonalizedPrompts(entries),
          analyzeEmotionalTriggers(entries),
          generatePersonalizedInsights(entries)
        ]);

        if (trendsAnalysis.status === 'fulfilled') {
          aiAnalysis = trendsAnalysis.value;
        }

        if (prompts.status === 'fulfilled') {
          personalizedPrompts = prompts.value;
        }

        if (triggers.status === 'fulfilled') {
          triggerAnalysis = triggers.value;
        }

        if (insights.status === 'fulfilled') {
          personalizedInsights = insights.value;
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
      }
    } else if (entries.length >= 2 && !aiEnabled) {
      // Provide basic fallback responses when AI is disabled
      aiAnalysis = {
        overallTrend: 'neutral',
        dominantEmotions: [],
        insights: ['AI analysis is disabled in your privacy settings']
      };
      personalizedPrompts = [];
      triggerAnalysis = {
        commonTriggers: [],
        insights: ['AI analysis is disabled in your privacy settings']
      };
      personalizedInsights = ['AI analysis is disabled in your privacy settings'];
    }

    const response = {
      entries: basicTrends,
      aiAnalysis,
      personalizedPrompts,
      triggerAnalysis,
      personalizedInsights,
      analysisTimestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching user trends:', err.message);
    res.status(500).json({ error: 'Failed to fetch user trends.' });
  }
};