import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './services/firebase';

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeFromQuery = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(modeFromQuery !== 'signup');

  useEffect(() => {
    setIsLogin(modeFromQuery !== 'signup');
  }, [modeFromQuery]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const navigate = useNavigate();
  const { login, signup, loginAnonymously } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return { isValid: false, message: 'Email is required' };
    if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' };
    return { isValid: true, message: '' };
  };

  const validatePassword = (password) => {
    if (!password) return { isValid: false, message: 'Password is required' };
    if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters long' };
    if (password.length < 8) return { isValid: false, message: 'Consider using a stronger password (8+ characters)' };
    return { isValid: true, message: '' };
  };

  const validateName = (name) => {
    if (!isLogin && !name.trim()) return { isValid: false, message: 'Name is required for signup' };
    return { isValid: true, message: '' };
  };

  // Handle input changes with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const validation = validateEmail(value);
    setFieldErrors(prev => ({ ...prev, email: validation.message }));
    setValidationStatus(prev => ({ ...prev, email: validation.isValid ? 'valid' : validation.message ? 'invalid' : '' }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const validation = validatePassword(value);
    setFieldErrors(prev => ({ ...prev, password: validation.message }));
    setValidationStatus(prev => ({ ...prev, password: validation.isValid ? 'valid' : validation.message ? 'invalid' : '' }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const validation = validateName(value);
    setFieldErrors(prev => ({ ...prev, name: validation.message }));
    setValidationStatus(prev => ({ ...prev, name: validation.isValid ? 'valid' : validation.message ? 'invalid' : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const nameValidation = validateName(name);

    const hasErrors = !emailValidation.isValid || !passwordValidation.isValid || !nameValidation.isValid;

    if (hasErrors) {
      setFieldErrors({
        email: emailValidation.message,
        password: passwordValidation.message,
        name: nameValidation.message
      });
      setError('Please fix the errors above and try again.');
      return;
    }

    setLoading(true);
    try {
      const isSignupMode = modeFromQuery === 'signup' || (!modeFromQuery && !isLogin);
      
      if (isSignupMode) {
        await signup(email, password, name || undefined);
        navigate('/journal');
      } else {
        await login(email, password);
        navigate('/journal');
      }
    } catch (error) {
      console.error('Auth error caught:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      if (error.message.includes('Invalid email') || error.message.includes('invalid-email')) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else if (error.message.includes('Invalid password') || error.message.includes('wrong-password')) {
        setFieldErrors(prev => ({ ...prev, password: 'Incorrect password. Please try again.' }));
      } else if (error.message.includes('already exists') || error.message.includes('email-already-in-use')) {
        setFieldErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
      } else if (error.message.includes('not found') || error.message.includes('user-not-found')) {
        setFieldErrors(prev => ({ ...prev, email: 'No account found with this email. Please sign up first.' }));
      }
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    const newMode = isLogin ? 'signup' : 'login';
    setSearchParams({ mode: newMode });
    setIsLogin(!isLogin);
    setError('');
    setFieldErrors({});
    setValidationStatus({});
    setEmail('');
    setPassword('');
    setName('');
    setShowForgotPassword(false);
    setResetEmail('');
    setResetMessage('');
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginAnonymously();
      navigate('/journal');
    } catch (error) {
      console.error('Anonymous login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetLoading(true);

    try {
      if (!resetEmail) {
        throw new Error('Please enter your email address');
      }

      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Check your inbox and follow the instructions.');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setResetMessage('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setResetMessage('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setResetMessage('Too many reset requests. Please try again later.');
          break;
        default:
          setResetMessage('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-rose-300 dark:text-rose-400 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-2">
            {isLogin ? 'Welcome Back' : 'Join WhisprLog'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {isLogin ? 'Continue your emotional journey' : 'Begin your journey of self-discovery'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-slate-600 shadow-lg">
          <div className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${
                    validationStatus.name === 'valid'
                      ? 'border-green-300 dark:border-green-600 focus:border-green-400 dark:focus:border-green-500'
                      : validationStatus.name === 'invalid'
                      ? 'border-red-300 dark:border-red-600 focus:border-red-400 dark:focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 focus:border-rose-300 dark:focus:border-rose-400'
                  }`}
                  placeholder="Your name"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${
                  validationStatus.email === 'valid'
                    ? 'border-green-300 dark:border-green-600 focus:border-green-400 dark:focus:border-green-500'
                    : validationStatus.email === 'invalid'
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 dark:focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 focus:border-rose-300 dark:focus:border-rose-400'
                }`}
                placeholder="your@email.com"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
              )}
              {validationStatus.email === 'valid' && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Valid email
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${
                  validationStatus.password === 'valid'
                    ? 'border-green-300 dark:border-green-600 focus:border-green-400 dark:focus:border-green-500'
                    : validationStatus.password === 'invalid'
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 dark:focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 focus:border-rose-300 dark:focus:border-rose-400'
                }`}
                placeholder="••••••••"
                required
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
              )}
              {validationStatus.password === 'valid' && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Strong password
                </p>
              )}
              {(modeFromQuery ? modeFromQuery === 'login' : isLogin) && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
            
                        <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-rose-400 hover:bg-rose-500 dark:bg-rose-400 dark:hover:bg-rose-500 disabled:bg-slate-300 dark:disabled:bg-slate-500 text-white py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium text-sm">Authentication Error</p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    {error.includes('not found') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-2">💡 Try signing up if you don't have an account yet.</p>
                    )}
                    {error.includes('already exists') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-2">💡 Try signing in instead if you already have an account.</p>
                    )}
                    {error.includes('password') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-2">💡 Use the "Forgot Password?" link if you've forgotten your password.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {/* Google login removed */}
              
                            <button
                onClick={handleAnonymousLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-rose-200 dark:hover:border-rose-400 transition-colors disabled:opacity-50"
              >
                <span className="text-slate-700 dark:text-slate-200">Continue Anonymously</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleModeSwitch}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-rose-300 dark:focus:border-rose-400 focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {resetMessage && (
              <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
                resetMessage.includes('sent')
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {resetMessage}
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;