// file :demo-counter-app/components/features/counter/counter-status.tsx
'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSmartAccount } from '@/context/SmartAccountContext';
import { useCounterActions } from '@/hooks/use-counter-actions';

export function CounterStatus() {
  const { error: smartAccountError } = useSmartAccount();
  const { error, lastTxHash, showSuccess } = useCounterActions();

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {(error || smartAccountError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || smartAccountError}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {showSuccess && lastTxHash && (
        <Alert>
          <AlertDescription>
            ✅ Transaction confirmed!{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              View on BaseScan
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
