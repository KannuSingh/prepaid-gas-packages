// Constants exports
export { GAS_LIMITED_PAYMASTER_ABI, ONE_TIME_USE_PAYMASTER_ABI } from "./abi";

// Contract constants
export const POST_OP_GAS_LIMIT = 65000n;
export const POOL_ROOT_HISTORY_SIZE = 64;
export const PAYMASTER_VALIDATION_GAS_OFFSET = 20;
export const PAYMASTER_POSTOP_GAS_OFFSET = 36;
export const PAYMASTER_DATA_OFFSET = 52;

// Data size constants
export const CONFIG_SIZE = 32;
export const POOL_ID_SIZE = 32;
export const PRIVACY_PROOF_SIZE = 416; // 5 uint256 + 8 uint256 array

// Paymaster data offsets
export const CONFIG_OFFSET = PAYMASTER_DATA_OFFSET; // 52
export const POOL_ID_OFFSET = PAYMASTER_DATA_OFFSET + CONFIG_SIZE; // 84
export const PROOF_OFFSET = PAYMASTER_DATA_OFFSET + CONFIG_SIZE + POOL_ID_SIZE; // 116

export const EXPECTED_PAYMASTER_DATA_SIZE =
  PAYMASTER_DATA_OFFSET + CONFIG_SIZE + POOL_ID_SIZE + PRIVACY_PROOF_SIZE;

// Validation constants
export const VALIDATION_FAILED = 1;
export const POSTOP_GAS_COST = 65000;
export const DEFAULT_MERKLE_TREE_DURATION = 3600; // 1 hour

// Merkle tree constraints
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 32;
