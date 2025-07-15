// file :demo-counter-app/components/features/counter/counter-actions.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useCounterActions } from "@/hooks/use-counter-actions";

interface CounterActionsProps {
  counterHook: {
    count: bigint;
    isReading: boolean;
    error: string | null;
    readCount: () => Promise<void>;
  };
}

export function CounterActions({ counterHook }: CounterActionsProps) {
  const { readCount, isReading } = counterHook;
  const { increment, isLoading, showSuccess } = useCounterActions();

  // Refresh count after successful transaction
  useEffect(() => {
    if (showSuccess) {
      readCount();
    }
  }, [showSuccess, readCount]);

  return (
    <div className="space-y-4">
      {/* Increment Button */}
      <div className="flex justify-center">
        <Button
          onClick={increment}
          disabled={isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Increment
            </>
          )}
        </Button>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          onClick={readCount}
          disabled={isReading}
          variant="ghost"
          size="sm"
        >
          {isReading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Count
        </Button>
      </div>
    </div>
  );
}
