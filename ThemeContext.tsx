import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleLightMode: () => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const theme: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(true);
  };

  const toggleLightMode = () => {
    setIsDarkMode(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const contextValue = useMemo(() => ({ 
    theme,
    isDarkMode, 
    toggleDarkMode, 
    toggleLightMode,
    toggleTheme
  }), [isDarkMode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
