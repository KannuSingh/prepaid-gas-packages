/**
 * TypeScript type definitions for the paymaster subgraph (Updated)
 * Based on the new single-pool-per-contract architecture
 *
 * These types exactly match the new GraphQL schema entities:
 * - PaymasterContract (each contract IS a pool)
 * - Activity (unified timeline of all events)
 * - UserOperation (detailed operation tracking)
 */

import { PaymasterType } from '@prepaid-gas/constants';

/**
 * ========================================
 * ENUMS
 * ========================================
 */

/**
 * Activity types for the unified timeline
 */
export type ActivityType = 'DEPOSIT' | 'USER_OP_SPONSORED' | 'REVENUE_WITHDRAWN';

/**
 * ========================================
 * CORE ENTITY TYPES (exact match to schema)
 * ========================================
 */

/**
 * PaymasterContract entity
 * Each contract IS a pool (no separate Pool entity)
 */
export interface PaymasterContract {
  /** Unique identifier: network-contractAddress */
  id: string;
  /** Contract type: "OneTimeUse", "GasLimited", "CacheEnabledGasLimited" */
  contractType: PaymasterType;
  /** Contract address */
  address: string;
  /** Network identifier (e.g., "base-sepolia") */
  network: string;
  /** Chain ID (e.g., 84532 for Base Sepolia) */
  chainId: bigint;

  /** Pool configuration (since each contract IS a pool) */
  joiningAmount: bigint; // JOINING_AMOUNT from contract
  scope: bigint; // SCOPE constant from contract
  verifier: string; // MEMBERSHIP_VERIFIER address

  /** Financial tracking */
  totalDeposit: bigint; // Total deposits from users
  currentDeposit: bigint; // Current deposit in EntryPoint
  revenue: bigint; // Calculated revenue

  /** Merkle tree state */
  root: bigint; // Current merkle tree root
  rootIndex: bigint; // Current root index in history
  treeDepth: bigint; // Current tree depth
  treeSize: bigint; // Number of members (tree size)

  /** Pool status */
  isDead: boolean; // Whether the pool is dead

  /** Deployment info */
  deployedBlock: bigint;
  deployedTransaction: string;
  deployedTimestamp: bigint;

  /** Activity tracking */
  lastBlock: bigint;
  lastTimestamp: bigint;

  /** Relationships */
  activities: Activity[]; // Complete timeline of all events
}

/**
 * Activity entity
 * Unified timeline of all significant events
 */
export interface Activity {
  /** Unique identifier: network-contractAddress-txHash-logIndex */
  id: string;
  /** Activity type */
  type: ActivityType;
  /** Paymaster contract this activity belongs to */
  paymaster: PaymasterContract;
  /** Network identifier */
  network: string;
  /** Chain ID */
  chainId: bigint;

  /** Common event data */
  block: bigint;
  transaction: string;
  timestamp: bigint;

  /** Deposit-specific fields (when type = DEPOSIT) */
  depositor?: string; // from Deposited._depositor
  commitment?: bigint; // from Deposited._commitment
  memberIndex?: bigint; // from LeafInserted._index
  newRoot?: bigint; // from LeafInserted._root

  /** UserOperation-specific fields (when type = USER_OP_SPONSORED) */
  sender?: string; // from UserOpSponsored.sender
  userOpHash?: string; // from UserOpSponsored.userOpHash
  actualGasCost?: bigint; // from UserOpSponsored.actualGasCost

  /** RevenueWithdrawal-specific fields (when type = REVENUE_WITHDRAWN) */
  withdrawAddress?: string; // from RevenueWithdrawn.withdrawAddress
  amount?: bigint; // from RevenueWithdrawn.amount
}

/**
 * UserOperation entity
 * Detailed user operation tracking for specialized analytics
 */
export interface UserOperation {
  /** Unique identifier: network-contractAddress-userOpHash */
  id: string;
  /** User operation hash */
  hash: string;
  /** Paymaster that sponsored this operation */
  paymaster: PaymasterContract;
  /** Network identifier */
  network: string;
  /** Chain ID */
  chainId: bigint;

  /** Operation details */
  sender: string; // Sender address
  actualGasCost: bigint; // Gas cost
  nullifier: bigint; // Nullifier used (for future analytics)

  /** Execution info */
  block: bigint;
  transaction: string;
  timestamp: bigint;
}

/**
 * ========================================
 * SERIALIZED TYPES (for API responses)
 * ========================================
 */

/**
 * Serialized PaymasterContract (BigInt -> string)
 */
export interface SerializedPaymasterContract {
  id: string;
  contractType: PaymasterType;
  address: string;
  network: string;
  chainId: string;
  joiningAmount: string;
  scope: string;
  verifier: string;
  totalDeposit: string;
  currentDeposit: string;
  revenue: string;
  root: string;
  rootIndex: string;
  treeDepth: string;
  treeSize: string;
  isDead: boolean;
  deployedBlock: string;
  deployedTransaction: string;
  deployedTimestamp: string;
  lastBlock: string;
  lastTimestamp: string;
  activities: SerializedActivity[];
}

/**
 * Serialized Activity (BigInt -> string)
 */
export interface SerializedActivity {
  id: string;
  type: ActivityType;
  paymaster: SerializedPaymasterContract;
  network: string;
  chainId: string;
  block: string;
  transaction: string;
  timestamp: string;
  // Optional fields based on activity type
  depositor?: string;
  commitment?: string;
  memberIndex?: string;
  newRoot?: string;
  sender?: string;
  userOpHash?: string;
  actualGasCost?: string;
  withdrawAddress?: string;
  amount?: string;
}

/**
 * Serialized UserOperation (BigInt -> string)
 */
export interface SerializedUserOperation {
  id: string;
  hash: string;
  paymaster: SerializedPaymasterContract;
  network: string;
  chainId: string;
  sender: string;
  actualGasCost: string;
  nullifier: string;
  block: string;
  transaction: string;
  timestamp: string;
}

/**
 * ========================================
 * UTILITY TYPES
 * ========================================
 */

/**
 * Entity types for type guards
 */
export type EntityType = 'PaymasterContract' | 'Activity' | 'UserOperation';

/**
 * Query filter types for common use cases
 */
export interface PaymasterFilters {
  network?: string;
  contractType?: PaymasterType;
  isDead?: boolean;
  minTotalDeposit?: bigint;
}

export interface ActivityFilters {
  network?: string;
  type?: ActivityType;
  paymaster?: string;
  minTimestamp?: bigint;
  maxTimestamp?: bigint;
}

export interface UserOperationFilters {
  network?: string;
  paymaster?: string;
  sender?: string;
  minGasCost?: bigint;
  minTimestamp?: bigint;
  maxTimestamp?: bigint;
}

/**
 * ========================================
 * HELPER TYPES FOR ANALYTICS
 * ========================================
 */

/**
 * Analytics summary for a paymaster contract
 */
export interface PaymasterAnalytics {
  totalMembers: bigint; // Same as treeSize
  totalUserOperations: bigint;
  totalGasSponsored: bigint;
  totalRevenueWithdrawn: bigint;
  averageGasPerOperation: bigint;
  membershipUtilization: number; // treeSize / total possible members
}

/**
 * Network-wide statistics
 */
export interface NetworkStatistics {
  network: string;
  chainId: bigint;
  totalContracts: bigint;
  totalMembers: bigint;
  totalUserOperations: bigint;
  totalGasSponsored: bigint;
  contractsByType: Record<PaymasterType, bigint>;
}

/**
 * Type guards for runtime type checking
 */
export const isDepositActivity = (
  activity: Activity
): activity is Activity & {
  depositor: string;
  commitment: bigint;
  memberIndex?: bigint;
  newRoot?: bigint;
} => activity.type === 'DEPOSIT';

export const isUserOpActivity = (
  activity: Activity
): activity is Activity & {
  sender: string;
  userOpHash: string;
  actualGasCost: bigint;
} => activity.type === 'USER_OP_SPONSORED';

export const isRevenueActivity = (
  activity: Activity
): activity is Activity & {
  withdrawAddress: string;
  amount: bigint;
} => activity.type === 'REVENUE_WITHDRAWN';

/**
 * Base Activity interface (same as existing Activity)
 */
export type BaseActivity = Activity;

/**
 * Deposit Activity - has deposit-specific fields guaranteed to be present
 */
export interface DepositActivity extends Omit<Activity, 'type'> {
  type: 'DEPOSIT';

  // Guaranteed deposit fields
  depositor: string;
  commitment: bigint;

  // Optional fields that may be set by LeafInserted event
  memberIndex?: bigint;
  newRoot?: bigint;

  // User operation fields are undefined for deposits
  sender?: undefined;
  userOpHash?: undefined;
  actualGasCost?: undefined;

  // Revenue fields are undefined for deposits
  withdrawAddress?: undefined;
  amount?: undefined;
}

/**
 * User Operation Activity - has user op-specific fields guaranteed to be present
 */
export interface UserOpActivity extends Omit<Activity, 'type'> {
  type: 'USER_OP_SPONSORED';

  // Guaranteed user operation fields
  sender: string;
  userOpHash: string;
  actualGasCost: bigint;

  // Deposit fields are undefined for user operations
  depositor?: undefined;
  commitment?: undefined;
  memberIndex?: undefined;
  newRoot?: undefined;

  // Revenue fields are undefined for user operations
  withdrawAddress?: undefined;
  amount?: undefined;
}

/**
 * Revenue Withdrawal Activity - has revenue-specific fields guaranteed to be present
 */
export interface RevenueActivity extends Omit<Activity, 'type'> {
  type: 'REVENUE_WITHDRAWN';

  // Guaranteed revenue fields
  withdrawAddress: string;
  amount: bigint;

  // Deposit fields are undefined for revenue withdrawals
  depositor?: undefined;
  commitment?: undefined;
  memberIndex?: undefined;
  newRoot?: undefined;

  // User operation fields are undefined for revenue withdrawals
  sender?: undefined;
  userOpHash?: undefined;
  actualGasCost?: undefined;
}

/**
 * Union type of all specific activity types
 */
export type TypedActivity = DepositActivity | UserOpActivity | RevenueActivity;

/**
 * Serialized versions for API responses
 */
export interface SerializedDepositActivity
  extends Omit<
    DepositActivity,
    'commitment' | 'memberIndex' | 'newRoot' | 'block' | 'timestamp' | 'chainId' | 'paymaster'
  > {
  commitment: string;
  memberIndex?: string;
  newRoot?: string;
  block: string;
  timestamp: string;
  chainId: string;
  paymaster: SerializedPaymasterContract;
}

export interface SerializedUserOpActivity
  extends Omit<UserOpActivity, 'actualGasCost' | 'block' | 'timestamp' | 'chainId' | 'paymaster'> {
  actualGasCost: string;
  block: string;
  timestamp: string;
  chainId: string;
  paymaster: SerializedPaymasterContract;
}

export interface SerializedRevenueActivity
  extends Omit<RevenueActivity, 'amount' | 'block' | 'timestamp' | 'chainId' | 'paymaster'> {
  amount: string;
  block: string;
  timestamp: string;
  chainId: string;
  paymaster: SerializedPaymasterContract;
}

export type SerializedTypedActivity = SerializedDepositActivity | SerializedUserOpActivity | SerializedRevenueActivity;

/**
 * Type mapping for activity types to their interfaces
 */
export interface ActivityTypeMap {
  DEPOSIT: DepositActivity;
  USER_OP_SPONSORED: UserOpActivity;
  REVENUE_WITHDRAWN: RevenueActivity;
}

/**
 * Type mapping for serialized activity types
 */
export interface SerializedActivityTypeMap {
  DEPOSIT: SerializedDepositActivity;
  USER_OP_SPONSORED: SerializedUserOpActivity;
  REVENUE_WITHDRAWN: SerializedRevenueActivity;
}
/**
 * Network metadata for client configuration
 */
export interface NetworkMetadata {
  /** Network name */
  network: string;
  /** Chain ID */
  chainId: number;
  /** Chain name (e.g., "Base Sepolia") */
  chainName: string;
  /** Network name for display */
  networkName: string;
  /** Contract addresses */
  contracts: {
    /** Paymaster contracts by type */
    paymasters: {
      gasLimited?: string;
      oneTimeUse?: string;
      cacheEnabledGasLimited?: string;
    };
    /** Verifier contract (if applicable) */
    verifier?: string;
  };
}
