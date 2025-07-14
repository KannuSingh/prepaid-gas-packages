/**
 * Contract constants and configuration values
 */

// Pool and root history constants
export const POOL_ROOT_HISTORY_SIZE = 64;

// Gas limits and calculations
export const POST_OP_GAS_LIMIT = 65000;

// Data structure sizes (in bytes)
export const PAYMASTER_DATA_SIZE = 480; // config (32) + poolId (32) + proof (416)
export const PROOF_SIZE = 416; // 5 uint256 + 8 uint256 array
export const CONFIG_SIZE = 32;
export const POOL_ID_SIZE = 32;

// Validation modes
export const VALIDATION_MODE = 0;
export const GAS_ESTIMATION_MODE = 1;

// Network Chain IDs
export const SUPPORTED_CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  SEPOLIA: 11155111,
  BASE: 8453,
  BASE_SEPOLIA: 84532,
  OPTIMISM: 10,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];