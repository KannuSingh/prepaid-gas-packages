// file :demo-counter-app/components/features/counter/contract-info.tsx
'use client';

import { COUNTER_CONTRACT_ADDRESS } from '@/lib/contracts/counter';

export function ContractInfo() {
  return (
    <div className="flex justify-between text-xs text-muted-foreground">
      <p>
        Contract: {COUNTER_CONTRACT_ADDRESS.slice(0, 6)}...
        {COUNTER_CONTRACT_ADDRESS.slice(-4)}
      </p>
      <p>Network: Base Sepolia</p>
    </div>
  );
}
