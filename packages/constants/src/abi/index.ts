/**
 * ABI exports for PrepaidGas paymaster contracts
 * 
 * Optimized ABIs with shared base functionality to reduce bundle size.
 * Each paymaster exports one complete ABI and optionally specific-only items.
 */

// Shared base functionality for all paymasters
export { BASE_PAYMASTER_ABI } from './shared';
export { combineAbis, filterAbiByType } from './utils';

// Complete paymaster ABIs (optimized with shared base)
// Each file now exports properly typed ABIs with full viem type inference
export * from './OneTimeUsePaymaster';
export * from './GasLimitedPaymaster';
export * from './CacheEnabledGasLimitedPaymaster';
