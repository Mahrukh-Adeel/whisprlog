import JournalEntryForm from './JournalEntryForm';
import JournalEntriesList from './JournalEntriesList';
import { useAuth } from '../hooks/useAuth';
import { Heart } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const JournalPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-300 dark:border-rose-400 border-t-rose-400 dark:border-t-rose-500 mx-auto mb-4"></div>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-2 text-center">Your Journal</h1>
          <p className="text-slate-600 dark:text-slate-300 text-center">Share your thoughts in this safe, gentle space</p>
        </div>
        <JournalEntryForm />
        <JournalEntriesList />
      </div>
    </div>
  );
};

export default JournalPage;