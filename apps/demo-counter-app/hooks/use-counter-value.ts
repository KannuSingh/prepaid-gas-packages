// file :demo-counter-app/hooks/use-counter-value.ts
import { useState, useEffect, useCallback } from 'react';
import { COUNTER_CONTRACT } from '@/lib/contracts/counter';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export function useCounterValue() {
  const [count, setCount] = useState<bigint>(BigInt(0));
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readCount = useCallback(async () => {
    setIsReading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });
      const result = await publicClient.readContract({
        address: COUNTER_CONTRACT.address,
        abi: COUNTER_CONTRACT.abi,
        functionName: 'count',
      });

      // Force React to see the change by using functional update
      setCount(() => {
        const newCount = BigInt(result.toString()); // Ensure it's a new BigInt
        return newCount;
      });
    } catch (err) {
      console.error('❌ Error reading count:', err);
      setError('Failed to read counter value');
    } finally {
      setIsReading(false);
    }
  }, []);

  useEffect(() => {
    readCount();
  }, [readCount]);

  return {
    count,
    isReading,
    error,
    readCount,
  };
}
