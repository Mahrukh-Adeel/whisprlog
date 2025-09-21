import { MongoClient } from 'mongodb';
import axios from 'axios';
import {
  analyzeEmotionalTrends,
  generatePersonalizedPrompts,
  generateCheckinSuggestions,
  analyzeWeeklyCheckins
} from '../services/openaiService.js';
import { isAIAnalysisEnabled } from '../utils/privacy.js';

const uri = process.env.COSMOSDB_URI;
const dbName = process.env.COSMOSDB_DBNAME || 'whisprlog';
let client;
let journalCollection;
let checkinsCollection;

async function connectDB() {
  if (!client) {
    if (!uri) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(dbName);
      journalCollection = db.collection('journalEntries');
      checkinsCollection = db.collection('weeklyCheckins');
      console.log('Database connected successfully in weeklyCheckinController');
    } catch (err) {
      client = null;
      journalCollection = null;
      checkinsCollection = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!checkinsCollection || !journalCollection) {
    const db = client.db(dbName);
    journalCollection = db.collection('journalEntries');
    checkinsCollection = db.collection('weeklyCheckins');
  }
}

export const getEmotionalPatterns = async (req, res) => {
  const { uid } = req.query;
  console.log('getEmotionalPatterns called with uid:', uid);
  
  if (!uid) {
    console.log('No uid provided');
    return res.status(400).json({ error: 'Missing uid parameter' });
  }

  try {
    console.log('Connecting to database...');
    await connectDB();

    const entries = await journalCollection
      .find({ uid })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    console.log(`Found ${entries.length} journal entries for user ${uid}`);

    if (entries.length === 0) {
      console.log('No entries found, returning default response');
      return res.json({
        patterns: [],
        message: 'No journal entries found for analysis',
        dominantEmotion: 'No data yet',
        consistency: 0
      });
    }

    const aiEnabled = await isAIAnalysisEnabled(uid);

    let analysis;
    if (aiEnabled) {
      console.log('Analyzing emotional trends...');
      analysis = await analyzeEmotionalTrends(entries);
      console.log('Analysis result:', analysis);
    } else {
      console.log('AI analysis disabled, providing basic response');
      analysis = {
        dominantEmotion: 'neutral',
        consistency: 0,
        patterns: [],
        insights: ['AI analysis is disabled in your privacy settings']
      };
    }

    res.json({
      patterns: analysis,
      entryCount: entries.length,
      dateRange: {
        from: entries[entries.length - 1]?.createdAt,
        to: entries[0]?.createdAt
      },
      dominantEmotion: analysis.dominantEmotion,
      consistency: analysis.consistency
    });
  } catch (err) {
    console.error('getEmotionalPatterns error:', err);
    res.status(500).json({ 
      error: err.message,
      dominantEmotion: 'Error analyzing',
      consistency: null
    });
  }
};

export const generatePrompt = async (req, res) => {
  const { uid, recentEntries, userStats, previousCheckins } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    await connectDB();

    let entries = recentEntries || [];
    if (entries.length === 0) {
      entries = await journalCollection
        .find({ uid })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
    }

    const aiEnabled = await isAIAnalysisEnabled(uid);

    let prompts;
    if (aiEnabled) {
      prompts = await generatePersonalizedPrompts(entries, null, userStats, previousCheckins);
    } else {
      prompts = [
        { prompt: 'What are you grateful for today?' },
        { prompt: 'How are you feeling right now?' },
        { prompt: 'What would you like to focus on this week?' }
      ];
    }

    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    const followUpQuestions = [
      "What specific examples come to mind when you think about this?",
      "How does this connect to your daily experiences?",
      "What would you like to remember about this reflection?"
    ];

    res.json({
      prompt: selectedPrompt.prompt,
      followUpQuestions,
      generatedAt: new Date(),
      basedOnEntries: entries.length
    });
  } catch (err) {
    console.error('generatePrompt error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getSuggestions = async (req, res) => {
  const { uid, currentPrompt } = req.body;
  if (!uid || !currentPrompt) {
    return res.status(400).json({ error: 'Missing uid or currentPrompt' });
  }

  try {
    await connectDB();

    if (!checkinsCollection) {
      throw new Error('Database connection failed - checkinsCollection not initialized');
    }

    const checkins = await checkinsCollection
      .find({ uid })
      .sort({ date: -1 })
      .limit(3)
      .toArray();

    const entries = await journalCollection
      .find({ uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const aiEnabled = await isAIAnalysisEnabled(uid);

    let suggestions;
    if (aiEnabled) {
      suggestions = await generateCheckinSuggestions(checkins, entries, currentPrompt);
    } else {
      suggestions = [
        "Consider how this prompt relates to your recent experiences",
        "Think about what you want to focus on for personal growth",
        "Reflect on your emotional well-being this week"
      ];
    }

    res.json({
      suggestions,
      context: {
        recentCheckins: checkins.length,
        recentEntries: entries.length
      }
    });
  } catch (err) {
    console.error('getSuggestions error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getInsights = async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid' });
  }

  try {
    await connectDB();

    if (!checkinsCollection) {
      throw new Error('Database connection failed - checkinsCollection not initialized');
    }

    const checkins = await checkinsCollection
      .find({ uid })
      .sort({ date: -1 })
      .limit(8)
      .toArray();

    const entries = await journalCollection
      .find({ uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    if (checkins.length === 0) {
      return res.json({
        insights: {
          message: 'No weekly check-ins found. Start with your first check-in to get personalized insights!'
        }
      });
    }

    const aiEnabled = await isAIAnalysisEnabled(uid);

    let insights;
    if (aiEnabled) {
      insights = await analyzeWeeklyCheckins(checkins, entries);
    } else {
      insights = {
        message: 'Weekly check-in insights are available but AI analysis is disabled in your privacy settings.',
        summary: 'Your weekly reflections are being stored securely.',
        recommendations: ['Continue your weekly check-in practice for consistent self-reflection']
      };
    }

    res.json({
      insights,
      dataPoints: {
        checkinsAnalyzed: checkins.length,
        journalEntries: entries.length
      }
    });
  } catch (err) {
    console.error('getInsights error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getCheckins = async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'Missing uid parameter' });
  }

  try {
    await connectDB();

    if (!checkinsCollection) {
      throw new Error('Database connection failed - checkinsCollection not initialized');
    }

    const checkins = await checkinsCollection
      .find({ uid })
      .sort({ date: -1 })
      .toArray();

    res.json({
      checkins,
      count: checkins.length
    });
  } catch (err) {
    console.error('getCheckins error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const analyzeReflection = async (req, res) => {
  const { uid, prompt, reflection } = req.body;
  if (!uid || !reflection) {
    return res.status(400).json({ error: 'Missing uid or reflection' });
  }

  try {
    await connectDB();

    if (!checkinsCollection) {
      throw new Error('Database connection failed - checkinsCollection not initialized');
    }

    // Check if user has submitted a check-in within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckin = await checkinsCollection
      .find({ uid })
      .sort({ date: -1 })
      .limit(1)
      .toArray();

    if (recentCheckin.length > 0) {
      const lastCheckinDate = new Date(recentCheckin[0].date);
      if (lastCheckinDate > sevenDaysAgo) {
        const daysUntilNext = Math.ceil((sevenDaysAgo.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24)) + 7;
        return res.status(429).json({
          error: 'Weekly check-in limit reached',
          message: 'You can only submit one weekly reflection every 7 days',
          daysUntilNext: daysUntilNext,
          lastCheckinDate: lastCheckinDate.toISOString()
        });
      }
    }

    const checkinData = {
      uid,
      prompt: prompt || '',
      reflection,
      date: new Date(),
      wordCount: reflection.split(' ').length,
      themes: extractThemesFromText(reflection),
      userId: uid 
    };

    const result = await checkinsCollection.insertOne(checkinData);

    const entries = await journalCollection
      .find({ uid })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    const aiEnabled = await isAIAnalysisEnabled(uid);

    let feedback;
    if (aiEnabled) {
      feedback = await generateReflectionFeedback(reflection, entries);
    } else {
      feedback = {
        feedback: 'Thank you for your weekly reflection. Your thoughts are being stored securely.',
        key_insight: 'Your weekly check-in has been recorded.',
        next_focus: 'Continue your journey of self-reflection.'
      };
    }

    res.status(201).json({
      message: 'Reflection analyzed and saved',
      id: result.insertedId,
      feedback,
      saved: checkinData
    });
  } catch (err) {
    console.error('analyzeReflection error:', err);
    res.status(500).json({ error: err.message });
  }
};

async function generateReflectionFeedback(reflection, recentEntries) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  const prompt = `Provide brief, encouraging feedback on this weekly check-in reflection.

Reflection: "${reflection}"

${recentEntries.length > 0 ? `Recent journal context: ${recentEntries.map(e => e.analysis?.summary || e.entry.substring(0, 50)).join('; ')}` : ''}

Return JSON with: {feedback: string, key_insight: string, next_focus: string}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-03-15-preview`;

  const response = await axios.post(
    url,
    {
      messages: [
        { role: 'system', content: 'You are a supportive reflection coach providing brief, encouraging feedback.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7,
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  return JSON.parse(content);
}

function extractThemesFromText(text) {
  const themes = [];
  const lowerText = text.toLowerCase();

  const themeKeywords = {
    gratitude: ['grateful', 'thankful', 'appreciate', 'blessed'],
    growth: ['learn', 'grow', 'develop', 'change', 'improve'],
    relationships: ['friend', 'family', 'love', 'relationship', 'connect'],
    work: ['work', 'job', 'career', 'stress', 'busy', 'tired'],
    health: ['health', 'body', 'exercise', 'sleep', 'energy', 'well'],
    creativity: ['create', 'art', 'music', 'write', 'inspire'],
    mindfulness: ['present', 'mindful', 'aware', 'breathe', 'meditate'],
    challenges: ['difficult', 'hard', 'struggle', 'challenge', 'overcome']
  };

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      themes.push(theme);
    }
  });

  return themes.length > 0 ? themes : ['reflection'];
}