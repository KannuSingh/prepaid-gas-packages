/**
 * OneTimeUsePaymaster specific ABI items
 * Contains only functions and events unique to this paymaster implementation
 */

import type { Abi } from 'viem';
import { BASE_PAYMASTER_ABI } from './shared';

/**
 * ABI items specific to OneTimeUsePaymaster
 * Excludes common BasePaymaster functionality
 */
export const ONE_TIME_USE_PAYMASTER_SPECIFIC_ABI = [
  {
    inputs: [],
    name: 'NullifierAlreadyUsed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'actualGasCost',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nullifierUsed',
        type: 'uint256',
      },
    ],
    name: 'UserOpSponsoredWithNullifier',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'usedNullifiers',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi;

/**
 * Complete ABI for OneTimeUsePaymaster
 * Combines base paymaster functionality with specific functions
 * Uses spread operator to preserve types for viem inference
 */
export const ONE_TIME_USE_PAYMASTER_ABI = [
  ...BASE_PAYMASTER_ABI,
  ...ONE_TIME_USE_PAYMASTER_SPECIFIC_ABI,
] as const satisfies Abi;
