// file :demo-counter-app/context/SmartAccountContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { createSmartAccountClient } from "permissionless";
import { useSmartAccountCreation } from "@/hooks/use-smart-account-creation";
import { usePaymaster } from "./PaymasterContext";

type SmartAccountClient = any;

interface SmartAccountContextType {
  smartAccountClient?: SmartAccountClient;
  error: string | null;
  isLoading: boolean;
  createSmartAccount: () => Promise<void>;
  clearError: () => void;
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(
  undefined,
);

export function SmartAccountProvider({ children }: { children: ReactNode }) {
  // Get paymaster configuration from PaymasterContext
  const { paymasterConfig } = usePaymaster();

  const {
    smartAccountClient,
    error,
    isLoading,
    createSmartAccount,
    clearError,
  } = useSmartAccountCreation(paymasterConfig);

  const value: SmartAccountContextType = {
    smartAccountClient,
    error,
    isLoading,
    createSmartAccount,
    clearError,
  };

  return (
    <SmartAccountContext.Provider value={value}>
      {children}
    </SmartAccountContext.Provider>
  );
}

export function useSmartAccount() {
  const context = useContext(SmartAccountContext);
  if (context === undefined) {
    throw new Error(
      "useSmartAccount must be used within a SmartAccountProvider",
    );
  }
  return context;
}
