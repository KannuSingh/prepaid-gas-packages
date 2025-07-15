// file :demo-counter-app/hooks/use-paymaster-storage.ts
import { useState, useEffect } from 'react';
import { Identity } from '@semaphore-protocol/core';
import type { PaymasterConfig } from '@/types/paymaster';
import { STORAGE_KEYS } from '@/constants/config';

const STORAGE_KEY = STORAGE_KEYS.paymasterConfig;

export function usePaymasterStorage() {
  const [config, setConfigState] = useState<PaymasterConfig | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedConfig: PaymasterConfig = JSON.parse(stored);
          // Parse the semaphore identity
          const identity = Identity.import(parsedConfig.identity);

          setConfigState(parsedConfig);
          setIdentity(identity);
        }
      } catch (err) {
        console.error('Failed to load stored paymaster config:', err);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
        setError('Failed to load stored paymaster configuration');
      } finally {
        setIsInitialized(true);
      }
    };

    loadStoredData();
  }, []);

  const setConfig = (data: PaymasterConfig) => {
    try {
      setError(null);
      // Parse and validate the semaphore identity
      const identity = Identity.import(data.identity);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setConfigState(data);
      setIdentity(identity);
    } catch (err) {
      console.error('Failed to set paymaster config:', err);
      setError((err as Error).message || 'Failed to configure paymaster');
    }
  };

  const clearConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConfigState(null);
    setIdentity(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const isConfigured = config !== null && identity !== null;

  return {
    // State
    config,
    identity,
    isConfigured,
    error,
    isInitialized,

    // Actions
    setConfig,
    clearConfig,
    clearError,
  };
}
