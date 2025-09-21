import axios from 'axios';

export async function analyzeJournalEntryWithOpenAI(text) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!apiKey || !endpoint || !deployment) {
    console.warn('Azure OpenAI credentials not configured, using fallback analysis');
    return {
      sentiment: 'neutral',
      emotions: ['reflective'],
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      mood: 5
    };
  }

  const prompt = `Analyze this journal entry and provide emotional insights.

Journal Entry: "${text}"

Please analyze the emotional content and return a JSON object with:
- sentiment: "positive", "negative", or "neutral"
- emotions: array of 1-3 primary emotions expressed (e.g., ["joy", "anxiety", "gratitude", "sadness", "anger", "peace", "excitement", "worry", "love", "frustration"])
- summary: a brief 2-3 sentence summary of the entry's emotional content
- mood: a number from 1-10 representing overall mood (1=very negative, 10=very positive)

Return only valid JSON, no additional text.`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-03-15-preview`;

  try {
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: 'You are an emotional intelligence expert who analyzes journal entries for emotional content, sentiment, and mood. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const analysis = JSON.parse(content);

    return {
      sentiment: analysis.sentiment || 'neutral',
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : ['reflective'],
      summary: analysis.summary || text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      mood: typeof analysis.mood === 'number' && analysis.mood >= 1 && analysis.mood <= 10 ? analysis.mood : 5
    };
  } catch (error) {
    console.error('Error in analyzeJournalEntryWithOpenAI:', error);
    return {
      sentiment: 'neutral',
      emotions: ['reflective'],
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      mood: 5
    };
  }
}

export async function analyzeEmotionalTrends(entries) {
  try {
    if (entries.length === 0) {
      return {
        emotional_velocity: 0,
        resilience_score: 50,
        circadian_patterns: {},
        correlation_insights: {},
        predictive_insights: [],
        emotional_archetype: {
          name: 'Explorer',
          description: 'Beginning your emotional journey with curiosity and openness.',
          strengths: ['Curiosity', 'Openness', 'Willingness to reflect'],
          growth: 'Continue journaling to discover your unique emotional patterns.'
        },
        personalized_recommendations: ['Start your journaling journey', 'Reflect on your daily experiences'],
        dominant_themes: ['Self-discovery'],
        overall_trend: 'beginning'
      };
    }

    const moods = entries.map(entry => entry.analysis?.mood || 5).filter(mood => mood !== null);
    const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 5;

    const variance = moods.length > 1 ?
      moods.reduce((acc, mood) => acc + Math.pow(mood - avgMood, 2), 0) / moods.length : 0;
    const emotionalVelocity = Math.min(5, Math.sqrt(variance));

    const resilienceScore = Math.max(0, Math.min(100, 100 - (variance * 20)));

    const circadianPatterns = {};
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

    entries.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      let timeSlot;
      if (hour >= 5 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
      else if (hour >= 17 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';

      if (!circadianPatterns[timeSlot]) {
        circadianPatterns[timeSlot] = { count: 0, totalMood: 0 };
      }
      circadianPatterns[timeSlot].count++;
      circadianPatterns[timeSlot].totalMood += entry.analysis?.mood || 5;
    });

    Object.keys(circadianPatterns).forEach(slot => {
      const data = circadianPatterns[slot];
      data.avgMood = data.count > 0 ? data.totalMood / data.count : 5;
    });

    const correlationInsights = {
      reflectionDepth: Math.min(1, entries.length / 10),
      emotionalConsistency: Math.max(0, Math.min(1, 1 - (variance / 10))),
      weekendEffect: 0.1, // Placeholder
      socialImpact: 0.3 // Placeholder
    };

    const predictiveInsights = [];
    if (entries.length >= 3) {
      const recentTrend = entries.slice(-3).reduce((acc, entry, i) => {
        if (i > 0) {
          acc += (entry.analysis?.mood || 5) - (entries[entries.length - 4 + i]?.analysis?.mood || 5);
        }
        return acc;
      }, 0) / 2;

      if (recentTrend > 0.5) {
        predictiveInsights.push({
          title: 'Positive Momentum',
          prediction: 'Your mood has been trending upward recently',
          confidence: 75,
          type: 'improvement',
          timeframe: 'next week'
        });
      } else if (recentTrend < -0.5) {
        predictiveInsights.push({
          title: 'Support Opportunity',
          prediction: 'Consider reaching out for additional support this week',
          confidence: 70,
          type: 'decline',
          timeframe: 'next week'
        });
      } else {
        predictiveInsights.push({
          title: 'Stable Pattern',
          prediction: 'Your emotional patterns are relatively stable',
          confidence: 80,
          type: 'optimal_timing',
          timeframe: 'ongoing'
        });
      }
    }

    let archetype;
    if (avgMood > 7) {
      archetype = {
        name: 'Optimist',
        description: 'You tend to maintain a positive outlook and find joy in daily experiences.',
        strengths: ['Positivity', 'Resilience', 'Emotional awareness'],
        growth: 'Continue nurturing what brings you joy while staying open to all emotions.'
      };
    } else if (emotionalVelocity > 2) {
      archetype = {
        name: 'Navigator',
        description: 'You experience emotional fluctuations but show strong resilience in navigating them.',
        strengths: ['Adaptability', 'Self-awareness', 'Growth mindset'],
        growth: 'Your emotional journey is rich with learning opportunities.'
      };
    } else {
      archetype = {
        name: 'Steady Anchor',
        description: 'You maintain emotional stability and provide steady self-reflection.',
        strengths: ['Consistency', 'Reliability', 'Inner peace'],
        growth: 'Consider exploring new experiences to add variety to your emotional landscape.'
      };
    }

    return {
      emotional_velocity: Math.round(emotionalVelocity * 10) / 10,
      resilience_score: Math.round(resilienceScore),
      circadian_patterns: circadianPatterns,
      correlation_insights: correlationInsights,
      predictive_insights: predictiveInsights,
      emotional_archetype: archetype,
      personalized_recommendations: [
        'Continue your journaling practice',
        'Notice patterns in your emotional responses',
        'Celebrate small moments of growth'
      ],
      dominant_themes: ['self-reflection', 'emotional-awareness'],
      overall_trend: avgMood > 6 ? 'positive' : avgMood < 4 ? 'challenging' : 'balanced'
    };
  } catch (error) {
    console.error('Error in analyzeEmotionalTrends:', error);
    return {
      emotional_velocity: 0,
      resilience_score: 50,
      circadian_patterns: {},
      correlation_insights: {},
      predictive_insights: [],
      emotional_archetype: {
        name: 'Reflective',
        description: 'You are thoughtfully exploring your emotional world.',
        strengths: ['Self-reflection', 'Curiosity'],
        growth: 'Continue your journey of self-discovery.'
      },
      personalized_recommendations: ['Keep journaling', 'Be patient with yourself'],
      dominant_themes: ['reflection'],
      overall_trend: 'analyzing'
    };
  }
}

export async function generatePersonalizedPrompts(entries, currentMood = null, userStats = null, previousCheckins = []) {
  try {
    if (entries.length > 0 || previousCheckins.length > 0) {
      const hasRecentEntries = entries.length > 0;
      const hasPreviousCheckins = previousCheckins.length > 0;
      
      let personalizedPrompts = [];
      
      if (hasRecentEntries) {
        personalizedPrompts.push({
          prompt: "Reflecting on your recent journal entries, what patterns or themes have you noticed in your emotional journey this week?",
          focus: "Pattern recognition",
          estimated_time: "10 minutes"
        });
      }
      
      if (hasPreviousCheckins) {
        personalizedPrompts.push({
          prompt: "How have your weekly reflections evolved since your last check-in? What new insights have emerged?",
          focus: "Growth tracking",
          estimated_time: "12 minutes"
        });
      }
      
      if (userStats && userStats.totalEntries > 5) {
        personalizedPrompts.push({
          prompt: "With your growing collection of journal entries, what wisdom have you gained about yourself and your journey?",
          focus: "Self-discovery",
          estimated_time: "15 minutes"
        });
      }
      
      // Add some default prompts if we don't have enough personalized ones
      const defaultPrompts = [
        {
          prompt: "How have you been feeling this week? What moments brought you joy or peace?",
          focus: "Emotional awareness",
          estimated_time: "10 minutes"
        },
        {
          prompt: "What is one thing you're grateful for this week, no matter how small?",
          focus: "Gratitude practice",
          estimated_time: "5 minutes"
        },
        {
          prompt: "How have you been taking care of yourself lately?",
          focus: "Self-care reflection",
          estimated_time: "10 minutes"
        },
        {
          prompt: "What challenged you this week, and what did you learn from it?",
          focus: "Growth through challenges",
          estimated_time: "15 minutes"
        },
        {
          prompt: "What is one goal or intention you'd like to carry into the coming week?",
          focus: "Future planning",
          estimated_time: "10 minutes"
        }
      ];
      
      const allPrompts = [...personalizedPrompts, ...defaultPrompts];
      
      return allPrompts.slice(0, 5);
    }
    
    const prompts = [
      {
        prompt: "How have you been feeling this week? What moments brought you joy or peace?",
        focus: "Emotional awareness",
        estimated_time: "10 minutes"
      },
      {
        prompt: "What is one thing you're grateful for this week, no matter how small?",
        focus: "Gratitude practice",
        estimated_time: "5 minutes"
      },
      {
        prompt: "How have you been taking care of yourself lately?",
        focus: "Self-care reflection",
        estimated_time: "10 minutes"
      },
      {
        prompt: "What challenged you this week, and what did you learn from it?",
        focus: "Growth through challenges",
        estimated_time: "15 minutes"
      },
      {
        prompt: "What is one goal or intention you'd like to carry into the coming week?",
        focus: "Future planning",
        estimated_time: "10 minutes"
      }
    ];
    return prompts;
  } catch (error) {
    console.error('Error in generatePersonalizedPrompts:', error);
    return [{
      prompt: "How are you feeling today?",
      focus: "General reflection",
      estimated_time: "5 minutes"
    }];
  }
}

export async function analyzeEmotionalTriggers(entries) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  const entriesWithContext = entries.slice(-15).map(entry => ({
    content: entry.entry,
    mood: entry.analysis?.mood || 5,
    emotions: entry.analysis?.emotions || [],
    date: entry.createdAt.toISOString().split('T')[0],
    dayOfWeek: new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long' })
  }));

  const prompt = `Analyze these journal entries to identify emotional triggers, patterns, and coping mechanisms.

Entries:
${entriesWithContext.map((entry, i) => `${i + 1}. ${entry.date} (${entry.dayOfWeek}): Mood ${entry.mood}/10, Emotions: ${entry.emotions.join(', ')}\nContent: "${entry.content.substring(0, 200)}..."`).join('\n\n')}

Identify:
1. Positive triggers (what consistently improves mood)
2. Negative triggers (what tends to lower mood)
3. Coping strategies (how they handle challenges)
4. Time-based patterns (days/times when mood is typically higher/lower)
5. Recovery patterns (how quickly they bounce back)

Return JSON with: {positive_triggers: array, negative_triggers: array, coping_strategies: array, time_patterns: object, recovery_patterns: string}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-03-15-preview`;

  const response = await axios.post(
    url,
    {
      messages: [
        { role: 'system', content: 'You are an emotional intelligence expert who identifies patterns and triggers in personal experiences.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 700,
      temperature: 0.5,
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

export async function analyzeWeeklyCheckins(checkins, journalEntries = []) {
  try {
    if (checkins.length === 0) {
      return {
        growth_trajectory: {
          overall_progress: 'Just beginning your weekly check-in journey',
          key_milestones: ['First check-in completed'],
          areas_of_growth: ['Building consistency in self-reflection']
        },
        thematic_patterns: ['Initial reflections and self-discovery'],
        emotional_insights: {
          self_awareness_level: 6,
          emotional_patterns: ['Starting to explore personal experiences'],
          breakthrough_moments: ['Beginning regular self-reflection practice']
        },
        journal_checkin_connection: 'Weekly check-ins help consolidate daily journaling insights',
        personalized_suggestions: [
          'Continue with weekly reflections to build self-awareness',
          'Connect your daily experiences with weekly insights',
          'Use check-ins to identify patterns in your emotional journey'
        ],
        reflection_quality: {
          average_depth: 7,
          consistency_score: 8,
          improvement_areas: ['Exploring emotions more deeply']
        }
      };
    }

    const avgWordCount = checkins.reduce((sum, checkin) => sum + checkin.reflection.split(' ').length, 0) / checkins.length;
    
    return {
      growth_trajectory: {
        overall_progress: 'Developing self-reflection habits',
        key_milestones: [`${checkins.length} check-ins completed`],
        areas_of_growth: ['Emotional awareness', 'Self-reflection consistency']
      },
      thematic_patterns: ['Personal growth', 'Emotional exploration'],
      emotional_insights: {
        self_awareness_level: Math.min(10, 5 + checkins.length),
        emotional_patterns: ['Regular self-reflection practice'],
        breakthrough_moments: ['Consistent weekly check-in routine established']
      },
      journal_checkin_connection: 'Weekly check-ins complement daily journaling by providing broader perspective',
      personalized_suggestions: [
        'Continue building your weekly reflection habit',
        'Use insights from check-ins to inform daily journaling',
        'Explore how weekly patterns connect to daily experiences'
      ],
      reflection_quality: {
        average_depth: Math.min(10, 6 + (avgWordCount / 50)),
        consistency_score: Math.min(10, checkins.length * 2),
        improvement_areas: ['Deepening emotional exploration']
      }
    };
  } catch (error) {
    console.error('Error in analyzeWeeklyCheckins:', error);
    return {
      growth_trajectory: {
        overall_progress: 'Building self-awareness',
        key_milestones: ['Regular check-in practice'],
        areas_of_growth: ['Emotional intelligence']
      },
      thematic_patterns: ['Self-reflection'],
      emotional_insights: {
        self_awareness_level: 5,
        emotional_patterns: ['Developing reflection habits'],
        breakthrough_moments: ['Consistent practice established']
      },
      journal_checkin_connection: 'Weekly check-ins enhance daily journaling insights',
      personalized_suggestions: [
        'Keep up the great work with weekly reflections',
        'Use check-ins to guide your journaling practice',
        'Reflect on patterns in your emotional journey'
      ],
      reflection_quality: {
        average_depth: 6,
        consistency_score: 7,
        improvement_areas: ['Continuing to deepen reflections']
      }
    };
  }
}

export async function generateCheckinSuggestions(userCheckins, userEntries, currentPrompt) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  const recentCheckins = userCheckins.slice(-3).map(checkin => ({
    prompt: checkin.prompt,
    reflection: checkin.reflection,
    date: checkin.date
  }));

  const recentEntries = userEntries.slice(-5).map(entry => ({
    mood: entry.analysis?.mood || 5,
    emotions: entry.analysis?.emotions || [],
    summary: entry.analysis?.summary || entry.entry.substring(0, 100)
  }));

  const prompt = `Based on this user's recent check-ins and journal entries, provide intelligent suggestions and insights for their current weekly check-in.

Current Check-in Prompt: "${currentPrompt}"

Recent Check-ins:
${recentCheckins.map((checkin, i) => `Check-in ${i + 1}: "${checkin.prompt}" -> "${checkin.reflection.substring(0, 150)}..."`).join('\n')}

Recent Journal Entries:
${recentEntries.map((entry, i) => `Entry ${i + 1}: Mood ${entry.mood}/10, Emotions: ${entry.emotions.join(', ')}, "${entry.summary}"`).join('\n')}

Provide 3 thoughtful suggestions that:
1. Help them connect their current check-in to recent journal entries
2. Encourage deeper reflection based on their patterns
3. Guide them toward actionable insights

Return JSON array of objects with: {suggestion: string, type: "connection"|"depth"|"action", reasoning: string}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-03-15-preview`;

  const response = await axios.post(
    url,
    {
      messages: [
        { role: 'system', content: 'You are a wise reflection guide who helps users make meaningful connections between their weekly check-ins and daily experiences.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
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

export async function generatePersonalizedInsights(entries) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!entries || entries.length === 0) {
    return {
      currentTrendAnalysis: {
        message: "Welcome to your journaling journey! Every entry you make is a step toward understanding yourself better.",
        suggestion: "Start with whatever feels right for you today - there's no perfect way to begin.",
        type: "welcome"
      },
      journalingPatterns: {
        message: "You're just beginning this beautiful practice of self-reflection. Each entry builds on the last.",
        insight: "Your willingness to explore your inner world is already a significant achievement."
      },
      growthRecognition: {
        message: "Every time you choose to write here, you're choosing to honor your own experience and emotions.",
        celebration: "This act of self-care shows your commitment to personal growth."
      },
      personalizedSuggestion: {
        message: "Consider starting with something simple today - maybe noting one emotion you're feeling, or one thing you're grateful for.",
        encouragement: "Remember, there's no 'right' way to journal. Your authentic voice is what matters most."
      }
    };
  }

  const recentEntries = entries.slice(-15).map(entry => ({
    content: entry.entry,
    mood: entry.analysis?.mood || 5,
    emotions: entry.analysis?.emotions || [],
    sentiment: entry.analysis?.sentiment || 'neutral',
    date: entry.createdAt.toISOString().split('T')[0],
    dayOfWeek: new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long' }),
    wordCount: entry.entry.split(' ').length
  }));

  const totalEntries = entries.length;
  const avgMood = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;
  const moodTrend = recentEntries.length > 1 ?
    (recentEntries[recentEntries.length - 1].mood - recentEntries[0].mood) : 0;
  const avgWordCount = recentEntries.reduce((sum, entry) => sum + entry.wordCount, 0) / recentEntries.length;

  const uniqueDays = new Set(recentEntries.map(entry => entry.date)).size;
  const daysSpan = recentEntries.length > 1 ?
    Math.ceil((new Date(recentEntries[recentEntries.length - 1].date) - new Date(recentEntries[0].date)) / (1000 * 60 * 60 * 24)) + 1 : 1;
  const avgEntriesPerDay = uniqueDays > 0 ? (recentEntries.length / daysSpan).toFixed(1) : 0;

  const prompt = `You are a compassionate, insightful emotional intelligence guide. Analyze this user's journal entries and create 4 personalized insights that feel like a warm, understanding conversation.

USER'S JOURNALING CONTEXT:
- Total entries: ${totalEntries}
- Recent entries analyzed: ${recentEntries.length}
- Average mood (recent): ${avgMood.toFixed(1)}/10
- Mood trend: ${moodTrend > 0.5 ? 'improving' : moodTrend < -0.5 ? 'declining' : 'stable'}
- Average words per entry: ${avgWordCount.toFixed(0)}
- Journaling frequency: ${avgEntriesPerDay} entries per day over ${daysSpan} days

RECENT ENTRIES:
${recentEntries.map((entry, i) => `${i + 1}. ${entry.date} (${entry.dayOfWeek}): Mood ${entry.mood}/10, ${entry.wordCount} words
Emotions: ${entry.emotions.join(', ') || 'not analyzed'}
"${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}"`).join('\n\n')}

Create 4 personalized insights that feel like a caring conversation. Each insight should:

1. CURRENT TREND ANALYSIS: A warm observation about their recent emotional patterns and mood trends. Include a gentle suggestion.

2. JOURNALING PATTERNS: Notice their unique rhythm and style of journaling. Celebrate their individual approach.

3. GROWTH RECOGNITION: Acknowledge their journey and commitment to self-reflection. Highlight what's special about their process.

4. PERSONALIZED SUGGESTION: A thoughtful, specific suggestion based on their current patterns and recent entries.

Use warm, conversational language like "I notice...", "I can see...", "You've shown...", "Consider...". Make it feel personal and supportive, not generic advice.

Return JSON with this exact structure:
{
  "currentTrendAnalysis": {
    "message": "string",
    "suggestion": "string", 
    "type": "positive|concern|stable"
  },
  "journalingPatterns": {
    "message": "string",
    "insight": "string"
  },
  "growthRecognition": {
    "message": "string",
    "celebration": "string"
  },
  "personalizedSuggestion": {
    "message": "string",
    "encouragement": "string"
  }
}`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-03-15-preview`;

  try {
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: 'You are a compassionate emotional intelligence guide who creates deeply personalized insights that feel like a warm, understanding conversation with the user.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
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
  } catch (error) {
    console.error('Error generating personalized insights:', error);
    return {
      currentTrendAnalysis: {
        message: `Your recent entries show a mood around ${avgMood.toFixed(1)}/10, which is valuable information about your inner world.`,
        suggestion: "Continue sharing your authentic experiences - each entry helps you understand yourself better.",
        type: "stable"
      },
      journalingPatterns: {
        message: `I see you've been journaling about ${avgEntriesPerDay} times per day, creating a rhythm that works for you.`,
        insight: "Your consistent practice, even in small ways, builds meaningful self-awareness over time."
      },
      growthRecognition: {
        message: `You've created ${totalEntries} moments of self-reflection, each one showing your commitment to understanding your emotions.`,
        celebration: "This dedication to your inner world is a beautiful act of self-care."
      },
      personalizedSuggestion: {
        message: "Consider reflecting on what supports your well-being during challenging moments you've noted in your entries.",
        encouragement: "Your insights about yourself are becoming clearer with each entry you make."
      }
    };
  }
}