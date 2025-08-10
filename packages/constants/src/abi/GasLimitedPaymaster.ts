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
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "userOpHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "actualGasCost",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nullifierUsed",
        "type": "uint256"
      }
    ],
    "name": "UserOpSponsoredWithNullifier",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "nullifierGasUsage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const satisfies Abi;

/**
 * Complete ABI for GasLimitedPaymaster
 * Combines base paymaster functionality with specific functions
 */
export const GAS_LIMITED_PAYMASTER_ABI = combineAbis([
  BASE_PAYMASTER_ABI,
  GAS_LIMITED_PAYMASTER_SPECIFIC_ABI,
]);
