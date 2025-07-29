// Contract constants
export const POOL_ROOT_HISTORY_SIZE = 64;
export const PAYMASTER_VALIDATION_GAS_OFFSET = 20;
export const PAYMASTER_POSTOP_GAS_OFFSET = 36;
export const PAYMASTER_DATA_OFFSET = 52;

// Data size constants
export const CONFIG_SIZE = 32;
export const PRIVACY_PROOF_SIZE = 416; // 5 uint256 + 8 uint256 array

// Paymaster data offsets
export const CONFIG_OFFSET = PAYMASTER_DATA_OFFSET; // 52

// Validation constants
export const VALIDATION_FAILED = 1;
export const GAS_LIMITED_POSTOP_GAS_LIMIT = 65000n;
export const ONE_TIME_USE_POSTOP_GAS_LIMIT = 65000n;
export const CACHED_POSTOP_GAS_LIMIT = 45000n;
export const CACHE_ACTIVATION_POSTOP_GAS_LIMIT = 86650n;

// Merkle tree constraints
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 32;
