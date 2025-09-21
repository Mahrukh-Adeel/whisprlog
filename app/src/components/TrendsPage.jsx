import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Heart, Calendar, BarChart3, PieChart, Activity, Smile, Frown, Meh, Brain, Target, Clock, Zap, Sparkles, AlertTriangle, CheckCircle, Lightbulb, Thermometer, Wind, Moon, Sun, Users, Briefcase, Coffee, Shield, User, Link } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CustomGoals from './CustomGoals.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const TrendsPage = () => {
  const [timeframe, setTimeframe] = useState('month');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const [privacySettings, setPrivacySettings] = useState({
    aiAnalysisEnabled: true,
    analyticsEnabled: true,
    dataRetention: 'forever',
    autoBackup: true,
    exportFormat: 'json'
  });

  const [deepInsights, setDeepInsights] = useState({
    emotionalVelocity: 0,
    resilienceScore: 0,
    circadianRhythm: {},
    predictiveInsights: [],
    correlations: {},
    archetypes: [],
    seasonalPatterns: {},
    socialImpact: 0,
    productivityCorrelation: 0
  });
  const [personalizedPrompts, setPersonalizedPrompts] = useState([]);
  const [triggerAnalysis, setTriggerAnalysis] = useState(null);
  const [personalizedInsights, setPersonalizedInsights] = useState(null);

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

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchTrends = async () => {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');
      try {
        if (!privacySettings.analyticsEnabled) {
          setError('Analytics are disabled in your privacy settings. Enable analytics to view trends.');
          if (isInitialLoad) setLoading(false);
          setRefreshing(false);
          return;
        }

        const uid = user?.uid || user?.id;
        if (!uid) {
          setError('User not authenticated');
          if (isInitialLoad) setLoading(false);
          setRefreshing(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/journal/trends/${uid}`);
        if (!res.ok) throw new Error('Failed to fetch trends');
        const data = await res.json();

        const mapped = data.entries.map(entry => ({
          date: new Date(entry.fullDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          mood: entry.mood,
          sentiment: entry.sentiment,
          emotions: entry.emotions,
          fullDate: entry.fullDate,
          content: entry.content
        }));

        setData(mapped);

        if (data.aiAnalysis) {
          setDeepInsights({
            patterns: {
              emotionalVelocity: data.aiAnalysis.emotional_velocity || 0,
              resilienceScore: data.aiAnalysis.resilience_score || 0,
              circadianRhythm: data.aiAnalysis.circadian_patterns || {},
              correlations: data.aiAnalysis.correlation_insights || {}
            },
            predictiveInsights: data.aiAnalysis.predictive_insights || [],
            emotionalArchetypes: [data.aiAnalysis.emotional_archetype].filter(Boolean),
            aiRecommendations: data.aiAnalysis.personalized_recommendations || [],
            dominantThemes: data.aiAnalysis.dominant_themes || [],
            overallTrend: data.aiAnalysis.overall_trend || 'stable',
            lastCalculated: new Date().toISOString()
          });
        }

        if (data.personalizedPrompts) {
          setPersonalizedPrompts(data.personalizedPrompts);
        }

        if (data.triggerAnalysis) {
          setTriggerAnalysis(data.triggerAnalysis);
        }

        if (data.personalizedInsights) {
          setPersonalizedInsights(data.personalizedInsights);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
        setRefreshing(false);
      }
    };
    
    if (user) {
      fetchTrends();
      if (privacySettings.analyticsEnabled) {
        const interval = setInterval(fetchTrends, 5 * 60 * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [timeframe, user, privacySettings.analyticsEnabled]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-300 dark:border-rose-700 border-t-rose-400 dark:border-t-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  const avgMood = data.length ? Math.round((data.reduce((sum, item) => sum + item.mood, 0) / data.length) * 10) / 10 : 0;
  
  const sentimentCounts = data.reduce((acc, item) => {
    acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    return acc;
  }, {});
  
  const dominantSentiment = Object.entries(sentimentCounts).sort(([,a], [,b]) => b - a)[0] || ['neutral', 0];
  
  const emotionCounts = data.reduce((acc, item) => {
    item.emotions.forEach(emotion => {
      acc[emotion] = (acc[emotion] || 0) + 1;
    });
    return acc;
  }, {});
  
  const topEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4" />;
      case 'negative': return <Frown className="w-4 h-4" />;
      default: return <Meh className="w-4 h-4" />;
    }
  };

  const getInsightMessage = () => {
    const recentEntries = data.slice(-7); // Last 7 entries for trend analysis
    const earlierEntries = data.length > 7 ? data.slice(-14, -7) : data.slice(0, Math.min(7, data.length)); // Previous 7 entries

    const recentAvgMood = recentEntries.length ? recentEntries.reduce((sum, item) => sum + item.mood, 0) / recentEntries.length : 0;
    const earlierAvgMood = earlierEntries.length ? earlierEntries.reduce((sum, item) => sum + item.mood, 0) / earlierEntries.length : 0;

    const moodTrend = recentAvgMood - earlierAvgMood;
    const moodVolatility = recentEntries.length > 1 ?
      Math.sqrt(recentEntries.reduce((sum, item) => sum + Math.pow(item.mood - recentAvgMood, 2), 0) / recentEntries.length) : 0;

    const positiveEntries = recentEntries.filter(entry => entry.sentiment === 'positive').length;
    const negativeEntries = recentEntries.filter(entry => entry.sentiment === 'negative').length;
    const positiveRatio = recentEntries.length ? positiveEntries / recentEntries.length : 0;

    const totalDays = data.length;
    const uniqueDays = new Set(data.map(entry => new Date(entry.fullDate).toDateString())).size;
    const consistencyRatio = uniqueDays > 0 ? totalDays / uniqueDays : 0;

    if (Math.abs(moodTrend) > 1.5) {
      if (moodTrend > 1.5) {
        return {
          type: 'positive',
          message: `Your mood has improved significantly (${moodTrend > 2 ? 'strongly' : 'moderately'} trending upward). This positive momentum is noteworthy!`,
          suggestion: positiveRatio > 0.6 ?
            "Continue nurturing these positive patterns and consider sharing what works for you." :
            "Explore what specific changes have contributed to this uplift and build upon them.",
          trend: 'improving',
          volatility: moodVolatility,
          consistency: consistencyRatio
        };
      } else {
        return {
          type: 'concern',
          message: `Your mood has declined recently (${Math.abs(moodTrend).toFixed(1)} point drop). This is a normal part of life's journey.`,
          suggestion: negativeEntries > positiveEntries ?
            "Consider reaching out for support and focus on small, manageable self-care activities." :
            "Identify any recent changes or stressors that might be contributing to this shift.",
          trend: 'declining',
          volatility: moodVolatility,
          consistency: consistencyRatio
        };
      }
    } else if (moodVolatility > 2) {
      return {
        type: 'concern',
        message: "Your mood has been fluctuating noticeably. This emotional movement is part of being human.",
        suggestion: consistencyRatio > 1.5 ?
          "Your consistent journaling is helping you navigate these changes - keep going!" :
          "Consider establishing a more regular journaling routine to help stabilize these fluctuations.",
        trend: 'volatile',
        volatility: moodVolatility,
        consistency: consistencyRatio
      };
    } else {
      return {
        type: 'stable',
        message: `Your mood has been relatively stable (${moodVolatility.toFixed(1)} volatility). This emotional balance is a strength.`,
        suggestion: positiveRatio > 0.5 ?
          "Maintain the practices that are supporting this stability and emotional balance." :
          "Consider exploring gentle ways to increase positive experiences in your routine.",
        trend: 'stable',
        volatility: moodVolatility,
        consistency: consistencyRatio
      };
    }
  };


  const xTickFormatter = (fullDate) => {
    if (!fullDate) return '';
    if (timeframe === 'week') return new Date(fullDate).toLocaleDateString('en-US', { weekday: 'short' });
    if (timeframe === 'month') return new Date(fullDate).getDate();
    return new Date(fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportData = () => {
    const uid = user?.uid || user?.id;
    if (!uid) return;

    fetch(`${API_BASE}/api/profile/export?uid=${uid}&format=pdf`)
      .then(res => {
        if (res.ok) {
          return res.blob();
        } else {
          throw new Error('Export failed');
        }
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whisprlog-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Export error:', error);
      });
  };

  const entriesByDate = data.reduce((acc, item) => {
    const date = new Date(item.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  const multipleEntriesDays = Object.entries(entriesByDate)
    .filter(([, entries]) => entries.length > 1)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  const totalMultipleEntryDays = Object.values(entriesByDate).filter(entries => entries.length > 1).length;
  const totalEntries = data.length;
  const avgEntriesPerDay = totalEntries > 0 ? (totalEntries / Object.keys(entriesByDate).length).toFixed(1) : 0;
  const insight = getInsightMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-2">Your Emotional Journey</h1>
            <p className="text-slate-600 dark:text-slate-300">Gentle insights into your patterns and growth over time</p>
          </div>
          <button
            onClick={exportData}
            disabled={!data.length}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors border border-blue-600 shadow-sm"
          >
            Export PDF Report
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
              <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg flex flex-col items-center">
            <Heart className="w-6 h-6 text-rose-400 mb-2" />
            <div className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">Average Mood</div>
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {loading ? (
                <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-16 rounded"></div>
              ) : (
                `${avgMood}/10`
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {loading ? (
                <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-4 w-24 rounded"></div>
              ) : (
                `Based on ${data.length} entries`
              )}
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg flex flex-col items-center">
            <BarChart3 className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-2" />
            <div className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">Dominant Sentiment</div>
            <div className="text-2xl font-light text-slate-900 dark:text-white flex items-center gap-2">
              {loading ? (
                <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-20 rounded"></div>
              ) : (
                <>
                  {dominantSentiment[0] === 'positive' ? <Smile className="w-5 h-5 text-green-400" /> : dominantSentiment[0] === 'negative' ? <Frown className="w-5 h-5 text-red-400" /> : <Meh className="w-5 h-5 text-yellow-400" />}
                  <span className="capitalize">{dominantSentiment[0]}</span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {loading ? (
                <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-4 w-16 rounded"></div>
              ) : (
                `${dominantSentiment[1]} entries`
              )}
            </div>
          </div>
        </div>

        {totalMultipleEntryDays > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg mb-8">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span>Multiple Entries Per Day</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-light text-slate-900 dark:text-white mb-1">{totalMultipleEntryDays}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">Days with multiple entries</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Average: {avgEntriesPerDay} entries per day
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Most Active Days</h3>
                <div className="space-y-2">
                  {multipleEntriesDays.map(([date, entries], index) => (
                    <div key={date} className="flex items-center justify-between bg-slate-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-rose-400' :
                          index === 1 ? 'bg-slate-400' :
                          index === 2 ? 'bg-blue-400' :
                          index === 3 ? 'bg-purple-400' :
                          'bg-yellow-400'
                        }`} />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {new Date(date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-600 px-2 py-1 rounded-full">
                        {entries.length} entries
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Multiple entries per day can indicate deeper reflection or significant emotional processing. 
                This shows your commitment to emotional awareness and self-care.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg mb-8 relative">
          {refreshing && (
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 dark:border-slate-300 border-t-transparent"></div>
                <span className="text-sm text-slate-700 dark:text-slate-200">Refreshing...</span>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 md:mb-0">Mood Timeline</h2>
            <div className="flex space-x-2">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  disabled={loading || refreshing}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    timeframe === period 
                      ? 'bg-blue-600 text-white border border-blue-700 shadow-sm' 
                      : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 dark:border-slate-300 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-slate-700 dark:text-slate-200">Loading your emotional journey...</p>
                </div>
              </div>
            )}

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.slice().sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))}
                  margin={{ top: 16, right: 16, left: 8, bottom: 32 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="fullDate"
                    tickFormatter={xTickFormatter}
                    tick={{ fontSize: 12 }}
                    interval={Math.max(0, Math.floor(data.length / 8))}
                    angle={0}
                    dy={8}
                  />
                  <YAxis domain={[0, 10]} tickCount={6} />
                  <Tooltip
                    formatter={(value) => `${value}/10`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar dataKey="mood" radius={[6,6,0,0]}>
                    {data.slice().sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate)).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.sentiment === 'positive' ? '#86efac' : entry.sentiment === 'negative' ? '#fca5a5' : '#fde68a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-300 rounded"></div>
                <span className="text-slate-600 dark:text-slate-300">Positive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-300 rounded"></div>
                <span className="text-slate-600 dark:text-slate-300">Neutral</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-300 rounded"></div>
                <span className="text-slate-600 dark:text-slate-300">Negative</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span>Most Common Emotions</span>
            </h3>
            <div className="space-y-3">
              {topEmotions.map(([emotion, count], index) => (
                <div key={emotion} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-rose-400' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-blue-400' :
                      index === 3 ? 'bg-purple-400' :
                      'bg-yellow-400'
                    }`} />
                    <span className="text-slate-700 dark:text-slate-200 capitalize font-medium">{emotion}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 rounded-full ${
                      index === 0 ? 'bg-rose-200 dark:bg-rose-800' :
                      index === 1 ? 'bg-slate-200 dark:bg-slate-700' :
                      index === 2 ? 'bg-blue-200 dark:bg-blue-800' :
                      index === 3 ? 'bg-purple-200 dark:bg-purple-800' :
                      'bg-yellow-200 dark:bg-yellow-800'
                    }`} style={{ width: `${(count / Math.max(...topEmotions.map(([,c]) => c))) * 60}px` }} />
                    <span className="text-sm text-slate-600 dark:text-slate-300 min-w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span>Sentiment Distribution</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(sentimentCounts).map(([sentiment, count]) => (
                <div key={sentiment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(sentiment)}
                      <span className="text-slate-700 dark:text-slate-200 capitalize font-medium">{sentiment}</span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{Math.round((count / data.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        sentiment === 'positive' ? 'bg-green-400' :
                        sentiment === 'negative' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}
                      style={{ width: `${(count / data.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deep Analytics Section */}
        {deepInsights.patterns && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg mb-8">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Deep Emotional Insights</span>
            </h2>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Emotional Velocity */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-medium text-purple-800 dark:text-purple-200">Emotional Velocity</h3>
                </div>
                <div className="text-2xl font-light text-purple-900 dark:text-purple-100 mb-1">
                  {deepInsights.patterns.emotionalVelocity.toFixed(1)}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  {deepInsights.patterns.emotionalVelocity < 1 ? 'Low emotional fluctuation - stable mood patterns' :
                   deepInsights.patterns.emotionalVelocity < 2 ? 'Moderate emotional movement - healthy emotional range' :
                   'High emotional velocity - experiencing significant mood changes'}
                </p>
              </div>

              {/* Resilience Score */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h3 className="font-medium text-green-800 dark:text-green-200">Resilience Score</h3>
                </div>
                <div className="text-2xl font-light text-green-900 dark:text-green-100 mb-1">
                  {deepInsights.patterns.resilienceScore.toFixed(0)}%
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {deepInsights.patterns.resilienceScore > 75 ? 'Strong recovery patterns - excellent emotional resilience' :
                   deepInsights.patterns.resilienceScore > 50 ? 'Good bounce-back ability - solid emotional strength' :
                   'Room for resilience building - consider support strategies'}
                </p>
              </div>
            </div>

            {/* Circadian Rhythm Analysis */}
            {deepInsights.patterns.circadianRhythm && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sun className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-medium text-orange-800 dark:text-orange-200">Daily Energy Patterns</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(deepInsights.patterns.circadianRhythm).map(([timeSlot, data]) => (
                    <div key={timeSlot} className="text-center">
                      <div className="text-sm text-orange-700 dark:text-orange-300 capitalize font-medium mb-1">{timeSlot}</div>
                      <div className="text-lg font-light text-orange-900 dark:text-orange-100">
                        {data.avgMood ? data.avgMood.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        {data.count} entries
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-3">
                  Your most positive time: {
                    Object.entries(deepInsights.patterns.circadianRhythm)
                      .filter(([, data]) => data.count > 0)
                      .sort(([, a], [, b]) => b.avgMood - a.avgMood)[0]?.[0] || 'N/A'
                  }
                </p>
              </div>
            )}

            {/* Predictive Insights */}
            {deepInsights.predictiveInsights.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Predictive Insights</span>
                </h3>
                <div className="space-y-3">
                  {deepInsights.predictiveInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.type === 'improvement' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      insight.type === 'decline' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      insight.type === 'optimal_timing' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          insight.type === 'improvement' ? 'bg-green-100 dark:bg-green-800' :
                          insight.type === 'decline' ? 'bg-red-100 dark:bg-red-800' :
                          insight.type === 'optimal_timing' ? 'bg-blue-100 dark:bg-blue-800' :
                          'bg-purple-100 dark:bg-purple-800'
                        }`}>
                          {insight.type === 'improvement' ? <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /> :
                           insight.type === 'decline' ? <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" /> :
                           insight.type === 'optimal_timing' ? <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> :
                           <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{insight.prediction}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>Confidence: {insight.confidence}%</span>
                            <span>•</span>
                            <span>Timeframe: {insight.timeframe}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Archetypes */}
            {deepInsights.emotionalArchetypes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center space-x-2 mb-4">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Your Emotional Archetype</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {deepInsights.emotionalArchetypes.map((archetype, index) => (
                    <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">{archetype.name}</h4>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-3">{archetype.description}</p>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Strengths:</div>
                        <div className="flex flex-wrap gap-1">
                          {archetype.strengths.map((strength, i) => (
                            <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded-full">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 italic">
                        💡 {archetype.growth}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlations */}
            {deepInsights.patterns.correlations && (
              <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                  <Link className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span>Pattern Correlations</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {deepInsights.patterns.correlations.reflectionDepth !== undefined && (
                    <div className="text-center">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Reflection Depth</div>
                      <div className="text-lg font-light text-gray-900 dark:text-gray-100">
                        {(deepInsights.patterns.correlations.reflectionDepth * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Correlation with mood</div>
                    </div>
                  )}
                  {deepInsights.patterns.correlations.emotionalConsistency !== undefined && (
                    <div className="text-center">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Emotional Consistency</div>
                      <div className="text-lg font-light text-gray-900 dark:text-gray-100">
                        {(deepInsights.patterns.correlations.emotionalConsistency * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Predictability score</div>
                    </div>
                  )}
                  {deepInsights.patterns.correlations.weekendEffect !== undefined && (
                    <div className="text-center col-span-2">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Weekend Effect</div>
                      <div className="text-lg font-light text-gray-900 dark:text-gray-100">
                        {deepInsights.patterns.correlations.weekendEffect > 0 ? '+' : ''}
                        {deepInsights.patterns.correlations.weekendEffect.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Mood difference (weekend - weekday)</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI-Powered Features Section */}
        {(personalizedPrompts.length > 0 || triggerAnalysis) && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-100 dark:border-gray-700 shadow-lg mb-8">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-8 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>AI-Powered Insights</span>
            </h2>

            {/* Personalized Prompts */}
            {personalizedPrompts.length > 0 && (
              <div className="mb-10">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center space-x-2 mb-6">
                  <Lightbulb className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Personalized Journaling Prompts</span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personalizedPrompts.slice(0, 6).map((prompt, index) => (
                    <div key={index} className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100/50 dark:border-indigo-800/50 hover:shadow-md transition-all duration-200 flex flex-col min-h-[200px]">
                      <div className="flex items-start space-x-4 mb-4 flex-1">
                        <div className="bg-indigo-100/80 dark:bg-indigo-800/60 rounded-full p-3 flex-shrink-0 mt-1">
                          <span className="text-indigo-700 dark:text-indigo-200 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap break-words">
                            {prompt.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-indigo-100/30 dark:border-indigo-700/30">
                        <span className="bg-indigo-200/60 dark:bg-indigo-700/60 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full text-xs font-medium">
                          {prompt.focus}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {prompt.estimated_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-slate-50/80 dark:bg-gray-700/50 rounded-lg border border-slate-100 dark:border-gray-600">
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    💡 These prompts are thoughtfully crafted based on your emotional patterns and current journey to support your growth
                  </p>
                </div>
              </div>
            )}

            {/* Trigger Analysis */}
            {triggerAnalysis && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Positive Triggers */}
                {triggerAnalysis.positive_triggers && triggerAnalysis.positive_triggers.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50/70 to-green-50/70 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-6 border border-emerald-100/50 dark:border-emerald-800/50 flex flex-col min-h-[280px]">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Positive Triggers</span>
                    </h4>
                    <ul className="space-y-3 flex-1">
                      {triggerAnalysis.positive_triggers.slice(0, 4).map((trigger, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">{trigger}</span>
                        </li>
                      ))}
                      {/* Fill empty space to maintain consistent height */}
                      {Array.from({ length: Math.max(0, 4 - triggerAnalysis.positive_triggers.slice(0, 4).length) }).map((_, index) => (
                        <li key={`empty-${index}`} className="flex items-start space-x-3 opacity-0">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">Placeholder</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Negative Triggers */}
                {triggerAnalysis.negative_triggers && triggerAnalysis.negative_triggers.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-50/70 to-gray-50/70 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl p-6 border border-slate-100/50 dark:border-slate-800/50 flex flex-col min-h-[280px]">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4" />
                      <span>Negative Triggers</span>
                    </h4>
                    <ul className="space-y-3 flex-1">
                      {triggerAnalysis.negative_triggers.slice(0, 4).map((trigger, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{trigger}</span>
                        </li>
                      ))}
                      {/* Fill empty space to maintain consistent height */}
                      {Array.from({ length: Math.max(0, 4 - triggerAnalysis.negative_triggers.slice(0, 4).length) }).map((_, index) => (
                        <li key={`empty-${index}`} className="flex items-start space-x-3 opacity-0">
                          <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Placeholder</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Coping Strategies */}
                {triggerAnalysis.coping_strategies && triggerAnalysis.coping_strategies.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100/50 dark:border-blue-800/50 flex flex-col min-h-[280px]">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-4 flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Coping Strategies</span>
                    </h4>
                    <ul className="space-y-3 flex-1">
                      {triggerAnalysis.coping_strategies.slice(0, 4).map((strategy, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{strategy}</span>
                        </li>
                      ))}
                      {/* Fill empty space to maintain consistent height */}
                      {Array.from({ length: Math.max(0, 4 - triggerAnalysis.coping_strategies.slice(0, 4).length) }).map((_, index) => (
                        <li key={`empty-${index}`} className="flex items-start space-x-3 opacity-0">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">Placeholder</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recovery Patterns */}
                {triggerAnalysis.recovery_patterns && (
                  <div className="bg-gradient-to-br from-violet-50/70 to-purple-50/70 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-violet-100/50 dark:border-violet-800/50 flex flex-col min-h-[280px]">
                    <h4 className="font-medium text-violet-800 dark:text-violet-200 mb-4 flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Recovery Patterns</span>
                    </h4>
                    <div className="flex-1 flex flex-col">
                      <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed flex-1">
                        {triggerAnalysis.recovery_patterns}
                      </p>
                      {/* Add spacing to maintain consistent height */}
                      <div className="mt-auto pt-4">
                        <div className="text-xs text-violet-600 dark:text-violet-400 italic">
                          💡 Your recovery patterns show resilience and growth
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Weekly Check-ins Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg mb-8">
          <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Weekly Reflections</span>
          </h2>

          <div className="space-y-6">
            {/* Check-in Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-sm font-medium text-rose-800 dark:text-rose-200">Total Check-ins</span>
                </div>
                <div className="text-2xl font-light text-rose-900 dark:text-rose-100">
                  {(() => {
                    const checkins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                      .filter(checkin => checkin.userId === user?.id);
                    return checkins.length;
                  })()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Reflection Depth</span>
                </div>
                <div className="text-2xl font-light text-blue-900 dark:text-blue-100">
                  {(() => {
                    const checkins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                      .filter(checkin => checkin.userId === user?.id);
                    if (checkins.length === 0) return '0.0';
                    const avgWords = checkins.reduce((sum, checkin) => sum + checkin.reflection.split(' ').length, 0) / checkins.length;
                    return (avgWords / 50).toFixed(1);
                  })()}/10
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Consistency</span>
                </div>
                <div className="text-2xl font-light text-green-900 dark:text-green-100">
                  {(() => {
                    const checkins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                      .filter(checkin => checkin.userId === user?.id);
                    
                    if (checkins.length === 0) return 'No data';
                    if (checkins.length === 1) return 'Building...';
                    
                    const dates = checkins.map(c => new Date(c.date)).sort((a, b) => a - b);
                    let consistentCount = 0;
                    for (let i = 1; i < dates.length; i++) {
                      const diffDays = Math.abs((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
                      if (diffDays >= 6 && diffDays <= 8) consistentCount++;
                    }
                    const consistencyPercent = Math.round((consistentCount / (dates.length - 1)) * 100);
                    return `${consistencyPercent}%`;
                  })()}
                </div>
              </div>
            </div>

            {/* Recent Check-ins Timeline */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Recent Reflections</h3>
              <div className="space-y-4">
                {(() => {
                  const checkins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                    .filter(checkin => checkin.userId === user?.id)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 4);

                  if (checkins.length === 0) {
                    return (
                      <div className="text-center py-8 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                        <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-300 mb-2">No weekly check-ins yet</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Start your weekly reflection journey to see insights here</p>
                      </div>
                    );
                  }

                  return checkins.map((checkin, index) => (
                    <div key={index} className="bg-gradient-to-r from-slate-50 to-rose-50 dark:from-gray-700/50 dark:to-rose-900/20 rounded-lg p-4 border border-slate-100 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center">
                            <span className="text-rose-700 dark:text-rose-200 font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{checkin.prompt}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {new Date(checkin.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {checkin.reflection.split(' ').length} words
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {checkin.reflection.split(' ').length > 100 ? (
                              <div className="w-2 h-2 bg-green-400 rounded-full" title="Deep reflection"></div>
                            ) : checkin.reflection.split(' ').length > 50 ? (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Moderate reflection"></div>
                            ) : (
                              <div className="w-2 h-2 bg-red-400 rounded-full" title="Brief reflection"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-3 mb-3">
                        <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {checkin.reflection}
                        </p>
                      </div>

                      {/* AI Insights for this check-in */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-3">
                          <span className="bg-slate-200 dark:bg-gray-600 px-2 py-1 rounded-full">{prompt.focus}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-3 h-3" />
                          <span>AI-analyzed</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Growth Insights */}
            {(() => {
              const checkins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                .filter(checkin => checkin.userId === user?.id);

              if (checkins.length >= 3) {
                const recentCheckins = checkins.slice(-3);
                const avgLength = recentCheckins.reduce((sum, c) => sum + c.reflection.split(' ').length, 0) / recentCheckins.length;
                const hasGrowthThemes = recentCheckins.some(c =>
                  c.reflection.toLowerCase().includes('learn') ||
                  c.reflection.toLowerCase().includes('grow') ||
                  c.reflection.toLowerCase().includes('change') ||
                  c.reflection.toLowerCase().includes('better')
                );

                return (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>Reflection Growth Insights</span>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">Average Depth:</span>
                        <span className="text-purple-900 dark:text-purple-100 ml-2">
                          {avgLength > 100 ? 'Deep' : avgLength > 50 ? 'Moderate' : 'Brief'}
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">Growth Focus:</span>
                        <span className="text-purple-900 dark:text-purple-100 ml-2">
                          {hasGrowthThemes ? 'Present' : 'Developing'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-2 italic">
                      💡 Your weekly reflections show {avgLength > 75 ? 'increasing depth' : 'steady growth'} in self-reflection
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Custom Goals Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg mb-8">
          <CustomGoals onGoalUpdate={() => {
            if (user && privacySettings.analyticsEnabled) {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }
          }} />
        </div>

        {/* Insights Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-lg">
          <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Gentle Insights & Patterns</span>
          </h2>
          <div className="space-y-4">
            {/* Current Trend Analysis */}
            <div className={`p-4 rounded-lg ${
              personalizedInsights?.currentTrendAnalysis?.type === 'positive' ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/50' :
              personalizedInsights?.currentTrendAnalysis?.type === 'concern' ? 'bg-amber-50/70 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-800/50' :
              'bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/50'
            }`}>
              <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                {personalizedInsights?.currentTrendAnalysis?.type === 'positive' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : personalizedInsights?.currentTrendAnalysis?.type === 'concern' ? (
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
                <span>Current Trend Analysis</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-2">
                {personalizedInsights?.currentTrendAnalysis?.message || insight.message}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                💡 {personalizedInsights?.currentTrendAnalysis?.suggestion || insight.suggestion}
              </p>
              {insight.volatility && (
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Emotional Stability: {insight.volatility.toFixed(1)}/10</span>
                  <span>Consistency: {insight.consistency.toFixed(1)}x daily</span>
                </div>
              )}
            </div>

            {/* Journaling Patterns */}
            <div className="p-4 bg-slate-50/70 dark:bg-gray-700/50 rounded-lg border border-slate-100/50 dark:border-gray-600/50">
              <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                <Target className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Your Journaling Patterns</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {personalizedInsights?.journalingPatterns?.message || (() => {
                  const totalEntries = data.length;
                  const uniqueDays = new Set(data.map(entry => new Date(entry.fullDate).toDateString())).size;
                  const avgEntriesPerDay = uniqueDays > 0 ? (totalEntries / uniqueDays).toFixed(1) : '0.0';
                  const mostActiveDay = data.length > 0 ? (() => {
                    const dayCounts = data.reduce((acc, entry) => {
                      const day = new Date(entry.fullDate).toLocaleDateString('en-US', { weekday: 'long' });
                      acc[day] = (acc[day] || 0) + 1;
                      return acc;
                    }, {});
                    return Object.entries(dayCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
                  })() : 'N/A';

                  if (parseFloat(avgEntriesPerDay) >= 2) {
                    return `I notice you've been journaling ${avgEntriesPerDay} times each day - that's a beautiful rhythm you've created. Your most active day seems to be ${mostActiveDay}, which tells me this might be when you feel most naturally drawn to reflection.`;
                  } else if (parseFloat(avgEntriesPerDay) >= 1) {
                    return `You've found a steady rhythm with about ${avgEntriesPerDay} entry per day. I see ${mostActiveDay} stands out as your most reflective day - perhaps this is when your schedule allows for that special time with yourself.`;
                  } else {
                    return `Your entries are thoughtfully spaced, creating space between reflections. This gentle pace suggests you're listening to what feels right for you in each moment.`;
                  }
                })()}
              </p>
              {personalizedInsights?.journalingPatterns?.insight && (
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic mt-2">
                  💡 {personalizedInsights.journalingPatterns.insight}
                </p>
              )}
            </div>

            {/* Growth Recognition */}
            <div className="p-4 bg-rose-50/70 dark:bg-rose-900/20 rounded-lg border border-rose-100/50 dark:border-rose-800/50">
              <h3 className="font-medium text-slate-800 dark:text-rose-200 mb-2 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Growth Recognition</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {personalizedInsights?.growthRecognition?.message || (() => {
                  const totalEntries = data.length;
                  const firstEntry = data.length > 0 ? new Date(data[0].fullDate) : null;
                  const lastEntry = data.length > 0 ? new Date(data[data.length - 1].fullDate) : null;
                  const daysActive = firstEntry && lastEntry ?
                    Math.ceil((lastEntry - firstEntry) / (1000 * 60 * 60 * 24)) + 1 : 0;

                  if (totalEntries > 20) {
                    return `Over these ${daysActive} days, you've shared ${totalEntries} pieces of your inner world with yourself. Each entry shows your commitment to understanding your own heart - that's something truly special about you.`;
                  } else if (totalEntries > 10) {
                    return `In just ${daysActive} days, you've created ${totalEntries} moments of self-reflection. I can see how you're building this practice into your life, one thoughtful entry at a time.`;
                  } else {
                    return `Every time you choose to write here, you're choosing to honor your own experience. Even these first entries show your willingness to explore your inner landscape - that's already a beautiful act of self-care.`;
                  }
                })()}
              </p>
              {personalizedInsights?.growthRecognition?.celebration && (
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic mt-2">
                  💡 {personalizedInsights.growthRecognition.celebration}
                </p>
              )}
            </div>

            {/* Personalized Suggestion */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-900/20 rounded-lg border border-indigo-100/50 dark:border-indigo-800/50">
              <h3 className="font-medium text-slate-800 dark:text-indigo-200 mb-2 flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Personalized Suggestion</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {personalizedInsights?.personalizedSuggestion?.message || (() => {
                  const recentEntries = data.slice(-5);
                  const avgMood = recentEntries.length ? recentEntries.reduce((sum, item) => sum + item.mood, 0) / recentEntries.length : 5;
                  const positiveCount = recentEntries.filter(entry => entry.sentiment === 'positive').length;
                  const negativeCount = recentEntries.filter(entry => entry.sentiment === 'negative').length;
                  const totalEntries = data.length;

                  if (avgMood > 7 && positiveCount > negativeCount) {
                    return `I love seeing this positive energy in your recent entries! When you're feeling this good, it might be worth noting what specifically is bringing you joy right now - maybe it's a particular activity, person, or mindset that you could weave more intentionally into your days.`;
                  } else if (avgMood < 4 && negativeCount > positiveCount) {
                    return `I notice you've been carrying some heavier feelings lately. During times like these, even the smallest act of kindness toward yourself can make a real difference. What would feel nurturing to you today, even if it's just for a few minutes?`;
                  } else if (insight && insight.consistency > 1.5) {
                    return `Your steady commitment to this practice is really beautiful. Since you've built such a strong foundation, you might enjoy experimenting with different types of prompts or questions that could help you explore new aspects of your inner world.`;
                  } else if (totalEntries < 5) {
                    return `You're just beginning this journey with yourself, and that's something to celebrate. Consider starting with whatever feels easiest - maybe just noting one thing you're grateful for, or one emotion you're feeling. There's no "right" way to begin.`;
                  } else {
                    return `I can see you're finding your own rhythm with this practice. Trust that instinct - you're the expert on what feels right for you. Sometimes the most meaningful insights come when we follow our own inner timing rather than external expectations.`;
                  }
                })()}
              </p>
              {personalizedInsights?.personalizedSuggestion?.encouragement && (
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic mt-2">
                  💡 {personalizedInsights.personalizedSuggestion.encouragement}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;