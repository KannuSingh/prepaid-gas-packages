/**
 * Core query builder types and interfaces
 * Updated for new subgraph schema structure
 */

import { NetworkName } from '@private-prepaid-gas/constants';
import { NetworkInfo, PaymasterContract, PaymasterType, Pool, PoolMember, Transaction } from '../types/subgraph';

/**
 * Base query configuration for GraphQL queries
 */
export interface QueryConfig<TWhereInput, TOrderBy> {
  /** Number of items to fetch */
  first?: number;
  /** Number of items to skip (for pagination) */
  skip?: number;
  /** Field to order by */
  orderBy?: TOrderBy;
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Where conditions */
  where?: Partial<TWhereInput>;
  /** Network name */
  network?: NetworkName;
  // For dynamic selection
  selectedFields?: string[];
}

/**
 * ========================================
 * FIELD TYPE DEFINITIONS
 * ========================================
 */

/**
 * Available fields for PaymasterContract entity queries
 */
export type PaymasterContractFields =
  | keyof PaymasterContract
  | 'pools { id poolId network }' // Example of nested fields
  | 'transactions { id userOpHash sender executedAtTransaction }'
  | 'revenueWithdrawals { id amount recipient }';

/**
 * Available fields for Pool entity queries
 * Updated to match new subgraph schema
 */
export type PoolFields =
  | keyof Pool
  | 'paymaster { id contractType address }'
  | 'members { id memberIndex addedAtTimestamp identityCommitment }'
  | 'transactions { id userOpHash sender actualGasCost executedAtTimestamp nullifier executedAtTransaction }';

/**
 * Available fields for PoolMember entity queries
 * Updated to match new subgraph schema
 */
export type PoolMemberFields =
  | keyof PoolMember
  | 'pool { id poolId network chainId }'
  | 'pool { paymaster { id address } }';

/**
 * Available fields for Transaction entity queries
 */
export type TransactionFields =
  | keyof Transaction
  | 'paymaster { id address contractType }' // Example of nested fields
  | 'pool { id poolId }';

/**
 * Available fields for NetworkInfo entity queries
 */
export type NetworkInfoFields = keyof NetworkInfo;

/**
 * ========================================
 * WHERE CONDITION TYPES
 * ========================================
 */

/**
 * Where condition operators for filtering
 * Supports common GraphQL filtering operations
 */
export interface WhereCondition<T = any> {
  /** Equal to */
  eq?: T;
  /** Not equal to */
  ne?: T;
  /** Greater than */
  gt?: T;
  /** Greater than or equal to */
  gte?: T;
  /** Less than */
  lt?: T;
  /** Less than or equal to */
  lte?: T;
  /** In array */
  in?: T[];
  /** Not in array */
  notIn?: T[];
  /** Contains substring */
  contains?: string;
  /** Does not contain substring */
  notContains?: string;
  /** Starts with */
  startsWith?: string;
  /** Ends with */
  endsWith?: string;
}

/**
 * Typed where conditions for PaymasterContract entity
 */
export interface PaymasterContractWhereInput {
  id?: string; // network-address composite ID
  network?: NetworkName;
  contractType?: PaymasterType;
  address?: string;
  revenue_gte?: string; // GraphQL expects BigInt as string
  revenue_lte?: string; // GraphQL expects BigInt as string
  currentDeposit_gte?: string; // GraphQL expects BigInt as string
  currentDeposit_lte?: string; // GraphQL expects BigInt as string
  deployedAtTimestamp_gte?: string; // GraphQL expects BigInt as string
  deployedAtTimestamp_lte?: string; // GraphQL expects BigInt as string
  revenue_gt?: string; // For isActive
}

/**
 * Typed where conditions for Pool entity
 * Updated to match new subgraph schema
 */
export interface PoolWhereInput {
  id?: string;
  poolId?: string; // GraphQL expects BigInt as string
  network?: NetworkName;
  paymaster_?: { address?: string };
  memberCount_gte?: string;
  memberCount_lte?: string;
  totalDeposits_gte?: string;
  totalDeposits_lte?: string;
  joiningFee_gte?: string;
  joiningFee_lte?: string;
  createdAtTimestamp_gte?: string;
  createdAtTimestamp_lte?: string;
  memberCount_gt?: string; // For hasMembers
  totalDeposits_gt?: string; // For isActive
}

/**
 * Typed where conditions for PoolMember entity
 * Updated to match new subgraph schema
 */
export interface PoolMemberWhereInput {
  id?: string;
  network?: NetworkName;
  pool_?: {
    id?: string;
    poolId?: string; // GraphQL expects BigInt as string for poolId
  };
  paymaster_?: { address?: string };
  memberIndex?: string; // GraphQL expects BigInt as string
  identityCommitment?: string; // GraphQL expects BigInt as string
  gasUsed_gte?: string;
  gasUsed_lte?: string;
  nullifierUsed?: boolean;
  addedAtTimestamp_gte?: string;
  addedAtTimestamp_lte?: string;
  rootIndexWhenAdded?: number;
}

/**
 * Typed where conditions for Transaction entity
 */
export interface TransactionWhereInput {
  id?: string; // network-userOpHash composite ID
  network?: NetworkName;
  userOpHash?: string;
  paymaster_?: {
    address?: string;
    contractType?: PaymasterType;
  };
  pool_?: { poolId?: string };
  sender?: string;
  nullifier?: string; // GraphQL expects BigInt as string
  actualGasCost_gte?: string; // GraphQL expects BigInt as string
  actualGasCost_lte?: string; // GraphQL expects BigInt as string
  gasPrice_gte?: string; // GraphQL expects BigInt as string
  gasPrice_lte?: string; // GraphQL expects BigInt as string
  executedAtTimestamp_gte?: string; // GraphQL expects BigInt as string
  executedAtTimestamp_lte?: string; // GraphQL expects BigInt as string
  executedAtBlock?: string; // GraphQL expects BigInt as string
  transactionHash?: string;
}

/**
 * Typed where conditions for NetworkInfo entity
 */
export interface NetworkInfoWhereInput {
  id?: NetworkName; // The ID is typically the network name in this entity
}
