import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import AuthPage from './AuthPage';
import JournalPage from './components/JournalPage';
import WeeklyCheckinsPage from './components/WeeklyCheckinsPage';
import TrendsPage from './components/TrendsPage';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './contexts/themeContext.jsx';
import HelpPage from './components/HelpPage';
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import GoalTrackingTest from './components/GoalTrackingTest';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={
              <ProtectedRoute requireAuth={false}>
                <AuthPage />
              </ProtectedRoute>
            } />
            <Route path="/journal" element={
              <ProtectedRoute>
                <JournalPage />
              </ProtectedRoute>
            } />
            <Route path="/weekly-checkins" element={
              <ProtectedRoute>
                <WeeklyCheckinsPage />
              </ProtectedRoute>
            } />
            <Route path="/trends" element={
              <ProtectedRoute>
                <TrendsPage />
              </ProtectedRoute>
            } />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/test-goals" element={
              <ProtectedRoute>
                <GoalTrackingTest />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;