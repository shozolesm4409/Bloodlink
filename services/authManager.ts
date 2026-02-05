
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from '@firebase/auth';
import { auth } from './firebase';
import { getUserProfile, logoutUser } from './api';
import { User, AuthState } from '../types';

const SESSION_DURATION = 7200000; // 2 hours
const SESSION_START_KEY = 'bloodlink_session_start';

// Simple pub-sub for auth changes
let currentUser: User | null = null;
let isAuthenticated = false;
let authLoading = true;
const listeners = new Set<(state: AuthState) => void>();

const notify = () => {
  listeners.forEach(l => l({ user: currentUser, isAuthenticated, token: null }));
};

// Auto-logout checker
const checkSession = () => {
  const startTimeStr = localStorage.getItem(SESSION_START_KEY);
  if (startTimeStr && isAuthenticated) {
    const startTime = parseInt(startTimeStr);
    if (!isNaN(startTime) && (Date.now() - startTime > SESSION_DURATION)) {
      handleLogout();
    }
  }
};

export const handleLogout = async () => {
  const oldUser = currentUser;
  currentUser = null;
  isAuthenticated = false;
  localStorage.removeItem(SESSION_START_KEY);
  notify();
  await logoutUser(oldUser);
};

// Initialize Firebase Auth Listener
onAuthStateChanged(auth, async (firebaseUser) => {
  authLoading = true;
  if (firebaseUser) {
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        const startTimeStr = localStorage.getItem(SESSION_START_KEY);
        if (startTimeStr) {
          const startTime = parseInt(startTimeStr);
          if (!isNaN(startTime) && (Date.now() - startTime > SESSION_DURATION)) {
            await handleLogout();
          } else {
            currentUser = profile;
            isAuthenticated = true;
          }
        } else {
          localStorage.setItem(SESSION_START_KEY, Date.now().toString());
          currentUser = profile;
          isAuthenticated = true;
        }
      }
    } catch (e) {
      console.error("Auth init error:", e);
    }
  } else {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem(SESSION_START_KEY);
  }
  authLoading = false;
  notify();
});

// Run session check every minute
setInterval(checkSession, 60000);

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({ 
    user: currentUser, 
    isAuthenticated, 
    token: null 
  });
  const [loading, setLoading] = useState(authLoading);

  useEffect(() => {
    const listener = (newState: AuthState) => {
      setState(newState);
      setLoading(false);
    };
    listeners.add(listener);
    // If auth already finished, update local loading state
    if (!authLoading) setLoading(false);
    
    return () => { listeners.delete(listener); };
  }, []);

  return { ...state, loading, logout: handleLogout };
};

export const updateLocalUser = (user: User) => {
  currentUser = user;
  notify();
};

export const setLocalLogin = (user: User) => {
  localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  currentUser = user;
  isAuthenticated = true;
  notify();
};
