import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from './services/firebase';
import { AuthContext } from './contexts/authContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          isAnonymous: firebaseUser.isAnonymous,
          created_at: firebaseUser.metadata.creationTime
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        isAnonymous: false
      };
    } catch (error) {
      const errorCode = error.code;
      switch (errorCode) {
        case 'auth/user-not-found':
          throw new Error('No account found with this email address. Please check your email or sign up for a new account.');
        case 'auth/wrong-password':
          throw new Error('Incorrect password. Please double-check your password and try again.');
        case 'auth/invalid-email':
          throw new Error('Invalid email address format. Please enter a valid email address.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled. Please contact support for assistance.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed login attempts. Please wait a few minutes before trying again.');
        case 'auth/invalid-credential':
          throw new Error('Invalid login credentials. Please check your email and password.');
        case 'auth/account-exists-with-different-credential':
          throw new Error('An account already exists with this email using a different sign-in method.');
        case 'auth/invalid-verification-code':
          throw new Error('Invalid verification code. Please request a new one.');
        case 'auth/invalid-verification-id':
          throw new Error('Invalid verification ID. Please try signing in again.');
        case 'auth/missing-verification-code':
          throw new Error('Verification code is required. Please enter the code sent to your device.');
        case 'auth/quota-exceeded':
          throw new Error('Service temporarily unavailable due to high demand. Please try again later.');
        case 'auth/network-request-failed':
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        case 'auth/timeout':
          throw new Error('Request timed out. Please check your connection and try again.');
        default:
          console.error('Firebase auth error:', error.code, error.message);
          throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  };

  const signup = async (email, password, name) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's display name if provided
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: name || userCredential.user.email?.split('@')[0] || 'User',
        isAnonymous: false
      };
    } catch (error) {
      // Note: error variable is used in switch statement and default case logging
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new Error('An account with this email already exists. Please try logging in instead.');
        case 'auth/invalid-email':
          throw new Error('Invalid email address format. Please enter a valid email address.');
        case 'auth/weak-password':
          throw new Error('Password is too weak. Please choose a stronger password with at least 6 characters.');
        case 'auth/operation-not-allowed':
          throw new Error('Email/password accounts are not enabled. Please contact support.');
        case 'auth/invalid-credential':
          throw new Error('Invalid signup information. Please check your email and try again.');
        case 'auth/network-request-failed':
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        case 'auth/timeout':
          throw new Error('Request timed out. Please check your connection and try again.');
        default:
          console.error('Firebase signup error:', error.code, error.message);
          throw new Error('Signup failed. Please try again.');
      }
    }
  };

  const loginAnonymously = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      return {
        id: userCredential.user.uid,
        email: null,
        name: 'Anonymous User',
        isAnonymous: true
      };
    } catch (error) {
      console.error('Anonymous login error:', error);
      throw new Error('Anonymous login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      loginAnonymously,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};