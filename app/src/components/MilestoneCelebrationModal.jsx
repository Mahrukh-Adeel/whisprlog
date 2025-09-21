import React, { useState, useEffect } from 'react';
import { X, Trophy, Sparkles, Heart } from 'lucide-react';

const MilestoneCelebrationModal = ({ milestones, onClose, onMarkAsSeen }) => {
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  const [showConfetti] = useState(true);

  const currentMilestone = milestones[currentMilestoneIndex];

  useEffect(() => {
    if (milestones.length > 1 && currentMilestoneIndex < milestones.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMilestoneIndex(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentMilestoneIndex, milestones.length]);

  const handleClose = () => {
    onMarkAsSeen(milestones.map(m => m.id));
    onClose();
  };

  const handleNext = () => {
    if (currentMilestoneIndex < milestones.length - 1) {
      setCurrentMilestoneIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!currentMilestone) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'][Math.floor(Math.random() * 6)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full relative shadow-2xl border border-rose-200 dark:border-rose-800">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">{currentMilestone.icon}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                Achievement Unlocked
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {currentMilestone.title}
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {currentMilestone.description}
          </p>

          {milestones.length > 1 && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              {milestones.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentMilestoneIndex
                      ? 'bg-rose-500'
                      : index < currentMilestoneIndex
                      ? 'bg-rose-300'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex space-x-3">
            {milestones.length > 1 && currentMilestoneIndex < milestones.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Next Achievement
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrate!</span>
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                Keep Going!
              </span>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Every entry brings you closer to understanding yourself better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCelebrationModal;
