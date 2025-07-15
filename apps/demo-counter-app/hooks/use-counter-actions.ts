// file :demo-counter-app/hooks/use-counter-actions.ts
import { useCallback, useState } from 'react';
import { useSmartAccount } from '@/context/SmartAccountContext';
import { COUNTER_CONTRACT } from '@/lib/contracts/counter';

export function useCounterActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { smartAccountClient, clearError: clearSmartAccountError } = useSmartAccount();

  const increment = useCallback(async () => {
    if (!smartAccountClient) {
      setError('Smart Account Client not available - ensure paymaster is configured');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuccess(false);
    clearSmartAccountError();

    try {
      const txHash = await smartAccountClient.writeContract({
        chain: smartAccountClient.chain as any,
        account: smartAccountClient.account as any,
        address: COUNTER_CONTRACT.address,
        abi: COUNTER_CONTRACT.abi,
        functionName: 'increment',
      });

      setLastTxHash(txHash);
      setShowSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return { userOpHash: txHash };
    } catch (err) {
      console.error('Transaction failed:', err);
      setError((err as Error).message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  }, [smartAccountClient, clearSmartAccountError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    increment,
    isLoading,
    error,
    lastTxHash,
    showSuccess,
    clearError,
  };
}
