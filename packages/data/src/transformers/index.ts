/**
 * Data transformers for the paymaster system (Updated)
 * For the new single-pool-per-contract architecture
 *
 * Handles BigInt serialization/deserialization for:
 * - PaymasterContract (each contract IS a pool)
 * - Activity (unified timeline)
 * - UserOperation (detailed tracking)
 */

import type {
  PaymasterContract,
  SerializedPaymasterContract,
  Activity,
  SerializedActivity,
  UserOperation,
  SerializedUserOperation,
} from '../types/subgraph.js';

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
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
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
  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertBigIntsToStrings(item));
  }

  if (typeof obj === 'object') {
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
export function convertStringsToBigInts<T>(obj: T, bigIntFields: string[]): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertStringsToBigInts(item, bigIntFields));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (bigIntFields.includes(key) && typeof obj[key] === 'string') {
          result[key] = safeBigIntParse(obj[key]);
        } else if (typeof obj[key] === 'object') {
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
 * BIGINT FIELD DEFINITIONS (Updated for new schema)
 * ========================================
 */

// Define which fields are BigInt for each entity type
const BIGINT_FIELDS = {
  paymasterContract: [
    'chainId',
    'joiningAmount',
    'scope',
    'totalDeposit',
    'currentDeposit',
    'revenue',
    'root',
    'rootIndex',
    'treeDepth',
    'treeSize',
    'deployedBlock',
    'deployedTimestamp',
    'lastBlock',
    'lastTimestamp',
  ],
  activity: [
    'chainId',
    'block',
    'timestamp',
    // Optional BigInt fields (based on activity type)
    'commitment',
    'memberIndex',
    'newRoot',
    'actualGasCost',
    'amount',
  ],
  userOperation: ['chainId', 'actualGasCost', 'nullifier', 'block', 'timestamp'],
};

/**
 * ========================================
 * SERIALIZATION FUNCTIONS (Updated)
 * ========================================
 */

export function serializePaymasterContract(entity: PaymasterContract): SerializedPaymasterContract {
  return convertBigIntsToStrings(entity);
}

export function serializeActivity(entity: Activity): SerializedActivity {
  return convertBigIntsToStrings(entity);
}

export function serializeUserOperation(entity: UserOperation): SerializedUserOperation {
  return convertBigIntsToStrings(entity);
}

/**
 * ========================================
 * DESERIALIZATION FUNCTIONS (Updated)
 * ========================================
 */

export function deserializePaymasterContract(entity: SerializedPaymasterContract): PaymasterContract {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.paymasterContract);
}

export function deserializeActivity(entity: SerializedActivity): Activity {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.activity);
}

export function deserializeUserOperation(entity: SerializedUserOperation): UserOperation {
  return convertStringsToBigInts(entity, BIGINT_FIELDS.userOperation);
}

/**
 * ========================================
 * CONVENIENCE EXPORTS (Updated)
 * ========================================
 */

/**
 * All serialization functions
 */
export const serializers = {
  paymasterContract: serializePaymasterContract,
  activity: serializeActivity,
  userOperation: serializeUserOperation,
};

/**
 * All deserialization functions
 */
export const deserializers = {
  paymasterContract: deserializePaymasterContract,
  activity: deserializeActivity,
  userOperation: deserializeUserOperation,
};

/**
 * ========================================
 * ACTIVITY-SPECIFIC HELPERS
 * ========================================
 */

/**
 * Serialize activities with type-specific field handling
 *
 * @param activities - Array of activities to serialize
 * @returns Serialized activities with proper BigInt conversion
 */
export function serializeActivities(activities: Activity[]): SerializedActivity[] {
  return activities.map(serializeActivity);
}

/**
 * Deserialize activities with type-specific field handling
 *
 * @param activities - Array of serialized activities
 * @returns Activities with BigInt fields restored
 */
export function deserializeActivities(activities: SerializedActivity[]): Activity[] {
  return activities.map(deserializeActivity);
}

/**
 * ========================================
 * ANALYTICS HELPERS
 * ========================================
 */

/**
 * Calculate analytics from activity data (no BigInt conversion needed)
 *
 * @param activities - Activities to analyze
 * @returns Analytics summary with proper BigInt types
 */
export function calculatePaymasterAnalytics(activities: Activity[]): {
  totalDeposits: bigint;
  totalUserOperations: bigint;
  totalGasSponsored: bigint;
  totalRevenueWithdrawn: bigint;
  averageGasPerOperation: bigint;
} {
  let totalDeposits = 0n;
  let totalUserOperations = 0n;
  let totalGasSponsored = 0n;
  let totalRevenueWithdrawn = 0n;

  for (const activity of activities) {
    switch (activity.type) {
      case 'DEPOSIT':
        totalDeposits++;
        break;
      case 'USER_OP_SPONSORED':
        totalUserOperations++;
        if (activity.actualGasCost) {
          totalGasSponsored += activity.actualGasCost;
        }
        break;
      case 'REVENUE_WITHDRAWN':
        if (activity.amount) {
          totalRevenueWithdrawn += activity.amount;
        }
        break;
    }
  }

  const averageGasPerOperation = totalUserOperations > 0n ? totalGasSponsored / totalUserOperations : 0n;

  return {
    totalDeposits,
    totalUserOperations,
    totalGasSponsored,
    totalRevenueWithdrawn,
    averageGasPerOperation,
  };
}
