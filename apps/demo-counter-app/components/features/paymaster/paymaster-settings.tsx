// file :demo-counter-app/components/features/paymaster/paymaster-settings.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings, CreditCard, AlertTriangle, Ticket, Cog } from "lucide-react";
import { Identity } from "@semaphore-protocol/core";
import { usePaymaster } from "@/context/PaymasterContext";
import { validatePaymasterConfig } from "@/lib/validation";
import type { PaymasterConfig } from "@/types/paymaster";
import { PaymasterStatus } from "./paymaster-status";
import { IdentityInput } from "./identity-input";
import { PoolSelector } from "./pool-selector";
import { DirectContextInput } from "./direct-context-input";

interface PaymasterSettingsProps {
  children?: React.ReactNode;
}

type ConfigurationMethod = "direct-context" | "manual";
type DialogStep =
  | "method-selection"
  | "direct-context"
  | "identity"
  | "pool-selection";

export function PaymasterSettings({ children }: PaymasterSettingsProps) {
  const { isConfigured, error, setPaymasterConfig, clearPaymasterConfig } =
    usePaymaster();

  const [isOpen, setIsOpen] = useState(false);
  const [configMethod, setConfigMethod] =
    useState<ConfigurationMethod>("direct-context");
  const [currentStep, setCurrentStep] =
    useState<DialogStep>("method-selection");
  const [isLoading, setIsLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step state
  const [semaphoreIdentity, setSemaphoreIdentity] = useState<Identity>();

  // Handle configuration method change
  const handleMethodSelection = (method: ConfigurationMethod) => {
    setConfigMethod(method);
    if (method === "direct-context") {
      setCurrentStep("direct-context");
    } else {
      setCurrentStep("identity");
    }
  };

  // Handle direct context input
  const handleDirectContextSubmit = async (contextConfig: {
    paymasterAddress: string;
    identity: Identity;
    paymasterContext: string;
  }) => {
    try {
      setIsLoading(true);
      setStepError(null);

      const newPaymasterConfig: PaymasterConfig = {
        identity: contextConfig.identity.export(),
        address: contextConfig.paymasterAddress,
        paymasterContext: contextConfig.paymasterContext,
      };

      // Validate the configuration
      const validation = validatePaymasterConfig(newPaymasterConfig);
      if (!validation.isValid) {
        setStepError(validation.errors.join(", "));
        return;
      }

      // Save configuration
      setPaymasterConfig(newPaymasterConfig);

      console.log("✅ Direct context configuration saved:", {
        paymasterAddress: contextConfig.paymasterAddress,
        identityCommitment: contextConfig.identity.commitment.toString(),
      });

      // Close dialog on success
      setIsOpen(false);
      resetDialog();
    } catch (error) {
      console.error("Direct context config error:", error);
      setStepError(
        error instanceof Error ? error.message : "Failed to save configuration",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual identity input
  const handleValidIdentity = (identity: Identity) => {
    setSemaphoreIdentity(identity);
    setCurrentStep("pool-selection");
  };

  // Handle manual pool selection
  const handleSelectPool = async (poolAddress: string) => {
    if (!semaphoreIdentity) {
      setStepError("No identity available");
      return;
    }

    try {
      setIsLoading(true);
      setStepError(null);

      // TODO: Generate actual paymasterContext based on poolId and identity
      // For now, using a placeholder - this needs the same encoding as web app
      const paymasterContext = `0x${poolAddress.padStart(64, "0")}`; // Temporary placeholder

      const newPaymasterConfig: PaymasterConfig = {
        identity: semaphoreIdentity.export(),
        address: poolAddress,
        paymasterContext: paymasterContext,
      };

      // Validate the configuration
      const validation = validatePaymasterConfig(newPaymasterConfig);
      if (!validation.isValid) {
        setStepError(validation.errors.join(", "));
        return;
      }

      // Save configuration
      setPaymasterConfig(newPaymasterConfig);

      // Close dialog on success
      setIsOpen(false);
      resetDialog();
    } catch (error) {
      console.error("Manual config error:", error);
      setStepError(
        error instanceof Error ? error.message : "Failed to save configuration",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setCurrentStep("method-selection");
    setConfigMethod("direct-context");
    setSemaphoreIdentity(undefined);
    setStepError(null);
    setIsLoading(false);
  };

  const handleClear = () => {
    clearPaymasterConfig();
    setIsOpen(false);
    resetDialog();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "direct-context":
        setCurrentStep("method-selection");
        break;
      case "identity":
        setCurrentStep("method-selection");
        break;
      case "pool-selection":
        setCurrentStep("identity");
        break;
      default:
        // Do nothing for method-selection
        break;
    }
  };

  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case "method-selection":
        return "Configure Paymaster";
      case "direct-context":
        return "Paste Gas Card Context";
      case "identity":
        return "Configure Identity";
      case "pool-selection":
        return "Select Paymaster Pool";
      default:
        return "Configure Paymaster";
    }
  };

  // Get dialog description based on current step
  const getDialogDescription = () => {
    switch (currentStep) {
      case "method-selection":
        return "Choose how you want to configure your paymaster setup.";
      case "direct-context":
        return "Paste the encoded context from your gas card for instant setup.";
      case "identity":
        return "Enter your Semaphore identity to find available paymaster pools.";
      case "pool-selection":
        return "Choose from your available paymaster pools found on-chain.";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="relative">
            <Settings className="h-4 w-4" />
            {!isConfigured && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Configuration Status */}
          {isConfigured && currentStep === "method-selection" && (
            <PaymasterStatus onClear={handleClear} />
          )}

          {/* Step Content */}
          {currentStep === "method-selection" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Choose Configuration Method
                </Label>
                <RadioGroup
                  value={configMethod}
                  onValueChange={(value) =>
                    setConfigMethod(value as ConfigurationMethod)
                  }
                  disabled={isLoading}
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem
                      value="direct-context"
                      id="direct-context"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="direct-context"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Ticket className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          Paste Gas Card Context
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quick setup using the encoded context from your web app
                        gas card
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem
                      value="manual"
                      id="manual"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="manual"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Cog className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          Manual Configuration
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter identity and select pool manually (advanced)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={() => handleMethodSelection(configMethod)}
                disabled={isLoading}
                className="w-full"
              >
                Continue with{" "}
                {configMethod === "direct-context"
                  ? "Quick Setup"
                  : "Manual Setup"}
              </Button>
            </div>
          )}

          {currentStep === "direct-context" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="self-start"
              >
                ← Back to Methods
              </Button>
              <DirectContextInput
                onValidContext={handleDirectContextSubmit}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentStep === "identity" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="self-start"
              >
                ← Back to Methods
              </Button>
              <IdentityInput
                onValidIdentity={handleValidIdentity}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentStep === "pool-selection" && semaphoreIdentity && (
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="self-start"
              >
                ← Back to Identity
              </Button>
              <PoolSelector
                identity={semaphoreIdentity}
                onBack={handleBack}
                onSelectPool={handleSelectPool}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Error Display */}
          {(stepError || error) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{stepError || error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
