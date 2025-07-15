// file :demo-counter-app/components/features/counter/counter-setup.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Loader2 } from "lucide-react";
import { usePaymaster } from "@/context/PaymasterContext";
import { useSmartAccount } from "@/context/SmartAccountContext";
import { PaymasterSettings } from "../paymaster/paymaster-settings";

export function CounterSetup() {
  const { paymasterConfig, isConfigured: paymasterConfigured } = usePaymaster();
  const { smartAccountClient, isLoading: smartAccountLoading } =
    useSmartAccount();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Settings className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Setup Required</p>

          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span>Paymaster Configuration:</span>
              <span
                className={
                  paymasterConfigured ? "text-green-600" : "text-red-600"
                }
              >
                {paymasterConfigured ? "✅ Configured" : "❌ Required"}
              </span>
            </div>

            {paymasterConfigured && (
              <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                Pool ID: #{paymasterConfig?.poolId}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span>Smart Account Client:</span>
              <span
                className={
                  smartAccountClient
                    ? "text-green-600"
                    : smartAccountLoading
                      ? "text-yellow-600"
                      : "text-red-600"
                }
              >
                {smartAccountClient
                  ? "✅ Ready"
                  : smartAccountLoading
                    ? "⏳ Creating..."
                    : "❌ Waiting"}
              </span>
            </div>

            {smartAccountLoading && (
              <div className="flex items-center justify-center text-xs text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Creating smart account with paymaster...
              </div>
            )}
          </div>

          {!paymasterConfigured && (
            <PaymasterSettings>
              <Button size="sm" className="w-full">
                Configure Paymaster (Required)
              </Button>
            </PaymasterSettings>
          )}

          {paymasterConfigured &&
            !smartAccountClient &&
            !smartAccountLoading && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                Smart account creation failed. Please try reconfiguring
                paymaster.
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
