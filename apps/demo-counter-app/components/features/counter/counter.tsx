// file :demo-counter-app/components/features/counter/counter.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePaymaster } from "@/context/PaymasterContext";
import { useSmartAccount } from "@/context/SmartAccountContext";
import { useCounterValue } from "@/hooks/use-counter-value";
import { PaymasterSettings } from "../paymaster/paymaster-settings";
import { CounterSetup } from "./counter-setup";
import { CounterDisplay } from "./counter-display";
import { CounterActions } from "./counter-actions";
import { CounterStatus } from "./counter-status";
import { SmartAccountInfo } from "./smart-account-info";
import { ContractInfo } from "./contract-info";

export function Counter() {
  const { isConfigured: paymasterConfigured } = usePaymaster();
  const { smartAccountClient } = useSmartAccount();

  const counterHook = useCounterValue();

  // Both paymaster configuration AND smartAccountClient are required
  const isFullyConfigured = paymasterConfigured && smartAccountClient;

  // Show setup screen if not fully configured
  if (!isFullyConfigured) {
    return <CounterSetup />;
  }

  // Show main counter interface when ready
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <CardTitle className="text-lg">Counter DApp</CardTitle>
          </div>
          <div className="flex-1 flex justify-end">
            <PaymasterSettings />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <SmartAccountInfo />
        <CounterDisplay counterHook={counterHook} />
        <CounterActions counterHook={counterHook} />
        <CounterStatus />
        <ContractInfo />
      </CardContent>
    </Card>
  );
}
