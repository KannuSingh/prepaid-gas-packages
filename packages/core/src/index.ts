/**
 * @private-prepaid-gas/core
 *
 * Core SDK for Private Prepaid Gas paymaster integration
 */

// Export main client
export { PrepaidGasPaymaster } from './client/PrepaidGasPaymaster';
export type { PrepaidGasPaymasterOptions } from './client/PrepaidGasPaymaster';

// Note: For data layer queries, import directly from @private-prepaid-gas/data
// Example: import { getPoolMembers } from '@private-prepaid-gas/data/queries/pool-members'

// Export essential utilities
export { 
  encodePaymasterContext, 
  parsePaymasterContext, 
  PrepaidGasPaymasterMode 
} from './utils/context';
export type { 
  ParsedPaymasterContext, 
  PrepaidGasPaymasterModeType 
} from './utils/context';

// Export paymaster data utilities  
export {
  PaymasterMode,
  GAS_CONSTANTS,
  encodePaymasterConfig,
  createDummyProof,
  encodePaymasterData,
  createPaymasterAndData
} from './utils/paymaster-data';

// Export ZK proof utilities
export {
  generatePoolMembershipProof,
  validatePoolMembership,
  getIdentityCommitmentFromHex
} from './utils/zk-proof';

// Export contract utilities
export {
  createRpcClient,
  getMessageHash,
  getLatestMerkleRootIndex
} from './utils/contract';

// Export error classes
export {
  PrepaidGasPaymasterError,
  PaymasterContextError,
  PoolMembershipError,
  SubgraphError,
  ProofGenerationError,
  NetworkError,
  ValidationError
} from './errors/PaymasterErrors';

// Package version
export const VERSION = '1.0.0';
