import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Heart, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const GentleReminder = ({ className = '' }) => {
  const { user } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderType, setReminderType] = useState(null);
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowReminder(false);
      return;
    }

    const today = new Date().toDateString();
    const dismissedKey = `reminder-dismissed-${user.id}`;
    const dismissedDate = localStorage.getItem(dismissedKey);

    if (dismissedDate === today) {
      setDismissedToday(true);
      setShowReminder(false);
      return;
    }

    setDismissedToday(false);

    const lastCheckin = localStorage.getItem(`weekly-checkin-${user.id}`);
    let shouldShowReminder = false;
    let type = null;

    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin);
      const now = new Date();
      const daysSinceCheckin = Math.floor((now - lastCheckinDate) / (1000 * 60 * 60 * 24));

      if (daysSinceCheckin >= 7) {
        type = 'weekly-checkin';
        shouldShowReminder = true;
      }
    } else {
      const userCreated = localStorage.getItem(`user-created-${user.id}`);
      if (userCreated) {
        const createdDate = new Date(userCreated);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (daysSinceCreation >= 3 && daysSinceCreation <= 7) {
          type = 'welcome';
          shouldShowReminder = true;
        }
      }
    }

    if (!shouldShowReminder) {
      const lastJournalEntry = localStorage.getItem(`last-journal-${user.id}`);
      if (lastJournalEntry) {
        const lastEntryDate = new Date(lastJournalEntry);
        const now = new Date();
        const daysSinceEntry = Math.floor((now - lastEntryDate) / (1000 * 60 * 60 * 24));

        if (daysSinceEntry >= 3) {
          type = 'journal-streak';
          shouldShowReminder = true;
        }
      }
    }

    setReminderType(type);
    setShowReminder(shouldShowReminder);
  }, [user]);

  const dismissReminder = () => {
    if (user) {
      const today = new Date().toDateString();
      localStorage.setItem(`reminder-dismissed-${user.id}`, today);
      setDismissedToday(true);
    }
    setShowReminder(false);
  };

  const getReminderContent = () => {
    switch (reminderType) {
      case 'weekly-checkin':
        return {
          icon: <Calendar className="w-4 h-4 text-blue-500" />,
          title: "Time for your weekly reflection",
          message: "It's been a week since your last check-in. How has your heart been?",
          link: "/weekly-checkins",
          linkText: "Reflect now",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800"
        };

      case 'welcome':
        return {
          icon: <Heart className="w-4 h-4 text-rose-500" />,
          title: "Welcome to your journaling journey",
          message: "Consider starting with a gentle weekly check-in to set your intentions.",
          link: "/weekly-checkins",
          linkText: "Begin here",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200",
          textColor: "text-rose-800"
        };

      case 'journal-streak':
        return {
          icon: <Bell className="w-4 h-4 text-amber-500" />,
          title: "Your thoughts are waiting",
          message: "It's been a few days since your last entry. Your journal misses you.",
          link: "/journal",
          linkText: "Write something",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-800"
        };

      default:
        return null;
    }
  };

  if (!showReminder || dismissedToday || !user) return null;

  const content = getReminderContent();
  if (!content) return null;

  return (
    <div className={`${content.bgColor} ${content.borderColor} border rounded-lg p-3 mb-4 relative ${className}`}>
      <button
        onClick={dismissReminder}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss reminder"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-start space-x-3 pr-6">
        <div className="flex-shrink-0 mt-0.5">
          {content.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${content.textColor} mb-1`}>
            {content.title}
          </h4>
          <p className={`text-xs ${content.textColor} opacity-80 mb-2 leading-relaxed`}>
            {content.message}
          </p>
          <Link
            to={content.link}
            onClick={dismissReminder}
            className={`text-xs font-medium ${content.textColor} hover:opacity-80 underline transition-opacity`}
          >
            {content.linkText} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GentleReminder;