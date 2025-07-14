/**
 * @private-prepaid-gas/core
 *
 * Core SDK for Private Prepaid Gas paymaster integration
 */

// Export main client
export { PrepaidGasPaymaster } from './client/PrepaidGasPaymaster';
export type { PrepaidGasPaymasterOptions } from './client/PrepaidGasPaymaster';

// Export subgraph client
export { SubgraphClient } from './client/SubgraphClient';
export type { SubgraphClientOptions, QueryResult } from './client/SubgraphClient';

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

// Package version
export const VERSION = '1.0.0';
