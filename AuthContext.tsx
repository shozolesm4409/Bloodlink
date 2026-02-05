
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthManager, updateLocalUser, setLocalLogin, handleLogout } from './services/authManager';
import { User, AuthState } from './types';

interface AuthContextType extends AuthState {
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuthManager();

  const login = (user: User) => {
    setLocalLogin(user);
  };

  const updateUser = (user: User) => {
    updateLocalUser(user);
  };

  const logout = async () => {
    await handleLogout();
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
