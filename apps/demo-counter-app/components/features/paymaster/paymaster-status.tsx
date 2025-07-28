// file :demo-counter-app/components/features/paymaster/paymaster-status.tsx
"use client";

import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import { usePaymaster } from "@/context/PaymasterContext";
import { Button } from "@/components/ui/button";
import { PrepaidGasPaymaster } from "@prepaid-gas/core";

interface PaymasterStatusProps {
  onClear: () => void;
}

// Helper function to determine paymaster type from address using PrepaidGasPaymaster
function getPaymasterType(address: string): string {
  try {
    // Base Sepolia chainId (update if supporting other networks)
    const chainId = 84532;
    const paymaster = PrepaidGasPaymaster.createForNetwork(chainId);
    const supportedPaymasters = paymaster.getSupportedPaymasters();
    
    const match = supportedPaymasters.find(
      (p) => p.address.toLowerCase() === address.toLowerCase()
    );
    
    if (match) {
      // Convert from technical names to user-friendly names
      switch (match.type) {
        case 'GasLimitedPaymaster':
          return 'Gas Limited';
        case 'OneTimeUsePaymaster':
          return 'One Time Use';
        case 'CacheEnabledGasLimitedPaymaster':
          return 'Cache Enabled';
        default:
          return match.type;
      }
    }
  } catch (error) {
    console.warn('Failed to determine paymaster type:', error);
  }
  
  return "Unknown";
}

// Helper function to truncate address for display
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PaymasterStatus({ onClear }: PaymasterStatusProps) {
  const { paymasterConfig, isConfigured } = usePaymaster();

  // Memoize paymaster type calculation to avoid re-creating client on every render
  const paymasterInfo = useMemo(() => {
    if (!paymasterConfig?.address) {
      return { type: "Unknown", truncatedAddress: "" };
    }

    return {
      type: getPaymasterType(paymasterConfig.address),
      truncatedAddress: truncateAddress(paymasterConfig.address),
    };
  }, [paymasterConfig?.address]);

  if (!isConfigured || !paymasterConfig) {
    return null;
  }

  return (
    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Paymaster Configured</span>
      </div>
      <div className="text-xs text-green-600 dark:text-green-300 mt-1 space-y-1">
        <p>Type: {paymasterInfo.type}</p>
        <p>Address: {paymasterInfo.truncatedAddress}</p>
      </div>
      <div className="mt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear Configuration
        </Button>
      </div>
    </div>
  );
}
