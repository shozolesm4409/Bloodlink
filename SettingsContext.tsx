
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BadgeConfig, SocialMediaConfig } from './types';
import { getBadgeConfig, getLandingConfig, getSocialMediaConfig } from './services/api';

interface SettingsContextType {
  badgeConfig: BadgeConfig;
  socialMediaConfig: SocialMediaConfig;
  softwareVersion: string;
  loading: boolean;
  refreshBadgeConfig: () => Promise<void>;
  refreshLandingConfig: () => Promise<void>;
  refreshSocialMediaConfig: () => Promise<void>;
}

export const defaultBadgeConfig: BadgeConfig = {
  diamond: { name: 'Diamond', color: 'text-cyan-500' },
  platinum: { name: 'Platinum', color: 'text-emerald-500' },
  gold: { name: 'Gold', color: 'text-amber-500' },
  silver: { name: 'Silver', color: 'text-slate-400' },
  customRanks: [
    { id: 'level_1', name: 'Level 1', status: 'active', icon: 'Star', pointsRequired: 1, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { id: 'level_2', name: 'Level 2', status: 'active', icon: 'TwoStars', pointsRequired: 2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'level_3', name: 'Level 3', status: 'active', icon: 'ThreeStars', pointsRequired: 3, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'vanguard', name: 'Vanguard', status: 'active', icon: 'Award', pointsRequired: 5, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
    { id: 'elite', name: 'Elite', status: 'active', icon: 'Medal', pointsRequired: 7, color: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { id: 'legendary', name: 'Legendary', status: 'active', icon: 'Crown', pointsRequired: 10, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' }
  ],
  verificationBadgeColor: 'text-cyan-500',
  roleBadgeColors: {
    superadmin: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
    admin: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    editor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children?: ReactNode }) => {
  const [badgeConfig, setBadgeConfig] = useState<BadgeConfig>(defaultBadgeConfig);
  const [socialMediaConfig, setSocialMediaConfig] = useState<SocialMediaConfig>({ links: [] });
  const [softwareVersion, setSoftwareVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchBadgeConfig = async () => {
    try {
      const config = await getBadgeConfig();
      if (config) {
        setBadgeConfig(prev => ({ ...prev, ...config }));
      }
    } catch (e) {
      console.error("Failed to fetch badge config:", e);
    }
  };

  const fetchSocialMediaConfig = async () => {
    try {
      const config = await getSocialMediaConfig();
      if (config) {
        setSocialMediaConfig(config);
      }
    } catch (e) {
      console.error("Failed to fetch social media config:", e);
    }
  };

  const fetchLandingConfig = async () => {
    try {
      const config = await getLandingConfig();
      if (config && config.softwareVersion) {
        setSoftwareVersion(config.softwareVersion);
      }
    } catch (e) {
      console.error("Failed to fetch landing config:", e);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchBadgeConfig(), fetchLandingConfig(), fetchSocialMediaConfig()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      badgeConfig, 
      socialMediaConfig,
      softwareVersion, 
      loading, 
      refreshBadgeConfig: fetchBadgeConfig,
      refreshLandingConfig: fetchLandingConfig,
      refreshSocialMediaConfig: fetchSocialMediaConfig
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
