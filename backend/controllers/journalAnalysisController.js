import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whispr';
const AZURE_FUNCTION_URL = process.env.AZURE_FUNCTION_URL;
const AZURE_FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

let client;
let collection;

async function connectDB() {
  if (!client) {
    client = new MongoClient(COSMOSDB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    collection = client.db(COSMOSDB_DBNAME).collection('journalEntries');
  }
}

export const analyzeJournal = async (req, res) => {
  const { entry, text, uid, tags } = req.body || {};
  const journalText = entry || text;
  if (!journalText) return res.status(400).json({ error: 'Journal text required.' });

  let analysis;
  let usedFallback = false;

  if (AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT) {
    try {
      const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`;
      
      const systemMessage = `You are an assistant that analyzes a short personal journal entry.\nRespond with a single JSON object only, with keys: \n- "sentiment": one of ["very_positive","positive","neutral","negative","very_negative"],\n- "emotions": an array of 1-5 brief emotion words,\n- "mood": a number from 1 to 10 representing the person's overall mood (1=very sad/depressed, 10=extremely happy/ecstatic),\n- "summary": a one-sentence summary.\nDo not output any other text.`;
      const payload = {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: journalText }
        ],
        max_tokens: 200,
        temperature: 0.2
      };

      const resp = await axios.post(url, payload, {
        headers: {
          'api-key': AZURE_OPENAI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      let modelOutput = null;
      if (resp.data) {
        if (resp.data.choices && resp.data.choices[0]) {
          modelOutput = resp.data.choices[0].message?.content || resp.data.choices[0].text || null;
        } else if (resp.data.output) {
          modelOutput = resp.data.output[0]?.content?.[0]?.text || null;
        }
      }

      if (!modelOutput) throw new Error('No model output');

      try {
        analysis = JSON.parse(modelOutput);
      } catch (err) {
        const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
          } catch (err2) {
            console.warn('analyzeJournal: failed to parse JSON substring, falling back to text summary');
            analysis = { sentiment: 'neutral', emotions: [], mood: 5, summary: String(modelOutput).slice(0, 300) };
            usedFallback = true;
          }
        } else {
          analysis = { sentiment: 'neutral', emotions: [], mood: 5, summary: String(modelOutput).slice(0, 300) };
          usedFallback = true;
        }
      }

    } catch (err) {
      console.error('analyzeJournal: Azure OpenAI call failed:', err.message);
      if (err.response) {
        console.error('analyzeJournal: OpenAI response status:', err.response.status);
        console.error('analyzeJournal: OpenAI response data:', err.response.data);
      }
      usedFallback = true;
      analysis = { sentiment: 'neutral', emotions: ['calmness'], mood: 5, summary: 'No AI analysis available. This is a mock response.' };
    }

  } else if (AZURE_FUNCTION_URL) {
    try {
      const response = await axios.post(
        AZURE_FUNCTION_URL,
        { text: journalText },
        {
          headers: {
            'x-functions-key': AZURE_FUNCTION_KEY || '',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      analysis = response.data;
    } catch (err) {
      console.error('analyzeJournal: Azure Function call failed:', err.message);
      usedFallback = true;
      analysis = { sentiment: 'neutral', emotions: ['calmness'], mood: 5, summary: 'No AI analysis available. This is a mock response.' };
    }

  } else {
    console.warn('analyzeJournal: No AI integration configured — will try DB lookup before using mock');
    usedFallback = true;
  }

  if (usedFallback) {
    try {
      await connectDB();
      let prev = null;
      try {
        prev = await collection.findOne({ text: String(journalText) });
      } catch (e) {
        console.warn('analyzeJournal: text-match lookup failed:', e.message || e);
      }
      if (!prev && uid) {
        try {
          prev = await collection.findOne({ uid: uid, analysis: { $exists: true } }, { sort: { createdAt: -1 } });
        } catch (e) {
          console.warn('analyzeJournal: uid-based lookup failed:', e.message || e);
        }
      }
      if (prev && prev.analysis) {
        analysis = prev.analysis;
        usedFallback = 'db';
      } else {
        analysis = { sentiment: 'neutral', emotions: ['calmness'], mood: 5, summary: 'No AI analysis available. This is a mock response.' };
        console.warn('analyzeJournal: no prior analysis found in DB; using generic mock');
      }
    } catch (err) {
      console.error('analyzeJournal: DB lookup during fallback failed:', err.message || err);
      analysis = { sentiment: 'neutral', emotions: ['calmness'], mood: 5, summary: 'No AI analysis available. This is a mock response.' };
    }
  }

  let savedId = null;
  try {
    await connectDB();
    const item = { 
      uid: uid || null, 
      text: journalText, 
      tags: Array.isArray(tags) ? tags : [], 
      analysis, 
      createdAt: new Date() 
    };
    const result = await collection.insertOne(item);
    savedId = result.insertedId;
  } catch (err) {
    console.error('analyzeJournal: MongoDB save failed:', err.message);
    if (err.stack) console.error(err.stack);
  }

  const responsePayload = { ...(analysis || {}) };
  if (savedId) responsePayload.id = savedId;
  if (usedFallback) responsePayload.warning = 'AI analysis used fallback/mock result.';

  if ((AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT) && usedFallback && !savedId) {
    return res.status(502).json({ error: 'Failed to analyze and save entry. See server logs for details.', ...responsePayload });
  }

  return res.status(200).json(responsePayload);
};