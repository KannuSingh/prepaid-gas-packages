/**
 * OneTimeUsePaymaster specific ABI items
 * Contains only functions and events unique to this paymaster implementation
 */

import type { Abi } from 'viem';
import { BASE_PAYMASTER_ABI } from './shared';
import { combineAbis } from './utils';

/**
 * ABI items specific to OneTimeUsePaymaster
 * Excludes common BasePaymaster functionality
 */
export const ONE_TIME_USE_PAYMASTER_SPECIFIC_ABI = [
  // Constructor
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_joiningAmount',
        type: 'uint256',
      },
      {
        internalType: 'contract IEntryPoint',
        name: '_entryPoint',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_membershipVerifier',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  
  // Specific Errors
  {
    inputs: [],
    name: 'ContextMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientPaymasterFund',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientValue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidCommitment',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidDataLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidMerkleProof',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidProof',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NullifierAlreadyUsed',
    type: 'error',
  },
  
  // Specific Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'commitment',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'leafIndex',
        type: 'uint32',
      },
    ],
    name: 'MembershipAdded',
    type: 'event',
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
        indexed: false,
        internalType: 'uint256',
        name: 'nullifier',
        type: 'uint256',
      },
    ],
    name: 'NullifierUsed',
    type: 'event',
  },
  
  // Specific Functions
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'commitment',
        type: 'uint256',
      },
    ],
    name: 'addMembership',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'joiningAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'membershipVerifier',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'nullifierHashes',
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
  {
    inputs: [],
    name: 'root',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_joiningAmount',
        type: 'uint256',
      },
    ],
    name: 'setJoiningAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_membershipVerifier',
        type: 'address',
      },
    ],
    name: 'setMembershipVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const satisfies Abi;

/**
 * Complete OneTimeUsePaymaster ABI combining base and specific functionality
 */
export const ONE_TIME_USE_PAYMASTER_ABI = combineAbis(
  BASE_PAYMASTER_ABI,
  ONE_TIME_USE_PAYMASTER_SPECIFIC_ABI
);
