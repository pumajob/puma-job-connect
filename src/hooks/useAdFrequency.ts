import { useState, useEffect, useCallback } from 'react';

interface AdFrequencyConfig {
  maxSessionImpressions: number;
  maxDailyImpressions: number;
  cooldownSeconds: number;
}

interface AdFrequencyState {
  sessionImpressions: number;
  dailyImpressions: number;
  lastImpressionTime: number;
  dailyResetDate: string;
}

const DEFAULT_CONFIG: AdFrequencyConfig = {
  maxSessionImpressions: 12,
  maxDailyImpressions: 30,
  cooldownSeconds: 60,
};

const STORAGE_KEY = 'ad_frequency_state';

const getToday = () => new Date().toISOString().split('T')[0];

const getStoredState = (): AdFrequencyState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as AdFrequencyState;
      // Reset daily count if it's a new day
      if (state.dailyResetDate !== getToday()) {
        return {
          sessionImpressions: 0,
          dailyImpressions: 0,
          lastImpressionTime: 0,
          dailyResetDate: getToday(),
        };
      }
      return state;
    }
  } catch (e) {
    console.error('Error reading ad frequency state:', e);
  }
  return {
    sessionImpressions: 0,
    dailyImpressions: 0,
    lastImpressionTime: 0,
    dailyResetDate: getToday(),
  };
};

export const useAdFrequency = (config: Partial<AdFrequencyConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<AdFrequencyState>(getStoredState);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Calculate cooldown remaining
  useEffect(() => {
    const updateCooldown = () => {
      const now = Date.now();
      const timeSinceLastImpression = (now - state.lastImpressionTime) / 1000;
      const remaining = Math.max(0, fullConfig.cooldownSeconds - timeSinceLastImpression);
      setCooldownRemaining(Math.ceil(remaining));
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [state.lastImpressionTime, fullConfig.cooldownSeconds]);

  // Check if we can show an ad
  const canShowAd = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastImpression = (now - state.lastImpressionTime) / 1000;

    // Check cooldown
    if (state.lastImpressionTime > 0 && timeSinceLastImpression < fullConfig.cooldownSeconds) {
      return false;
    }

    // Check session limit
    if (state.sessionImpressions >= fullConfig.maxSessionImpressions) {
      return false;
    }

    // Check daily limit
    if (state.dailyImpressions >= fullConfig.maxDailyImpressions) {
      return false;
    }

    return true;
  }, [state, fullConfig]);

  // Record an ad impression
  const recordImpression = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionImpressions: prev.sessionImpressions + 1,
      dailyImpressions: prev.dailyImpressions + 1,
      lastImpressionTime: Date.now(),
    }));
  }, []);

  // Get remaining limits
  const getRemainingLimits = useCallback(() => ({
    sessionRemaining: Math.max(0, fullConfig.maxSessionImpressions - state.sessionImpressions),
    dailyRemaining: Math.max(0, fullConfig.maxDailyImpressions - state.dailyImpressions),
    cooldownRemaining,
  }), [state, fullConfig, cooldownRemaining]);

  // Reset session count (call on page load/refresh)
  const resetSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionImpressions: 0,
    }));
  }, []);

  return {
    canShowAd,
    recordImpression,
    getRemainingLimits,
    resetSession,
    cooldownRemaining,
    state,
  };
};
