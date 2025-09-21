import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const express = (await import('express')).default;
const cors = (await import('cors')).default;
const admin = (await import('firebase-admin')).default;
const journalRouter = (await import('./routes/journal.js')).default;
const journalAnalysisRouter = (await import('./routes/journalAnalysis.js')).default;
const trendsRouter = (await import('./routes/trends.js')).default;
const profileRouter = (await import('./routes/profile.js')).default;
const weeklyCheckinRouter = (await import('./routes/weeklyCheckin.js')).default;
const goalsRouter = (await import('./routes/goals.js')).default;
const backupRouter = (await import('./routes/backup.js')).default;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const { default: mongodb } = await import('mongodb');
    const uri = process.env.COSMOSDB_URI;
    if (!uri) return res.status(500).json({ ok: false, error: 'COSMOSDB_URI not configured' });
    const client = new mongodb.MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    try {
      await client.connect();
      await client.db(process.env.COSMOSDB_DBNAME || 'whisprlog').command({ ping: 1 });
      res.json({ ok: true });
    } finally {
      try { await client.close(); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err && err.message ? err.message : 'unknown' });
  }
});

import fs from 'fs';
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
} else {
  console.warn('serviceAccountKey.json not found — skipping Firebase Admin initialization.');
}

app.get('/', (req, res) => {
  res.send('Whisprlog Backend Running');
});

app.use('/api/journal', journalRouter);
app.use('/api/analyze-journal', journalAnalysisRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/weekly-checkin', weeklyCheckinRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/backup', backupRouter);

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await admin.auth().createUser({ email, password });
    res.status(201).json({ uid: user.uid, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  res.status(501).json({ error: 'Login with email/password should be handled client-side. Send ID token to backend for verification.' });
});

app.post('/auth/anonymous', async (req, res) => {
  try {
    const user = await admin.auth().createUser({});
    res.status(201).json({ uid: user.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
});
