import React from 'react';

export const MILESTONES = {
  FIRST_ENTRY: {
    id: 'first_entry',
    title: 'First Steps',
    description: 'You wrote your first journal entry!',
    icon: '✍️',
    condition: (stats) => stats.total_entries >= 1,
    type: 'entries'
  },
  TEN_ENTRIES: {
    id: 'ten_entries',
    title: 'Getting Started',
    description: '10 entries down - you\'re building a habit!',
    icon: '🌱',
    condition: (stats) => stats.total_entries >= 10,
    type: 'entries'
  },
  FIFTY_ENTRIES: {
    id: 'fifty_entries',
    title: 'Half Century',
    description: '50 entries! You\'re becoming a journaling pro.',
    icon: '📚',
    condition: (stats) => stats.total_entries >= 50,
    type: 'entries'
  },
  ONE_HUNDRED_ENTRIES: {
    id: 'one_hundred_entries',
    title: 'Century Club',
    description: '100 entries! You\'ve created a meaningful record of your journey.',
    icon: '🎯',
    condition: (stats) => stats.total_entries >= 100,
    type: 'entries'
  },
  TWO_HUNDRED_ENTRIES: {
    id: 'two_hundred_entries',
    title: 'Double Century',
    description: '200 entries! Your journal is becoming a treasure trove of insights.',
    icon: '💎',
    condition: (stats) => stats.total_entries >= 200,
    type: 'entries'
  },

  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    title: 'Week Warrior',
    description: '7 consecutive days of journaling! You\'re building momentum.',
    icon: '🔥',
    condition: (stats) => stats.streak_days >= 7,
    type: 'streak'
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    title: 'Monthly Master',
    description: '30 consecutive days! You\'ve established a powerful habit.',
    icon: '⚡',
    condition: (stats) => stats.streak_days >= 30,
    type: 'streak'
  },
  ONE_HUNDRED_DAY_STREAK: {
    id: 'one_hundred_day_streak',
    title: 'Century Streak',
    description: '100 consecutive days! You\'re unstoppable.',
    icon: '🚀',
    condition: (stats) => stats.streak_days >= 100,
    type: 'streak'
  },

  HIGH_MOOD_MAINTAINED: {
    id: 'high_mood_maintained',
    title: 'Mood Master',
    description: 'You\'ve maintained an average mood above 8/10!',
    icon: '⭐',
    condition: (stats) => stats.avg_mood >= 8,
    type: 'mood'
  },

  CONSISTENT_JOURNALER: {
    id: 'consistent_journaler',
    title: 'Consistency Champion',
    description: 'You\'ve been journaling regularly for weeks!',
    icon: '🎖️',
    condition: (stats) => stats.total_entries >= 30 && stats.streak_days >= 14,
    type: 'consistency'
  }
};

export const getNewMilestones = (stats, seenMilestones = []) => {
  if (!stats) return [];

  return Object.values(MILESTONES).filter(milestone =>
    milestone.condition(stats) && !seenMilestones.includes(milestone.id)
  );
};

export const getAchievedMilestones = (stats) => {
  if (!stats) return [];

  return Object.values(MILESTONES).filter(milestone =>
    milestone.condition(stats)
  );
};

export const markMilestonesAsSeen = (milestoneIds) => {
  const seen = JSON.parse(localStorage.getItem('seen_milestones') || '[]');
  const updated = [...new Set([...seen, ...milestoneIds])];
  localStorage.setItem('seen_milestones', JSON.stringify(updated));
  return updated;
};

export const getSeenMilestones = () => {
  return JSON.parse(localStorage.getItem('seen_milestones') || '[]');
};