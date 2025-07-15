// file :demo-counter-app/lib/contracts/counter.ts
import { encodeFunctionData } from 'viem';
import { CONTRACTS } from '@/constants/config';

export const COUNTER_CONTRACT = {
  address: CONTRACTS.counter,
  abi: [
    {
      inputs: [],
      name: 'count',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'increment',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'newCount',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'user',
          type: 'address',
        },
      ],
      name: 'CounterIncremented',
      type: 'event',
    },
  ] as const,

  // Helper functions
  encodeIncrement: () =>
    encodeFunctionData({
      abi: COUNTER_CONTRACT.abi,
      functionName: 'increment',
    }),
} as const;

// Export individual parts for backward compatibility
export const COUNTER_CONTRACT_ADDRESS = COUNTER_CONTRACT.address;
export const COUNTER_ABI = COUNTER_CONTRACT.abi;
