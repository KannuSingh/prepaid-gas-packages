// file :demo-counter-app/components/features/paymaster/identity-input.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Key, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Identity } from "@semaphore-protocol/core";
import { useIdentityValidation } from "@/hooks/use-identity-validation";

type IdentityInputType = "base64" | "mnemonic";

interface IdentityInputProps {
  onValidIdentity: (identity: Identity) => void;
  isLoading?: boolean;
}

export function IdentityInput({
  onValidIdentity,
  isLoading,
}: IdentityInputProps) {
  const [inputType, setInputType] = useState<IdentityInputType>("base64");
  const [base64Value, setBase64Value] = useState("");
  const [mnemonicValue, setMnemonicValue] = useState("");

  // Prevent concurrent operations that could cause infinite loops
  const isProcessingRef = useRef(false);

  const { validateIdentity, error } = useIdentityValidation();

  // Memoize the radio group change handler to prevent infinite loops
  const handleInputTypeChange = useCallback(
    (value: string) => {
      if (isProcessingRef.current || isLoading) return;
      setInputType(value as IdentityInputType);
    },
    [isLoading],
  );

  // Memoize textarea change handlers to prevent unnecessary re-renders
  const handleBase64Change = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isProcessingRef.current || isLoading) return;
      setBase64Value(e.target.value);
    },
    [isLoading],
  );

  const handleMnemonicChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isProcessingRef.current || isLoading) return;
      setMnemonicValue(e.target.value);
    },
    [isLoading],
  );

  const handleSubmit = useCallback(async () => {
    if (isProcessingRef.current || isLoading) return;

    isProcessingRef.current = true;
    try {
      const value = inputType === "base64" ? base64Value : mnemonicValue;
      const identity = await validateIdentity(value, inputType);
      if (identity) {
        onValidIdentity(identity);
      }
    } catch (error) {
      console.error("Identity validation error:", error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    inputType,
    base64Value,
    mnemonicValue,
    validateIdentity,
    onValidIdentity,
    isLoading,
  ]);

  const isValid =
    inputType === "base64"
      ? base64Value.trim().length > 0
      : mnemonicValue.trim().split(/\s+/).length === 12;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Choose Identity Input Method
        </Label>
        <RadioGroup
          value={inputType}
          onValueChange={handleInputTypeChange}
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="base64" id="base64" />
            <Label htmlFor="base64">Base64 Identity</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mnemonic" id="mnemonic" />
            <Label htmlFor="mnemonic">12-Word Mnemonic</Label>
          </div>
        </RadioGroup>
      </div>

      {inputType === "base64" ? (
        <div className="space-y-2">
          <Label htmlFor="base64-input" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Base64 Encoded Identity
          </Label>
          <Textarea
            id="base64-input"
            placeholder="Enter your base64 encoded Semaphore identity..."
            value={base64Value}
            onChange={handleBase64Change}
            disabled={isLoading}
            rows={3}
            className="font-mono text-sm"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="mnemonic-input" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            12-Word Mnemonic Phrase
          </Label>
          <Textarea
            id="mnemonic-input"
            placeholder="Enter your 12-word mnemonic phrase separated by spaces..."
            value={mnemonicValue}
            onChange={handleMnemonicChange}
            disabled={isLoading}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Enter all 12 words separated by spaces
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !isValid}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing Identity...
          </>
        ) : (
          <>
            Next: Search Groups
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
