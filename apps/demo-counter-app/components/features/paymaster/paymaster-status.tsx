// file :demo-counter-app/components/features/paymaster/paymaster-status.tsx
"use client";

import { CheckCircle } from "lucide-react";
import { usePaymaster } from "@/context/PaymasterContext";
import { Button } from "@/components/ui/button";

interface PaymasterStatusProps {
  onClear: () => void;
}

export function PaymasterStatus({ onClear }: PaymasterStatusProps) {
  const { paymasterConfig, isConfigured } = usePaymaster();

  if (!isConfigured || !paymasterConfig) {
    return null;
  }

  return (
    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Current Configuration</span>
      </div>
      <div className="text-xs text-green-600 dark:text-green-300 mt-1">
        <p>Pool ID: #{paymasterConfig.poolId}</p>
        <p>
          Identity: {paymasterConfig.identity.slice(0, 12)}...
          {paymasterConfig.identity.slice(-8)}
        </p>
      </div>
      <div className="mt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear Configuration
        </Button>
      </div>
    </div>
  );
}
