import PDFDocument from 'pdfkit';
import { MongoClient, ObjectId } from 'mongodb';
import admin from 'firebase-admin';

const COSMOSDB_URI = process.env.COSMOSDB_URI;
const COSMOSDB_DBNAME = process.env.COSMOSDB_DBNAME || 'whisprlog';

let client;
let collection;
let privacyCollection;

async function connectDB() {
  if (!client) {
    if (!COSMOSDB_URI) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(COSMOSDB_URI);
    try {
      await client.connect();
      const db = client.db(COSMOSDB_DBNAME);
      collection = db.collection('journalEntries');
      privacyCollection = db.collection('privacySettings');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err && err.message ? err.message : err);
      throw err;
    }
  }
  if (!collection || !privacyCollection) {
    const db = client.db(COSMOSDB_DBNAME);
    collection = db.collection('journalEntries');
    privacyCollection = db.collection('privacySettings');
  }
}

async function getUserStatsData(uid) {
  try {
    await connectDB();
    if (!collection) throw new Error('DB collection not initialized');

    const entries = await collection.find({ uid }).sort({ createdAt: -1 }).toArray();

    if (entries.length === 0) {
      return {
        total_entries: 0,
        avg_mood: 0,
        most_common_emotion: null,
        streak_days: 0,
        join_date: null,
        most_common_tags: []
      };
    }

    const moods = entries.map(e => e.analysis?.mood || 5).filter(m => m !== null);
    const avg_mood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;

    const emotions = entries.flatMap(e => e.analysis?.emotions || []).filter(Boolean);
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});
    const most_common_emotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    const tags = entries.flatMap(e => e.tags || []).filter(Boolean);
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const most_common_tags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const uniqueDates = [...new Set(entries.map(e => new Date(e.createdAt).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;

    if (uniqueDates.length > 0) {
      const mostRecentDate = new Date(uniqueDates[0]);
      const today = new Date();
      const daysSinceLastEntry = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));

      if (daysSinceLastEntry <= 1) {
        streak = 1;
        let checkDate = new Date(mostRecentDate);

        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const checkDateString = checkDate.toDateString();

          if (uniqueDates.includes(checkDateString)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const join_date = entries[entries.length - 1]?.createdAt;

    const entriesByDate = entries.reduce((acc, entry) => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {});

    const multipleEntryDays = Object.values(entriesByDate).filter(dayEntries => dayEntries.length > 1).length;
    const totalDays = Object.keys(entriesByDate).length;
    const avgEntriesPerDay = totalDays > 0 ? (entries.length / totalDays).toFixed(1) : 0;

    return {
      total_entries: entries.length,
      avg_mood,
      most_common_emotion,
      most_common_tags,
      streak_days: streak,
      join_date,
      multiple_entry_days: multipleEntryDays,
      avg_entries_per_day: parseFloat(avgEntriesPerDay)
    };
  } catch (err) {
    console.error('Error calculating user stats:', err);
    return {
      total_entries: 0,
      avg_mood: 0,
      most_common_emotion: null,
      streak_days: 0,
      join_date: null,
      most_common_tags: []
    };
  }
}

export const exportEntries = async (req, res) => {
  const { uid, format } = req.query;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
    if (!collection) throw new Error('DB collection not initialized');

    const resources = await collection.find({ uid }).sort({ createdAt: -1 }).toArray();

    const stats = await getUserStatsData(uid);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'WhisprLog Journal Report',
        Author: 'WhisprLog',
        Subject: 'Personal Journal Analytics Report'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=whisprlog-report-${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('WhisprLog', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Personal Journal Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');

    const summaryData = [
      ['Total Entries', stats.total_entries || 0],
      ['Average Mood', `${(stats.avg_mood || 0).toFixed(1)}/10`],
      ['Current Streak', `${stats.streak_days || 0} days`],
      ['Most Common Emotion', stats.most_common_emotion || 'N/A'],
      ['Join Date', stats.join_date ? new Date(stats.join_date).toLocaleDateString() : 'N/A']
    ];

    summaryData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
      doc.moveDown(0.3);
    });

    doc.moveDown();

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold').text('Mood Trends & Analytics');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');

    if (resources.length > 0) {
      const moodCounts = {};
      resources.forEach(entry => {
        const mood = entry.analysis?.mood || 5;
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });

      doc.text('Mood Distribution:');
      doc.moveDown(0.5);

      Object.entries(moodCounts)
        .sort(([a], [b]) => Number(b) - Number(a))
        .forEach(([mood, count]) => {
          const percentage = ((count / resources.length) * 100).toFixed(1);
          doc.text(`Mood ${mood}/10: ${count} entries (${percentage}%)`);
        });

      doc.moveDown();

      if (stats.most_common_emotion) {
        doc.text(`Your most common emotion has been: ${stats.most_common_emotion}`);
        doc.moveDown();
      }

      if (stats.most_common_tags && stats.most_common_tags.length > 0) {
        doc.text('Your most used tags:');
        stats.most_common_tags.slice(0, 5).forEach(({ tag, count }) => {
          doc.text(`#${tag}: ${count} entries`);
        });
        doc.moveDown();
      }
    }

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold').text('Journal Entries');
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');

    const entriesByDate = {};
    resources.forEach(entry => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      entriesByDate[dateKey].push(entry);
    });

    const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(b) - new Date(a));

    let entryIndex = 1;
    sortedDates.slice(0, 20).forEach(dateKey => {
      const dateEntries = entriesByDate[dateKey];
      const displayDate = new Date(dateKey).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });

      if (doc.y > 650) {
        doc.addPage();
      }

      doc.font('Helvetica-Bold').fontSize(12).text(displayDate);
      if (dateEntries.length > 1) {
        doc.font('Helvetica').fontSize(9).text(`(${dateEntries.length} entries this day)`);
      }
      doc.moveDown(0.5);

      dateEntries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      dateEntries.forEach((entry, dayIndex) => {
        if (doc.y > 650) {
          doc.addPage();
        }

        const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        doc.font('Helvetica-Bold').fontSize(10);
        if (dateEntries.length > 1) {
          doc.text(`${entryIndex}. ${time}`);
        } else {
          doc.text(`${entryIndex}. ${displayDate} at ${time}`);
        }
        doc.font('Helvetica').moveDown(0.3);

        const content = entry.entry || '';
        const truncatedContent = content.length > 250 ? content.substring(0, 250) + '...' : content;
        doc.text(truncatedContent);
        doc.moveDown(0.3);

        if (entry.analysis) {
          const analysis = [];
          if (entry.analysis.sentiment) analysis.push(`Sentiment: ${entry.analysis.sentiment}`);
          if (entry.analysis.mood) analysis.push(`Mood: ${entry.analysis.mood}/10`);
          if (entry.analysis.emotions && entry.analysis.emotions.length > 0) {
            analysis.push(`Emotions: ${entry.analysis.emotions.join(', ')}`);
          }
          if (entry.analysis.summary) analysis.push(`Summary: ${entry.analysis.summary}`);

          if (analysis.length > 0) {
            doc.fontSize(8).font('Helvetica-Oblique').text(analysis.join(' | '));
            doc.fontSize(10).font('Helvetica').moveDown(0.5);
          }
        }

        if (entry.tags && entry.tags.length > 0) {
          doc.fontSize(8).text(`Tags: ${entry.tags.join(', ')}`);
          doc.moveDown(0.8);
        } else {
          doc.moveDown(0.5);
        }

        entryIndex++;
      });

      doc.moveDown(0.5);
    });

    if (sortedDates.length > 20) {
      doc.font('Helvetica-Oblique').text(`... and ${sortedDates.length - 20} more days with entries`);
    }

    doc.end();

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report.' });
  }
};

export const getUserStats = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
    if (!collection) throw new Error('DB collection not initialized');
    
    const entries = await collection.find({ uid }).sort({ createdAt: -1 }).toArray();
    
    if (entries.length === 0) {
      return res.json({
        total_entries: 0,
        avg_mood: 0,
        most_common_emotion: null,
        streak_days: 0,
        join_date: null
      });
    }
    
    const moods = entries.map(e => e.analysis?.mood || 5).filter(m => m !== null);
    const avg_mood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;
    
    const emotions = entries.flatMap(e => e.analysis?.emotions || []).filter(Boolean);
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});
    const most_common_emotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || null;
    
    const tags = entries.flatMap(e => e.tags || []).filter(Boolean);
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const most_common_tags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    const uniqueDates = [...new Set(entries.map(e => new Date(e.createdAt).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    
    if (uniqueDates.length > 0) {
      const mostRecentDate = new Date(uniqueDates[0]);
      const today = new Date();
      const daysSinceLastEntry = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastEntry <= 1) {
        streak = 1;
        let checkDate = new Date(mostRecentDate);
        
        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const checkDateString = checkDate.toDateString();
          
          if (uniqueDates.includes(checkDateString)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    const join_date = entries[entries.length - 1]?.createdAt;
    
    const entriesByDate = entries.reduce((acc, entry) => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {});

    const multipleEntryDays = Object.values(entriesByDate).filter(dayEntries => dayEntries.length > 1).length;
    const totalDays = Object.keys(entriesByDate).length;
    const avgEntriesPerDay = totalDays > 0 ? (entries.length / totalDays).toFixed(1) : 0;
    
    res.json({
      total_entries: entries.length,
      avg_mood,
      most_common_emotion,
      most_common_tags,
      streak_days: streak,
      join_date,
      multiple_entry_days: multipleEntryDays,
      avg_entries_per_day: parseFloat(avgEntriesPerDay)
    });
  } catch (err) {
    console.error('Error fetching user stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch user stats.' });
  }
};

export const deleteAccount = async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
    if (!collection) throw new Error('DB collection not initialized');
    const resources = await collection.find({ uid }).project({ _id: 1 }).toArray();
    for (const entry of resources) {
      await collection.deleteOne({ _id: entry._id });
    }
    await privacyCollection.deleteOne({ uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
};

export const getPrivacySettings = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
    if (!privacyCollection) throw new Error('Privacy collection not initialized');
    
    const settings = await privacyCollection.findOne({ uid });
    if (settings) {
      const { _id, ...privacySettings } = settings;
      res.json(privacySettings);
    } else {
      res.json({
        aiAnalysisEnabled: true,
        analyticsEnabled: true,
        dataRetention: 'forever',
        autoBackup: true,
        exportFormat: 'json',
        weeklyReminders: false
      });
    }
  } catch (err) {
    console.error('Error fetching privacy settings:', err.message);
    res.status(500).json({ error: 'Failed to fetch privacy settings.' });
  }
};

export const savePrivacySettings = async (req, res) => {
  const { uid, ...settings } = req.body;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  try {
    await connectDB();
    if (!privacyCollection) throw new Error('Privacy collection not initialized');
    
    await privacyCollection.updateOne(
      { uid },
      { 
        $set: { 
          ...settings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving privacy settings:', err.message);
    res.status(500).json({ error: 'Failed to save privacy settings.' });
  }
};

export const updateUserProfile = async (req, res) => {
  const { uid, name } = req.body;
  if (!uid) return res.status(400).json({ error: 'User ID required.' });
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name is required.' });

  try {
    await admin.auth().updateUser(uid, {
      displayName: name.trim()
    });

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
};