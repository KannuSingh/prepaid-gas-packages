/**
 * Prepaid Gas Paymaster SDK - Privacy-preserving paymaster client for Account Abstraction
 *
 * This package provides a TypeScript SDK for integrating with privacy-preserving
 * gas payments using zero-knowledge proofs and Semaphore protocol.
 *
 * ⚠️ PRIVACY NOTICE: Transactions within the same pool are linkable via nullifiers.
 * For unlinkable transactions, users must use different identities across pools.
 *
 * @packageDocumentation
 */

// Main client exports
export { PrepaidGasPaymaster } from "./client/PrepaidGasPaymaster";
// Client exports
export type {
  PaymasterOptions,
  GetPaymasterStubDataV7Parameters,
} from "./client";

// Utility exports
export {
  encodePaymasterContext,
  parsePaymasterContext,
  PrepaidGasPaymasterMode,
  validatePoolId,
  validateMerkleRootIndex,
} from "./utils";
export type { ParsedPaymasterContext } from "./utils";

// Constants exports
export {
  GAS_LIMITED_PAYMASTER_ABI,
  ONE_TIME_USE_PAYMASTER_ABI,
  POOL_ROOT_HISTORY_SIZE,
} from "./constants";

// Version
export const VERSION = "1.0.0";
