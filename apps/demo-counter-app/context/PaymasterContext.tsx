// file :demo-counter-app/context/PaymasterContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Identity } from "@semaphore-protocol/core";
import type { PaymasterConfig } from "@/types/paymaster";
import { usePaymasterStorage } from "@/hooks/use-paymaster-storage";

interface PaymasterContextType {
  // State
  paymasterConfig: PaymasterConfig | null;
  semaphoreIdentity: Identity | null;
  isConfigured: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  setPaymasterConfig: (data: PaymasterConfig) => void;
  clearPaymasterConfig: () => void;
  clearError: () => void;
}

const PaymasterContext = createContext<PaymasterContextType | undefined>(
  undefined,
);

export function PaymasterProvider({ children }: { children: ReactNode }) {
  const {
    config,
    identity,
    isConfigured,
    error,
    isInitialized,
    setConfig,
    clearConfig,
    clearError,
  } = usePaymasterStorage();

  const value: PaymasterContextType = {
    // State
    paymasterConfig: config,
    semaphoreIdentity: identity,
    isConfigured,
    error,
    isInitialized,

    // Actions
    setPaymasterConfig: setConfig,
    clearPaymasterConfig: clearConfig,
    clearError,
  };

  return (
    <PaymasterContext.Provider value={value}>
      {children}
    </PaymasterContext.Provider>
  );
}

export function usePaymaster() {
  const context = useContext(PaymasterContext);
  if (context === undefined) {
    throw new Error("usePaymaster must be used within a PaymasterProvider");
  }
  return context;
}
