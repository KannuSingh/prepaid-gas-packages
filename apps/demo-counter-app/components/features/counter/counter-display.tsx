// file :demo-counter-app/components/features/counter/counter-display.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface CounterDisplayProps {
  counterHook: {
    count: bigint;
    isReading: boolean;
    error: string | null;
    readCount: () => Promise<void>;
  };
}

export function CounterDisplay({ counterHook }: CounterDisplayProps) {
  const { count, isReading } = counterHook;

  return (
    <div className="text-center">
      <div className="text-6xl font-bold text-primary mb-2">
        {isReading ? (
          <Loader2 className="h-16 w-16 animate-spin mx-auto" />
        ) : (
          <span key={count.toString()}>{formatNumber(count)}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Current Count</p>
    </div>
  );
}
