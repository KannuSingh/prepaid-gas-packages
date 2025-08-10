/**
 * GasLimitedPaymaster specific ABI items
 * Contains only functions and events unique to this paymaster implementation
 */

import type { Abi } from 'viem';
import { BASE_PAYMASTER_ABI } from './shared';
import { combineAbis } from './utils';

/**
 * ABI items specific to GasLimitedPaymaster
 * Excludes common BasePaymaster functionality
 */
export const GAS_LIMITED_PAYMASTER_SPECIFIC_ABI = [
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
  
  // Gas Limited specific errors
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
    name: 'InvalidJoiningAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidProof',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidTreeDepth',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LeafAlreadyExists',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LeafCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LeafGreaterThanSnarkScalarField',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MaxTreeDepthReached',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MessageMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NullifierAlreadySpent',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PoolDead',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ProofLengthMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RootNotFound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ScopeNotSupported',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TreeDepthTooSmall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TreeIsFull',
    type: 'error',
  },
  {
    inputs: [],
    name: 'WithdrawAmountExceedsRevenue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroValueProhibited',
    type: 'error',
  },
  
  // Constants
  {
    inputs: [],
    name: 'JOINING_AMOUNT',
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
    name: 'MAX_TREE_DEPTH',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MEMBERSHIP_VERIFIER',
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
    inputs: [],
    name: 'MIN_TREE_DEPTH',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ROOT_HISTORY_SIZE',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'SCOPE',
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
  
  // State variables and functions specific to GasLimited
  {
    inputs: [],
    name: 'currentRoot',
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
    name: 'currentRootIndex',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentTreeDepth',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentTreeSize',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dead',
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
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getRevenue',
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'nullifierGasUsage',
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
        name: '',
        type: 'uint256',
      },
    ],
    name: 'roots',
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
    name: 'totalDeposit',
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
  
  // Events specific to GasLimited
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
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
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'leaf',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'leafIndex',
        type: 'uint32',
      },
    ],
    name: 'LeafInserted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'PoolDied',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'RevenueWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'userOpHash',
        type: 'bytes32',
      },
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
      {
        indexed: false,
        internalType: 'uint256',
        name: 'gasUsed',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'scope',
        type: 'uint256',
      },
    ],
    name: 'UserOpSponsoredWithNullifier',
    type: 'event',
  },
] as const satisfies Abi;

/**
 * Complete ABI for GasLimitedPaymaster
 * Combines base paymaster functionality with specific functions
 */
export const GAS_LIMITED_PAYMASTER_ABI = combineAbis([
  BASE_PAYMASTER_ABI,
  GAS_LIMITED_PAYMASTER_SPECIFIC_ABI,
]);
