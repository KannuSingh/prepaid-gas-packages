/**
 * Data transformers for the prepaid gas paymaster system
 * Updated for the new network-aware schema structure
 *
 * Handles BigInt serialization/deserialization and provides utility functions
 * for formatting blockchain data for API responses and client consumption.
 */

import type {
  PaymasterContract,
  Pool,
  PoolMember,
  Transaction,
  NetworkInfo,
  SerializedPaymasterContract,
  SerializedPool,
  SerializedPoolMember,
  SerializedTransaction,
  SerializedNetworkInfo,
} from "../types/subgraph.js";

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Safely parse a BigInt from a string
 *
 * @param value - String value to parse
 * @returns BigInt value or 0n if invalid
 */
export function safeBigIntParse(value: string | number | bigint): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    return BigInt(Math.floor(value));
  }

  try {
    return BigInt(value);
  } catch (error) {
    console.warn(`Failed to parse BigInt from value: ${value}`, error);
    return 0n;
  }
}

/**
 * ========================================
 * GENERIC CONVERSION FUNCTIONS
 * ========================================
 */

/**
 * Convert BigInt values to strings recursively
 *
 * @param obj - Entity object to convert
 * @returns Serialized entity with BigInt values as strings
 */
export function convertBigIntsToStrings<T>(obj: T): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertBigIntsToStrings(item));
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntsToStrings(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Convert string values back to BigInt for specified fields
 *
 * @param obj - Serialized entity object
 * @param bigIntFields - Array of field names that should be converted to BigInt
 * @returns Entity with BigInt values restored
 */
export function convertStringsToBigInts<T>(
  obj: T,
  bigIntFields: string[],
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertStringsToBigInts(item, bigIntFields));
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (bigIntFields.includes(key) && typeof obj[key] === "string") {
          result[key] = safeBigIntParse(obj[key]);
        } else if (typeof obj[key] === "object") {
          result[key] = convertStringsToBigInts(obj[key], bigIntFields);
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  return obj;
}

/**
 * ========================================
 * BIGINT FIELD DEFINITIONS
 * ========================================
 */

// Define which fields are BigInt for each entity type
const BIGINT_FIELDS = {
  paymasterContract: [
    "chainId",
    "totalUsersDeposit",
    "currentDeposit",
    "revenue",
    "deployedAtBlock",
    "deployedAtTimestamp",
    "lastUpdatedBlock",
    "lastUpdatedTimestamp",
  ],
  pool: [
    "poolId",
    "chainId",
    "joiningFee",
    "totalDeposits",
    "memberCount",
    "currentMerkleRoot",
    "createdAtBlock",
    "createdAtTimestamp",
    "lastUpdatedBlock",
    "lastUpdatedTimestamp",
  ],
  poolMember: [
    "chainId",
    "memberIndex",
    "identityCommitment",
    "merkleRootWhenAdded",
    "addedAtBlock",
    "addedAtTimestamp",
    "gasUsed",
    "nullifier",
  ],
  merkleRoot: ["chainId", "root", "createdAtBlock", "createdAtTimestamp"],
  transaction: [
    "chainId",
    "actualGasCost",
    "nullifier",
    "executedAtBlock",
    "executedAtTimestamp",
    "gasPrice",
    "totalGasUsed",
  ],
  revenueWithdrawal: [
    "chainId",
    "amount",
    "withdrawnAtBlock",
    "withdrawnAtTimestamp",
  ],
  nullifierUsage: [
    "nullifier",
    "chainId",
    "gasUsed",
    "firstUsedAtBlock",
    "firstUsedAtTimestamp",
  ],
  networkInfo: [
    "chainId",
    "totalPaymasters",
    "totalPools",
    "totalMembers",
    "totalSponsoredTransactions",
    "totalGasSpent",
    "totalRevenue",
    "firstDeploymentBlock",
    "firstDeploymentTimestamp",
    "lastActivityBlock",
    "lastActivityTimestamp",
  ],
};

/**
 * ========================================
 * SERIALIZATION FUNCTIONS
 * ========================================
 */

export function serializePaymasterContract(
  entity: PaymasterContract,
): SerializedPaymasterContract {
  return convertBigIntsToStrings(entity);
}

export function serializePool(entity: Pool): SerializedPool {
  return convertBigIntsToStrings(entity);
}

export function serializePoolMember(entity: PoolMember): SerializedPoolMember {
  return convertBigIntsToStrings(entity);
}

export function serializeTransaction(
  entity: Transaction,
): SerializedTransaction {
  return convertBigIntsToStrings(entity);
}

export function serializeNetworkInfo(
  entity: NetworkInfo,
): SerializedNetworkInfo {
  return convertBigIntsToStrings(entity);
}

/**
 * ========================================
 * DESERIALIZATION FUNCTIONS
 * ========================================
 */

export function deserializePaymasterContract(
  entity: SerializedPaymasterContract,
): PaymasterContract {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.paymasterContract);
}

export function deserializePool(entity: SerializedPool): Pool {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.pool);
}

export function deserializePoolMember(
  entity: SerializedPoolMember,
): PoolMember {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.poolMember);
}

export function deserializeTransaction(
  entity: SerializedTransaction,
): Transaction {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.transaction);
}

export function deserializeNetworkInfo(
  entity: SerializedNetworkInfo,
): NetworkInfo {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.networkInfo);
}

/**
 * ========================================
 * EXPORT CONVENIENCE FUNCTIONS
 * ========================================
 */

/**
 * All serialization functions
 */
export const serializers = {
  paymasterContract: serializePaymasterContract,
  pool: serializePool,
  poolMember: serializePoolMember,
  transaction: serializeTransaction,
  networkInfo: serializeNetworkInfo,
};

/**
 * All deserialization functions
 */
export const deserializers = {
  paymasterContract: deserializePaymasterContract,
  pool: deserializePool,
  poolMember: deserializePoolMember,
  transaction: deserializeTransaction,
  networkInfo: deserializeNetworkInfo,
};
