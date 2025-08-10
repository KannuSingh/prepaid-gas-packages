// file: apps/demo/components/features/paymaster/direct-context-input.tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ticket, ArrowRight, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Identity } from '@semaphore-protocol/core';
import { parsePaymasterContext } from '@prepaid-gas/core';
import { fromHex } from 'viem';

interface DirectContextInputProps {
  onValidContext: (config: { paymasterAddress: string; identity: Identity; paymasterContext: string }) => void;
  isLoading?: boolean;
}

export function DirectContextInput({ onValidContext, isLoading }: DirectContextInputProps) {
  const [contextValue, setContextValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isLoading || isProcessing) return;
      setContextValue(e.target.value);
      if (error) setError(null); // Clear error when user starts typing
    },
    [isLoading, isProcessing, error]
  );

  const handleSubmit = useCallback(async () => {
    if (isLoading || isProcessing || !contextValue.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Validate that the input looks like a hex string
      const trimmedContext = contextValue.trim();
      if (!trimmedContext.startsWith('0x')) {
        throw new Error("Paymaster context must be a hex string starting with '0x'");
      }

      // ✅ Use the new utility function instead of PaymasterDataService
      const parsedContext = parsePaymasterContext(trimmedContext as `0x${string}`);

      console.log('🔍 Raw parsed context:', parsedContext);

      // Validate that we have all required fields
      if (!parsedContext.paymasterAddress) {
        throw new Error('Missing paymaster address in context');
      }

      if (!parsedContext.identityHex) {
        throw new Error('Missing identity in context - this context may be from an older version');
      }

      // Convert bytes identity back to string
      let identityBase64: string;
      try {
        // The identityString is stored as hex bytes, we need to convert it back to string
        const identityHex = parsedContext.identityHex as `0x${string}`;

        // Try direct fromHex conversion first
        try {
          identityBase64 = fromHex(parsedContext.identityHex, 'string');
          console.log('🔍 Converted identity from hex bytes to string:', {
            hex: identityHex,
            string: identityBase64,
          });
        } catch (hexError) {
          // If that fails, the identityString might already be a string, not hex bytes
          console.log('🔍 Identity may already be a string, not hex bytes');
          if (typeof parsedContext.identityHex === 'string') {
            identityBase64 = parsedContext.identityHex;
            console.log('🔍 Using identity string directly:', identityBase64);
          } else {
            throw hexError;
          }
        }
      } catch (conversionError) {
        console.error('Identity conversion error:', conversionError);
        throw new Error(
          `Failed to decode identity from context: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`
        );
      }

      // Create Identity from the parsed identity string
      let identity: Identity;
      try {
        identity = Identity.import(identityBase64);
        console.log('✅ Successfully imported identity, commitment:', identity.commitment.toString());
      } catch (identityError) {
        console.error('Identity import error:', identityError);
        throw new Error('Invalid identity in paymaster context - cannot import identity');
      }

      console.log('✅ Successfully parsed paymaster context:', {
        paymasterAddress: parsedContext.paymasterAddress,
        identityCommitment: identity.commitment.toString(),
      });

      // Call the callback with parsed data
      onValidContext({
        paymasterAddress: parsedContext.paymasterAddress,
        identity: identity,
        paymasterContext: trimmedContext,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid paymaster context format';
      setError(message);
      console.error('Context parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [contextValue, isLoading, isProcessing, onValidContext]);

  const isValid = contextValue.trim().length > 0 && contextValue.trim().startsWith('0x');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
          <Ticket className="w-4 h-4" />
          Quick Setup
        </div>
        <p className="text-sm text-muted-foreground">
          Paste the paymaster context from your gas card to configure instantly
        </p>
      </div>

      {/* Context Input */}
      <div className="space-y-2">
        <Label htmlFor="context-input" className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Paymaster Context
        </Label>
        <Textarea
          id="context-input"
          placeholder="Paste your encoded paymaster context here (starts with 0x...)&#10;&#10;Example:&#10;0x1234567890abcdef..."
          value={contextValue}
          onChange={handleContextChange}
          disabled={isLoading || isProcessing}
          rows={4}
          className="font-mono text-sm resize-none max-h-32 overflow-y-auto break-all"
          style={{
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        />
        <p className="text-xs text-muted-foreground">
          This is the encoded context you copied from the web app after joining a pool
        </p>
      </div>

      {/* Validation Status */}
      {contextValue.trim() && (
        <Alert
          className={
            isValid
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
              : 'border-red-200 bg-red-50 dark:bg-red-900/20'
          }
        >
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="text-sm">
            {isValid
              ? 'Valid paymaster context format detected'
              : "Invalid format - paymaster context must start with '0x'"}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button onClick={handleSubmit} disabled={!isValid || isLoading || isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Parsing Context...
          </>
        ) : (
          <>
            <ArrowRight className="mr-2 h-4 w-4" />
            Configure from Context
          </>
        )}
      </Button>
    </div>
  );
}
