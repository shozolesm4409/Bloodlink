
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, UserRole } from './types';
import { auth } from './services/firebase';
import { getUserProfile, logoutUser } from './services/api';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  impersonateUser: (user: User) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    // Try to load cached user profile on initial render
    let cachedUser = null;
    try {
      const stored = localStorage.getItem('bloodlink_cached_user');
      if (stored) cachedUser = JSON.parse(stored);
    } catch(e) {}
    
    return {
      user: cachedUser,
      isAuthenticated: !!cachedUser,
      token: null,
      impersonatingAdmin: null
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          
          let userProfile = null;
          try {
            userProfile = await getUserProfile(firebaseUser.uid);
            // Cache the fresh profile
            localStorage.setItem('bloodlink_cached_user', JSON.stringify(userProfile));
          } catch (profileError) {
            console.error("Warning: could not fetch profile right now", profileError);
          }

          setState(prev => {
            const nextUser = userProfile ? userProfile : (prev.user?.id === firebaseUser.uid ? prev.user : null);
            
            if (nextUser) {
              return {
                ...prev,
                user: prev.impersonatingAdmin ? prev.user : nextUser,
                isAuthenticated: true,
                token: token,
                impersonatingAdmin: prev.impersonatingAdmin || null
              };
            }
            
            // Neither fetched nor cached
            localStorage.removeItem('bloodlink_cached_user');
            return { user: null, isAuthenticated: false, token: null, impersonatingAdmin: null };
          });
        } catch (error) {
          console.error("Auth token error:", error);
        }
      } else {
        localStorage.removeItem('bloodlink_cached_user');
        setState({ user: null, isAuthenticated: false, token: null, impersonatingAdmin: null });
      }
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      setLoading(prevLoading => {
        if (prevLoading) {
          console.warn("Auth state change timeout - forcing loading to false");
          return false;
        }
        return prevLoading;
      });
    }, 15000); // Increased timeout to 15s

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = (user: User) => {
    localStorage.setItem('bloodlink_cached_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  };

  const logout = async () => {
    try {
      await logoutUser(state.user);
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem('bloodlink_cached_user');
    setState({ user: null, isAuthenticated: false, token: null, impersonatingAdmin: null });
  };


  const impersonateUser = (targetUser: User) => {
    if (state.user?.role === UserRole.SUPERADMIN) {
      setState(prev => ({
        ...prev,
        user: targetUser,
        isAuthenticated: true,
        impersonatingAdmin: prev.impersonatingAdmin || prev.user
      }));
    }
  };

  const stopImpersonation = () => {
    if (state.impersonatingAdmin) {
      setState(prev => ({
        ...prev,
        user: prev.impersonatingAdmin || null,
        impersonatingAdmin: null
      }));
    }
  };

  const updateUser = (user: User) => {
    localStorage.setItem('bloodlink_cached_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, impersonateUser, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
