import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Plus, Tag, Smile, Frown, Meh, Zap, Coffee, Moon, Sun } from 'lucide-react';
import { getNewMilestones, markMilestonesAsSeen, getSeenMilestones } from '../utils/milestones.js';
import { syncGoalsWithEntries } from '../utils/customGoals.js';
import MilestoneCelebrationModal from './MilestoneCelebrationModal.jsx';
const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

export default function JournalEntryForm() {
  const [entry, setEntry] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [privacySettings, setPrivacySettings] = useState({
    aiAnalysisEnabled: true,
    analyticsEnabled: true,
    dataRetention: 'forever',
    autoBackup: true,
    exportFormat: 'json'
  });
  const { user } = useAuth();
  const [newMilestones, setNewMilestones] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const uid = user?.uid || user?.id;
        if (!uid) return;
        
        const res = await fetch(`${API_BASE}/api/profile/privacy?uid=${uid}`);
        if (res.ok) {
          const settings = await res.json();
          setPrivacySettings(settings);
        }
      } catch (error) {
        console.error('Error loading privacy settings from backend:', error);
        const storedSettings = localStorage.getItem('privacySettings');
        if (storedSettings) {
          try {
            const parsedSettings = JSON.parse(storedSettings);
            setPrivacySettings(parsedSettings);
          } catch (localError) {
            console.error('Error parsing localStorage privacy settings:', localError);
          }
        }
      }
    };

    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitEntry(entry, tags);
  };

  const submitEntry = async (entryText, tagsArray = []) => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    const currentUser = user;
    if (!currentUser) {
      setError('You must be logged in to submit a journal entry.');
      setLoading(false);
      return;
    }
    try {
      const endpoint = privacySettings.aiAnalysisEnabled 
        ? `${API_BASE}/api/analyze-journal`
        : `${API_BASE}/api/journal/entry`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid || currentUser.id, entry: entryText, tags: tagsArray }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save journal entry.');
      }
      
      const result = await res.json();

      if (privacySettings.aiAnalysisEnabled) {
        const normalized = {
          sentiment: result.sentiment,
          emotions: result.emotions,
          mood: result.mood,
          summary: result.summary
        };
        if (normalized.emotions && !Array.isArray(normalized.emotions)) {
          normalized.emotions = Array.isArray(normalized.emotions.split)
            ? normalized.emotions.split(/,\s*/)
            : [String(normalized.emotions)];
        }
        setAnalysis(normalized);
      } else {
        setAnalysis({ 
          sentiment: 'Not analyzed', 
          emotions: ['Privacy protected'], 
          summary: 'Entry saved without AI analysis per your privacy settings.' 
        });
      }
      
  setEntry('');
  setTags([]);
  setCharCount(0);

      if (currentUser) {
        localStorage.setItem(`last-journal-${currentUser.uid || currentUser.id}`, new Date().toISOString());
      }

      try {
        const uid = currentUser.uid || currentUser.id;
        const statsRes = await fetch(`${API_BASE}/api/profile/stats?uid=${uid}`);
        if (statsRes.ok) {
          const updatedStats = await statsRes.json();
          const seenMilestones = getSeenMilestones();
          const newAchievements = getNewMilestones(updatedStats, seenMilestones);
          if (newAchievements.length > 0) {
            setNewMilestones(newAchievements);
            setShowMilestoneModal(true);
          }
        }
      } catch (milestoneError) {
        console.error('Error checking milestones:', milestoneError);
      }

      try {
        const uid = currentUser.uid || currentUser.id;

        const entriesRes = await fetch(`${API_BASE}/api/trends?uid=${uid}`);
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          if (Array.isArray(entries) && entries.length > 0) {
            await syncGoalsWithEntries(uid, entries);
          }
        }
      } catch (goalError) {
        console.error('Error syncing goals:', goalError);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emotionOptions = [
    { key: 'joy', label: 'Joy', emoji: '😊', icon: <Smile className="w-5 h-5" />, mood: 9 },
    { key: 'content', label: 'Content', emoji: '🙂', icon: <Sun className="w-5 h-5" />, mood: 7 },
    { key: 'neutral', label: 'Neutral', emoji: '😐', icon: <Meh className="w-5 h-5" />, mood: 5 },
    { key: 'sad', label: 'Sad', emoji: '😔', icon: <Frown className="w-5 h-5" />, mood: 3 },
    { key: 'stressed', label: 'Stressed', emoji: '😖', icon: <Zap className="w-5 h-5" />, mood: 2 },
    { key: 'tired', label: 'Tired', emoji: '😴', icon: <Moon className="w-5 h-5" />, mood: 2 },
    { key: 'calm', label: 'Calm', emoji: '☕', icon: <Coffee className="w-5 h-5" />, mood: 6 }
  ];

  const quickCheckin = async (emotion) => {
    const quickText = `Today I feel: ${emotion.label} ${emotion.emoji || ''}`;
    setEntry(quickText);
    setCharCount(quickText.length);
    await submitEntry(quickText, []);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/30">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {emotionOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => quickCheckin(opt)}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/90 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-full hover:scale-105 transform transition-all duration-300 shadow-sm border border-rose-200/50 dark:border-rose-800/30"
              aria-label={`Quick check-in ${opt.label}`}
            >
              <span className="text-base">{opt.icon}</span>
              <span className="text-sm hidden sm:inline text-rose-700 dark:text-rose-200">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-3">
          <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">A gentle space to reflect</h3>
          <textarea
            value={entry}
            onChange={e => { setEntry(e.target.value); setCharCount(e.target.value.length); }}
            rows={6}
            className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
            placeholder="Share something small or big — whatever feels right. You can write a few words, a memory, or how you're feeling right now."
            required
          />
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <div>Take your time — there's no right or wrong way to journal.</div>
            <div>{charCount} chars</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Tag className="w-4 h-4 mr-2" />
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-900/30 rounded-full p-1 transition-all duration-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Add a tag (e.g., work, family, health)"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-rose-100/80 dark:bg-rose-900/40 hover:bg-rose-200/90 dark:hover:bg-rose-800/60 text-rose-600 dark:text-rose-300 rounded-lg font-medium transition-all duration-300 border border-rose-200/50 dark:border-rose-700/30 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Press Enter or click + to add tags</p>
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400/90 to-pink-400/90 dark:from-rose-500/80 dark:to-pink-500/80 hover:from-rose-500/95 hover:to-pink-500/95 dark:hover:from-rose-400/90 dark:hover:to-pink-400/90 disabled:from-rose-200/60 disabled:to-pink-200/60 dark:disabled:from-rose-800/40 dark:disabled:to-pink-800/40 text-white rounded-2xl font-medium transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-rose-300/50 dark:border-rose-600/30 backdrop-blur-sm">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Submit Entry</span>
            </>
          )}
        </button>
        {error && <div className="mt-4 text-red-600 dark:text-red-400">{error}</div>}
      </form>
      
      {analysis && (
        <div className="mt-8 p-6 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/30">
          <h2 className="text-xl font-light mb-4 text-slate-900 dark:text-white">Mood Analysis</h2>
          <div className="space-y-3">
            <div className="text-slate-700 dark:text-slate-300"><strong className="text-rose-600 dark:text-rose-400">Sentiment:</strong> {analysis.sentiment}</div>
            {analysis.mood && <div className="text-slate-700 dark:text-slate-300"><strong className="text-rose-600 dark:text-rose-400">Mood:</strong> {analysis.mood}/10</div>}
            <div className="text-slate-700 dark:text-slate-300"><strong className="text-rose-600 dark:text-rose-400">Emotions:</strong> {Array.isArray(analysis.emotions) ? analysis.emotions.join(', ') : analysis.emotions}</div>
            <div className="mt-4 p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-800/30">
              <div className="text-slate-700 dark:text-slate-300"><strong className="text-rose-600 dark:text-rose-400">Summary:</strong> {analysis.summary}</div>
            </div>
          </div>
        </div>
      )}

      {showMilestoneModal && newMilestones.length > 0 && (
        <MilestoneCelebrationModal
          milestones={newMilestones}
          onClose={() => setShowMilestoneModal(false)}
          onMarkAsSeen={(milestoneIds) => {
            markMilestonesAsSeen(milestoneIds);
            setNewMilestones([]);
          }}
        />
      )}
    </div>
  );
}