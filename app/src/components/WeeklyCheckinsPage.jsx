import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Heart, Sparkles, Lightbulb, TrendingUp, Target, Brain, MessageCircle, BarChart3, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import CustomAlert from './CustomAlert';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5002';

const WeeklyCheckinsPage = () => {
  const { user, loading } = useAuth();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckinDate, setLastCheckinDate] = useState(null);
  const [alert, setAlert] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [userCheckins, setUserCheckins] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [emotionalPatterns, setEmotionalPatterns] = useState(null);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [daysUntilNextCheckin, setDaysUntilNextCheckin] = useState(null);

  const fetchAISuggestions = useCallback(async () => {
    if (!currentPrompt || currentPrompt.trim() === '' || isGeneratingPrompt) {
      return;
    }

    try {
      const uid = user.uid || user.id;

      const suggestionsRes = await fetch(`${API_BASE}/api/weekly-checkin/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          currentPrompt,
          previousCheckins: userCheckins.slice(-5), 
          userStats
        })
      });

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setAiSuggestions(data.suggestions || []);
      } else {
        const mockSuggestions = [
          {
            suggestion: "Consider how your daily journal entries from this week connect to this reflection about relationships.",
            type: "connection",
            reasoning: "Your recent entries show themes of connection that align with this week's focus on relationships."
          },
          {
            suggestion: "Think about specific actions you can take based on your insights about self-care.",
            type: "action",
            reasoning: "Your reflections often include actionable insights - try making them more specific this time."
          },
          {
            suggestion: "Explore what 'enough' means to you in the context of your accomplishments this week.",
            type: "depth",
            reasoning: "Your growth-focused reflections could benefit from deeper exploration of self-compassion."
          }
        ];
        setAiSuggestions(mockSuggestions);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiSuggestions([
        {
          suggestion: "Consider how your daily journal entries from this week connect to this reflection.",
          type: "connection",
          reasoning: "Your recent entries show themes that align with this week's focus."
        }
      ]);
    }
  }, [user, userCheckins, userStats, currentPrompt, isGeneratingPrompt]);

  const generateAIInsights = useCallback(async () => {
    if (isLoadingInsights) return; // Prevent multiple calls
    
    setIsLoadingInsights(true);
    try {
      const uid = user.uid || user.id;
      
      const insightsRes = await fetch(`${API_BASE}/api/weekly-checkin/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          checkins: userCheckins
        })
      });

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [user, userCheckins, isLoadingInsights]);

  const getDaysSinceLastCheckin = useCallback(() => {
    if (!lastCheckinDate) return null;
    const now = new Date();
    const diffTime = Math.abs(now - lastCheckinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [lastCheckinDate]);

  const canDoCheckin = useCallback(() => {
    const daysSince = getDaysSinceLastCheckin();
    return !daysSince || daysSince >= 7;
  }, [getDaysSinceLastCheckin]);

  const loadUserData = useCallback(async () => {
    if (isLoadingData) return; 
    
    try {
      setIsLoadingData(true);
      const uid = user.uid || user.id;
      const statsRes = await fetch(`${API_BASE}/api/profile/stats?uid=${uid}`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setUserStats(stats);
      } else {
        console.log('Failed to load user stats:', statsRes.status);
      }

      const checkinsRes = await fetch(`${API_BASE}/api/weekly-checkin/checkins?uid=${uid}`);
      if (checkinsRes.ok) {
        const checkinsData = await checkinsRes.json();
        setUserCheckins(checkinsData.checkins);

        if (checkinsData.checkins.length > 0) {
          const lastCheckin = checkinsData.checkins[0]; // Already sorted by date desc
          setLastCheckinDate(new Date(lastCheckin.date));
          
          const daysSince = Math.ceil((new Date() - new Date(lastCheckin.date)) / (1000 * 60 * 60 * 24));
          const daysUntilNext = Math.max(1, 7 - daysSince);
          setDaysUntilNextCheckin(daysUntilNext);
        } else {
          setDaysUntilNextCheckin(null);
        }
      } else {
        const existingCheckins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
          .filter(checkin => checkin.userId === uid);
        setUserCheckins(existingCheckins);

        const lastCheckin = localStorage.getItem(`weekly-checkin-${uid}`);
        if (lastCheckin) {
          setLastCheckinDate(new Date(lastCheckin));
          
          const daysSince = Math.ceil((new Date() - new Date(lastCheckin)) / (1000 * 60 * 60 * 24));
          const daysUntilNext = Math.max(1, 7 - daysSince);
          setDaysUntilNextCheckin(daysUntilNext);
        } else {
          setDaysUntilNextCheckin(null);
        }
      }

      if (userCheckins.length > 0) {
        console.log('Generating AI insights for existing check-ins...');
        const insightsRes = await fetch(`${API_BASE}/api/weekly-checkin/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            checkins: userCheckins
          })
        });

        if (insightsRes.ok) {
          const data = await insightsRes.json();
          console.log('AI insights generated:', data.insights);
          setAiInsights(data.insights);
        } else {
          console.log('Failed to generate AI insights:', insightsRes.status);
        }
      } else {
        console.log('No existing check-ins, skipping AI insights generation');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const uid = user.uid || user.id;
      const existingCheckins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
        .filter(checkin => checkin.userId === uid);
      setUserCheckins(existingCheckins);

      const lastCheckin = localStorage.getItem(`weekly-checkin-${uid}`);
      if (lastCheckin) {
        setLastCheckinDate(new Date(lastCheckin));
        
        const daysSince = Math.ceil((new Date() - new Date(lastCheckin)) / (1000 * 60 * 60 * 24));
        const daysUntilNext = Math.max(1, 7 - daysSince);
        setDaysUntilNextCheckin(daysUntilNext);
      } else {
        setDaysUntilNextCheckin(null);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [user, isLoadingData, userCheckins]);

  const generatePersonalizedPrompt = useCallback(async () => {
    if (isGeneratingPrompt) return; // Prevent multiple calls
    
    setIsGeneratingPrompt(true);
    try {
      const uid = user.uid || user.id;
      
      const entriesRes = await fetch(`${API_BASE}/api/journal/recent?uid=${uid}&limit=10`);
      let recentEntries = [];
      if (entriesRes.ok) {
        recentEntries = await entriesRes.json();
        console.log('Fetched recent entries:', recentEntries.length);
      } else {
        console.log('Failed to fetch recent entries:', entriesRes.status);
      }

      console.log('Sending prompt generation request with:', { uid, recentEntriesCount: recentEntries.length, userStats, previousCheckinsCount: userCheckins.length });
      const promptRes = await fetch(`${API_BASE}/api/weekly-checkin/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          recentEntries,
          userStats,
          previousCheckins: userCheckins.slice(-3)
        })
      });

      
      if (promptRes.ok) {
        const data = await promptRes.json();
        setCurrentPrompt(data.prompt);
        if (data.followUpQuestions) {
          setFollowUpQuestions(data.followUpQuestions);
        }
      } else {
        const reflectionPrompts = [
          "How have you been feeling this week? What moments brought you joy or peace?",
          "What is one thing you're grateful for this week, no matter how small?",
          "How have you been taking care of yourself lately? What could you do more of?",
          "What challenged you this week, and what did you learn from it?",
          "What is one goal or intention you'd like to carry into the coming week?",
          "How have your relationships been feeling? Is there anyone you'd like to connect with more?",
          "What creative or playful activity brought you happiness this week?",
          "How has your body been feeling? What does it need from you right now?",
          "What is one boundary you've set or would like to set for yourself?",
          "Looking back on this week, what are you most proud of accomplishing?",
          "How has your inner world been? What thoughts or feelings have been visiting?",
          "What is one way you've grown or changed in the past week?",
          "How have you been spending your time? Does it align with what matters to you?",
          "What is one act of kindness, either given or received, that touched you this week?",
          "How are you feeling about your work, studies, or daily responsibilities right now?",
          "What is one thing in nature or your environment that brought you comfort this week?",
          "How have you been sleeping and resting? What helps you feel most restored?",
          "What is one fear or worry that's been present, and how might you gently address it?",
          "How have you been expressing yourself creatively or authentically this week?",
          "What is one memory from this week that you'd like to hold onto?",
          "How has your energy been fluctuating? What patterns do you notice?",
          "What is one way you've shown compassion to yourself or others recently?",
          "How are you feeling about the future? What hopes do you hold?",
          "What is one ritual or routine that supports your well-being?",
          "How have you been handling stress or difficult emotions this week?",
          "What is one thing you're looking forward to in the coming days?",
          "How has your sense of purpose or meaning been feeling lately?",
          "What is one boundary you maintained that felt important?",
          "How have you been nourishing your mind, body, and spirit?",
          "What is one lesson the week has taught you about yourself?"
        ];

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        const promptIndex = (weekNumber - 1) % reflectionPrompts.length;
        const fallbackPrompt = reflectionPrompts[promptIndex];
        console.log('Using fallback prompt:', fallbackPrompt);
        setCurrentPrompt(fallbackPrompt);
      }
    } catch (error) {
      console.error('Error generating personalized prompt:', error);
      const reflectionPrompts = [
        "How have you been feeling this week? What moments brought you joy or peace?",
        "What is one thing you're grateful for this week, no matter how small?",
        "How have you been taking care of yourself lately? What could you do more of?"
      ];
      const fallbackPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
      console.log('Using error fallback prompt:', fallbackPrompt);
      setCurrentPrompt(fallbackPrompt);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [user, userStats, userCheckins, isGeneratingPrompt]);

  const fetchEmotionalPatterns = useCallback(async () => {
    if (isLoadingPatterns) return; 
    
    setIsLoadingPatterns(true);
    try {
      const uid = user.uid || user.id;
      
      const patternsRes = await fetch(`${API_BASE}/api/weekly-checkin/emotional-patterns?uid=${uid}`);
      
      if (patternsRes.ok) {
        const patterns = await patternsRes.json();
        console.log('Emotional patterns data:', patterns);
        setEmotionalPatterns(patterns);
      } else {
        setEmotionalPatterns({
          dominantEmotion: 'analyzing',
          consistency: null,
          patterns: [],
          message: 'Unable to analyze patterns right now'
        });
      }
    } catch (error) {
      console.error('Error fetching emotional patterns:', error);
      setEmotionalPatterns({
        dominantEmotion: 'analyzing',
        consistency: null,
        patterns: [],
        message: 'Unable to analyze patterns right now'
      });
    } finally {
      setIsLoadingPatterns(false);
    }
  }, [user, isLoadingPatterns]);

  const loadUserDataRef = useRef(loadUserData);
  const generatePersonalizedPromptRef = useRef(generatePersonalizedPrompt);
  const fetchEmotionalPatternsRef = useRef(fetchEmotionalPatterns);

  useEffect(() => {
    loadUserDataRef.current = loadUserData;
    generatePersonalizedPromptRef.current = generatePersonalizedPrompt;
    fetchEmotionalPatternsRef.current = fetchEmotionalPatterns;
  }, [loadUserData, generatePersonalizedPrompt, fetchEmotionalPatterns]);

  useEffect(() => {
    if (user) {
      loadUserDataRef.current();
      generatePersonalizedPromptRef.current();
      fetchEmotionalPatternsRef.current();
    }
  }, [user]); 

  const fetchAISuggestionsRef = useRef(fetchAISuggestions);

  useEffect(() => {
    fetchAISuggestionsRef.current = fetchAISuggestions;
  }, [fetchAISuggestions]);

  useEffect(() => {
    const daysSince = lastCheckinDate ? Math.ceil((new Date() - lastCheckinDate) / (1000 * 60 * 60 * 24)) : null;
    const canCheckin = !daysSince || daysSince >= 7;
    
    if (currentPrompt && user && canCheckin) {
      fetchAISuggestionsRef.current();
    }
  }, [currentPrompt, user, lastCheckinDate]); 

  const handleSubmitReflection = async (e) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    setIsSubmitting(true);
    try {
      const uid = user.uid || user.id;
      const checkinData = {
        uid,
        prompt: currentPrompt,
        reflection: reflection.trim()
      };

      const saveRes = await fetch(`${API_BASE}/api/weekly-checkin/analyze-reflection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkinData)
      });

      if (saveRes.status === 429) {
        const errorData = await saveRes.json();
        setAlert({
          message: `You've already completed your weekly check-in. You can submit another one in ${errorData.daysUntilNext || 7} days.`,
          type: 'warning'
        });
        return;
      }

      if (!saveRes.ok) {
        throw new Error(`Failed to save check-in: ${saveRes.status}`);
      }

      const saveData = await saveRes.json();

      const existingCheckins = JSON.parse(localStorage.getItem('weekly-checkins') || '[]');
      const localCheckinData = {
        ...checkinData,
        date: new Date().toISOString(),
        userId: uid,
        aiAnalysis: saveData.feedback?.feedback || null
      };
      existingCheckins.push(localCheckinData);
      localStorage.setItem('weekly-checkins', JSON.stringify(existingCheckins));
      localStorage.setItem(`weekly-checkin-${uid}`, new Date().toISOString());

      setLastCheckinDate(new Date());
      setReflection('');
      setUserCheckins(existingCheckins);

      if (existingCheckins.length > 0) {
        const insightsRes = await fetch(`${API_BASE}/api/weekly-checkin/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            checkins: existingCheckins
          })
        });

        if (insightsRes.ok) {
          const data = await insightsRes.json();
          setAiInsights(data.insights);
        }
      }

      setAlert({
        message: 'Thank you for your reflection! Your check-in has been saved and analyzed.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving check-in:', error);
      setAlert({
        message: 'There was an error saving your check-in. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-8 h-8 text-rose-300 dark:text-rose-400" />
            <h1 className="text-3xl font-light text-slate-900 dark:text-white">Weekly Check-ins</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">Take a moment to reflect on your week with this gentle prompt</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-lg relative">
            {!canDoCheckin() && (
              <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center min-h-[500px]">
                <div className="text-center p-12 max-w-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Heart className="w-10 h-10 text-rose-400 dark:text-rose-300" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Weekly Reflection Complete!</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg">
                    You've already shared your weekly reflection. Taking time between check-ins helps you reflect more deeply on your journey.
                  </p>
                  <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                      <Calendar className="w-5 h-5" />
                      <span>Next check-in available in</span>
                    </div>
                    <div className="text-3xl font-bold text-rose-500 dark:text-rose-400">
                      {daysUntilNextCheckin || Math.max(1, 7 - getDaysSinceLastCheckin())} days
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Last reflection: {lastCheckinDate?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-5 h-5 text-rose-300 dark:text-rose-400" />
              <h2 className="text-xl font-medium text-slate-900 dark:text-white">This Week's Reflection</h2>
              {canDoCheckin() && (
                <button
                  onClick={() => generatePersonalizedPrompt()}
                  disabled={isGeneratingPrompt}
                  className="ml-auto px-3 py-1 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-800/40 text-rose-700 dark:text-rose-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  title="Generate a new personalized prompt"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                  <span>New Prompt</span>
                </button>
              )}
            </div>

            {canDoCheckin() ? (
              <>
                <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed">{currentPrompt}</p>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">AI-Powered Suggestions</h3>
                    </div>
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1 rounded-full ${
                              suggestion.type === 'connection' ? 'bg-green-100 dark:bg-green-800' :
                              suggestion.type === 'depth' ? 'bg-purple-100 dark:bg-purple-800' :
                              'bg-blue-100 dark:bg-blue-800'
                            }`}>
                              {suggestion.type === 'connection' ? <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /> :
                               suggestion.type === 'depth' ? <Target className="w-3 h-3 text-purple-600 dark:text-purple-400" /> :
                               <Lightbulb className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">{suggestion.suggestion}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-300 italic">{suggestion.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-3 italic">
                      💡 These suggestions are based on your journaling patterns and past reflections
                    </p>
                  </div>
                )}

                {followUpQuestions.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 mb-4 border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-200">Follow-up Questions</h3>
                    </div>
                    <div className="space-y-3">
                      {followUpQuestions.map((question, index) => (
                        <div key={index} className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">{question}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-3 italic">
                      💭 These questions are designed to deepen your reflection based on your journaling patterns
                    </p>
                  </div>
                )}

                {(!emotionalPatterns && !isLoadingPatterns) && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200">Your Emotional Patterns</h3>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-3">Ready to analyze your emotional patterns?</p>
                      <button
                        onClick={() => fetchEmotionalPatterns()}
                        className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Analyze Patterns
                      </button>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-3 italic">
                      📊 Based on your recent journal entries and weekly reflections
                    </p>
                  </div>
                )}
                
                {(emotionalPatterns || isLoadingPatterns) && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200">Your Emotional Patterns</h3>
                      <button
                        onClick={() => fetchEmotionalPatterns()}
                        disabled={isLoadingPatterns}
                        className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Refresh emotional patterns"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingPatterns ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    {isLoadingPatterns ? (
                      <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent"></div>
                        <span className="text-sm">Analyzing your emotional patterns...</span>
                      </div>
                    ) : emotionalPatterns ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                          <p className="text-xs text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">Dominant Emotion</p>
                          <p className="text-lg font-medium text-indigo-800 dark:text-indigo-200 capitalize">
                            {emotionalPatterns.dominantEmotion || 'Building patterns...'}
                          </p>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                          <p className="text-xs text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">Consistency</p>
                          <p className="text-lg font-medium text-indigo-800 dark:text-indigo-200">
                            {emotionalPatterns.consistency ? `${emotionalPatterns.consistency}%` : 'Analyzing...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-indigo-600 dark:text-indigo-300">No emotional patterns available yet</p>
                        <button
                          onClick={() => fetchEmotionalPatterns()}
                          className="mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded text-sm font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-3 italic">
                      📊 Based on your recent journal entries and weekly reflections
                    </p>
                  </div>
                )}

                {/* AI Insights */}
                {aiInsights && (
                  <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4 border border-violet-100 dark:border-violet-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <h3 className="text-lg font-medium text-violet-900 dark:text-violet-200">AI Insights</h3>
                      <button
                        onClick={() => generateAIInsights()}
                        disabled={isLoadingInsights}
                        className="ml-auto px-2 py-1 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Refresh AI insights"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingInsights ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.map((insight, index) => (
                        <div key={index} className="bg-white/70 dark:bg-gray-600/50 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                          <div className="flex items-start space-x-3">
                            <div className="p-1 rounded-full bg-violet-100 dark:bg-violet-800">
                              <Brain className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-violet-800 dark:text-violet-200 mb-1">{insight.insight}</p>
                              <p className="text-xs text-violet-600 dark:text-violet-300 italic">{insight.context}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-violet-600 dark:text-violet-300 mt-3 italic">
                      AI analysis of your emotional journey and growth patterns
                    </p>
                  </div>
                )}

                {isLoadingInsights && (
                  <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4 border border-violet-100 dark:border-violet-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 dark:border-violet-400 border-t-transparent"></div>
                      <span className="text-violet-900 dark:text-violet-200">Analyzing your emotional patterns...</span>
                    </div>
                  </div>
                )}

                {/* Generating Prompt Indicator */}
                {isGeneratingPrompt && (
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4 border border-rose-100 dark:border-rose-800">
                    <div className="flex items-center space-x-2 mb-4">
                      <RefreshCw className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-spin" />
                      <span className="text-rose-900 dark:text-rose-200">Crafting your personalized reflection prompt...</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitReflection}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your Reflection
                    </label>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="Take your time to reflect... there's no rush."
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-400 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      rows={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !reflection.trim()}
                    className="w-full bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save My Reflection'}
                  </button>
                </form>
              </>
            ) : null}
          </div>

          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-gray-700 shadow-lg">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6">Your Reflection Journey</h2>

            <div className="space-y-4">
              {(() => {
                const checkins = userCheckins.length > 0 ? userCheckins.slice(0, 5) : 
                  JSON.parse(localStorage.getItem('weekly-checkins') || '[]')
                    .filter(checkin => checkin.userId === (user.uid || user.id))
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);

                console.log('Past reflections check-ins:', checkins);
                console.log('User ID for filtering:', user.uid || user.id);
                console.log('All check-ins in localStorage:', JSON.parse(localStorage.getItem('weekly-checkins') || '[]'));

                if (checkins.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-300">Your past reflections will appear here</p>
                    </div>
                  );
                }

                return checkins.map((checkin, index) => (
                  <div key={checkin._id || index} className="border border-slate-100 dark:border-gray-600 rounded-lg p-4 bg-slate-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(checkin.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {checkin.aiAnalysis && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                            <Brain className="w-3 h-3" />
                            <span>AI Analyzed</span>
                          </div>
                        )}
                        <Sparkles className="w-4 h-4 text-rose-300 dark:text-rose-400" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap break-words">
                      <strong>Prompt:</strong> {checkin.prompt}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words mb-3">
                      {checkin.reflection}
                    </p>
                    {checkin.aiAnalysis && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">AI Analysis</span>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words">
                          {checkin.aiAnalysis}
                        </p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCheckinsPage;