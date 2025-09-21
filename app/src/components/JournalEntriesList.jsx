import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/themeContext';
import { Filter, X, Calendar, Tag, Heart, Brain, Sparkles } from 'lucide-react';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const getSentimentColor = (sentiment, isDark) => {
  const lightColors = {
    'Very Positive': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Positive': 'text-green-600 bg-green-50 border-green-200',
    'Neutral': 'text-slate-600 bg-slate-50 border-slate-200',
    'Negative': 'text-orange-600 bg-orange-50 border-orange-200',
    'Very Negative': 'text-red-600 bg-red-50 border-red-200'
  };
  
  const darkColors = {
    'Very Positive': 'text-emerald-400 bg-emerald-950/50 border-emerald-800',
    'Positive': 'text-green-400 bg-green-950/50 border-green-800',
    'Neutral': 'text-slate-400 bg-slate-800/50 border-slate-700',
    'Negative': 'text-orange-400 bg-orange-950/50 border-orange-800',
    'Very Negative': 'text-red-400 bg-red-950/50 border-red-800'
  };
  
  return isDark ? darkColors[sentiment] || darkColors['Neutral'] : lightColors[sentiment] || lightColors['Neutral'];
};

const getSentimentIcon = (sentiment) => {
  if (sentiment?.includes('Positive')) return <Sparkles className="w-4 h-4" />;
  if (sentiment === 'Negative') return <Heart className="w-4 h-4" />;
  return <Brain className="w-4 h-4" />;
};

export default function JournalEntriesList() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const eventSourceRef = useRef(null);
  const isConnectingRef = useRef(false);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    const loadExistingEntries = async (uid) => {
      try {
        console.log('JournalEntriesList: Loading existing entries for user:', uid);
        const response = await fetch(`${API_BASE}/api/journal/${uid}`);
        if (response.ok) {
          const existingEntries = await response.json();
          console.log('JournalEntriesList: Loaded', existingEntries.length, 'existing entries');
          setEntries(existingEntries.map(entry => ({ 
            id: entry._id || entry.id, 
            ...entry 
          })));
        } else {
          console.error('JournalEntriesList: Failed to load existing entries:', response.status);
        }
      } catch (error) {
        console.error('JournalEntriesList: Error loading existing entries:', error);
      }
    };

    const startStream = (uid) => {
      if (eventSourceRef.current || isConnectingRef.current) {
        console.log('JournalEntriesList: Connection already exists, skipping');
        return;
      }
      
      console.log('JournalEntriesList: Starting stream for user:', uid);
      isConnectingRef.current = true;
      
      try {
        const es = new EventSource(`${API_BASE}/api/journal/stream/${uid}`);
        eventSourceRef.current = es;
        currentUserIdRef.current = uid;
        
        es.onmessage = (ev) => {
          try {
            const doc = JSON.parse(ev.data);
            console.log('JournalEntriesList: Received new entry:', doc._id || doc.id);
            setEntries(prev => {
              const exists = prev.some(p => String(p._id || p.id) === String(doc._id || doc.id));
              if (exists) {
                console.log('JournalEntriesList: Entry already exists, skipping');
                return prev;
              }
              return [{ id: doc._id || doc.id, ...doc }, ...prev];
            });
            setLoading(false);
          } catch (e) {
            console.error('JournalEntriesList: failed to parse SSE data', e.message || e);
          }
        };
        
        es.onerror = (err) => {
          console.error('JournalEntriesList: SSE error:', err);
        };
        
        es.onopen = () => {
          console.log('JournalEntriesList: EventSource connection opened');
          isConnectingRef.current = false;
          setLoading(false);
        };
        
      } catch (err) {
        console.error('JournalEntriesList: failed to start EventSource', err.message || err);
        isConnectingRef.current = false;
        setLoading(false);
      }
    };

    const startWithHealth = async (uid, attempts = 0) => {
      console.log('JournalEntriesList: Starting health check for user:', uid);
      try {
        const resp = await fetch(`${API_BASE}/api/health`);
        if (resp.ok) {
          console.log('JournalEntriesList: Health check passed, loading entries and starting stream');
          await loadExistingEntries(uid);
          return startStream(uid);
        }
        throw new Error('health check failed');
      } catch (error) {
        console.error('JournalEntriesList: Health check failed:', error);
        const max = 5;
        const backoff = Math.min(2000 * (attempts + 1), 10000);
        if (attempts < max) {
          console.warn('JournalEntriesList: health check failed, retrying in', backoff, 'ms');
          setTimeout(() => startWithHealth(uid, attempts + 1), backoff);
        } else {
          console.error('JournalEntriesList: health check failed after retries');
          setLoading(false);
          isConnectingRef.current = false;
        }
      }
    };

    console.log('JournalEntriesList: Current user object:', user);
    const userId = user?.uid || user?.id;
    console.log('JournalEntriesList: User ID check:', userId);
    
    if (user && userId) {
      if (currentUserIdRef.current !== userId || !eventSourceRef.current) {
        
        if (eventSourceRef.current && currentUserIdRef.current !== userId) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        startWithHealth(userId);
      } else {
        console.log('JournalEntriesList: Connection already active for this user');
        setLoading(false);
      }
    } else {
      console.log('JournalEntriesList: No valid user found, stopping loading');
      setLoading(false);
    }

    return () => { 
      // Cleanup function - only close if component is unmounting
    };
  }, [user]);

  useEffect(() => {
    return () => {
      console.log('JournalEntriesList: Component unmounting, cleaning up connections');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      isConnectingRef.current = false;
      currentUserIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const allTags = new Set();
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => allTags.add(tag));
      }
    });
    setAvailableTags(Array.from(allTags).sort());

    if (selectedTags.length === 0) {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => {
        if (!entry.tags || !Array.isArray(entry.tags)) return false;
        return selectedTags.every(selectedTag => entry.tags.includes(selectedTag));
      });
      setFilteredEntries(filtered);
    }
  }, [entries, selectedTags]);

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
  };

  if (loading) return (
    <div className="mt-8 space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20 animate-pulse"></div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5 animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5 animate-pulse"></div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16 animate-pulse"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!entries.length) return (
    <div className="mt-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No journal entries yet</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Start your journaling journey by writing your first entry.</p>
    </div>
  );

  return (
    <div className="mt-8">
      {availableTags.length > 0 && (
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filter Entries</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Find entries by tags</p>
                </div>
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-0'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Tag className="w-3 h-3 mr-1.5" />
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="w-3 h-3 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
            
            {selectedTags.length > 0 && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Showing {filteredEntries.length} of {entries.length} entries</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredEntries.map(entry => (
          <div key={entry.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(entry.createdAt?.seconds ? entry.createdAt.seconds * 1000 : entry.createdAt).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      {new Date(entry.createdAt?.seconds ? entry.createdAt.seconds * 1000 : entry.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {entry.analysis && (
                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getSentimentColor(entry.analysis.sentiment, isDark)}`}>
                    {getSentimentIcon(entry.analysis.sentiment)}
                    <span>{entry.analysis.sentiment}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none mb-4">
                <p className="text-slate-900 dark:text-slate-100 leading-relaxed text-base">
                  {entry.entry || entry.text}
                </p>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {entry.tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 hover:scale-105"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              
              {entry.analysis && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-950/20 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Heart className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Emotions</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(entry.analysis.emotions) ? entry.analysis.emotions : [entry.analysis.emotions]).map((emotion, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 text-xs rounded-full border border-pink-200 dark:border-pink-800">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Summary</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{entry.analysis.summary}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}