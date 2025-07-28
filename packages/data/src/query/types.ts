/**
 * Core query builder types and interfaces (Updated)
 * For the new single-pool-per-contract architecture
 *
 * Supports queries for:
 * - PaymasterContract (each contract IS a pool)
 * - Activity (unified timeline of all events)
 * - UserOperation (detailed operation tracking)
 */

import { PaymasterType } from '@prepaid-gas/constants';
import type { PaymasterContract, Activity, UserOperation, ActivityType } from '../types/subgraph';

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
  network?: string;
  /** For dynamic field selection */
  selectedFields?: string[];
}

/**
 * ========================================
 * FIELD TYPE DEFINITIONS (Updated)
 * ========================================
 */

/**
 * Available fields for PaymasterContract entity queries
 */
export type PaymasterContractFields =
  | keyof PaymasterContract
  | 'activities { id type timestamp sender userOpHash actualGasCost }'
  | 'activities { id type depositor commitment memberIndex newRoot }'
  | 'activities { id type withdrawAddress amount }';

/**
 * Available fields for Activity entity queries
 */
export type ActivityFields =
  | keyof Activity
  | 'paymaster { id address contractType network }'
  | 'paymaster { joiningAmount scope verifier }';

/**
 * Available fields for UserOperation entity queries
 */
export type UserOperationFields = keyof UserOperation | 'paymaster { id address contractType network }';

/**
 * ========================================
 * ORDER BY TYPES (Updated)
 * ========================================
 */

/**
 * Available order by fields for PaymasterContract
 */
export type PaymasterContractOrderBy =
  | 'id'
  | 'contractType'
  | 'network'
  | 'totalDeposit'
  | 'currentDeposit'
  | 'revenue'
  | 'treeSize'
  | 'deployedBlock'
  | 'deployedTimestamp'
  | 'lastBlock'
  | 'lastTimestamp';

/**
 * Available order by fields for Activity
 */
export type ActivityOrderBy = 'id' | 'type' | 'network' | 'block' | 'timestamp' | 'actualGasCost' | 'amount';

/**
 * Available order by fields for UserOperation
 */
export type UserOperationOrderBy = 'id' | 'network' | 'sender' | 'actualGasCost' | 'nullifier' | 'block' | 'timestamp';

/**
 * ========================================
 * WHERE CONDITION TYPES (Updated)
 * ========================================
 */

/**
 * Where condition operators for filtering
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
  id?: string; // network-contractAddress
  network?: string;
  contractType?: PaymasterType;
  address?: string;

  // Financial filtering
  totalDeposit_gte?: string; // GraphQL expects BigInt as string
  totalDeposit_lte?: string;
  currentDeposit_gte?: string;
  currentDeposit_lte?: string;
  revenue_gte?: string;
  revenue_lte?: string;
  revenue_gt?: string; // For isActive

  // Merkle tree filtering
  treeSize_gte?: string; // Number of members
  treeSize_lte?: string;
  treeSize_gt?: string; // For hasMembers

  // Configuration filtering
  joiningAmount_gte?: string;
  joiningAmount_lte?: string;
  scope?: string;
  verifier?: string;

  // Status filtering
  isDead?: boolean;

  // Time filtering
  deployedTimestamp_gte?: string;
  deployedTimestamp_lte?: string;
  lastTimestamp_gte?: string;
  lastTimestamp_lte?: string;
}

/**
 * Typed where conditions for Activity entity
 */
export interface ActivityWhereInput {
  id?: string; // network-contractAddress-txHash-logIndex
  type?: ActivityType;
  network?: string;

  // Paymaster filtering
  paymaster?: string; // PaymasterContract ID
  paymaster_?: {
    address?: string;
    contractType?: PaymasterType;
    network?: string;
  };

  // Time filtering
  block_gte?: string;
  block_lte?: string;
  timestamp_gte?: string;
  timestamp_lte?: string;

  // Deposit-specific filtering (when type = DEPOSIT)
  depositor?: string;
  commitment?: string;
  memberIndex_gte?: string;
  memberIndex_lte?: string;

  // UserOp-specific filtering (when type = USER_OP_SPONSORED)
  sender?: string;
  userOpHash?: string;
  actualGasCost_gte?: string;
  actualGasCost_lte?: string;

  // Revenue-specific filtering (when type = REVENUE_WITHDRAWN)
  withdrawAddress?: string;
  amount_gte?: string;
  amount_lte?: string;
}

/**
 * Typed where conditions for UserOperation entity
 */
export interface UserOperationWhereInput {
  id?: string; // network-contractAddress-userOpHash
  hash?: string; // userOpHash
  network?: string;

  // Paymaster filtering
  paymaster?: string; // PaymasterContract ID
  paymaster_?: {
    address?: string;
    contractType?: PaymasterType;
    network?: string;
  };

  // Operation filtering
  sender?: string;
  actualGasCost_gte?: string;
  actualGasCost_lte?: string;
  nullifier?: string;

  // Time filtering
  block_gte?: string;
  block_lte?: string;
  timestamp_gte?: string;
  timestamp_lte?: string;
}

/**
 * ========================================
 * QUERY CONFIGURATION TYPES (Updated)
 * ========================================
 */

/**
 * PaymasterContract query configuration
 */
export type PaymasterContractQuery = QueryConfig<PaymasterContractWhereInput, PaymasterContractOrderBy>;

/**
 * Activity query configuration
 */
export type ActivityQuery = QueryConfig<ActivityWhereInput, ActivityOrderBy>;

/**
 * UserOperation query configuration
 */
export type UserOperationQuery = QueryConfig<UserOperationWhereInput, UserOperationOrderBy>;

/**
 * ========================================
 * CONVENIENCE FILTER TYPES
 * ========================================
 */

/**
 * Common filter combinations for PaymasterContract
 */
export interface PaymasterContractFilters {
  /** Filter by contract type */
  contractType?: PaymasterType;
  /** Filter by network */
  network?: string;
  /** Only active contracts (has revenue) */
  isActive?: boolean;
  /** Only contracts with members */
  hasMembers?: boolean;
  /** Minimum total deposit */
  minTotalDeposit?: string;
  /** Deployed after timestamp */
  deployedAfter?: string;
  /** Not dead pools */
  isAlive?: boolean;
}

/**
 * Common filter combinations for Activity
 */
export interface ActivityFilters {
  /** Filter by activity type */
  type?: ActivityType;
  /** Filter by network */
  network?: string;
  /** Filter by paymaster address */
  paymasterAddress?: string;
  /** Filter by contract type */
  contractType?: PaymasterType;
  /** Activities after timestamp */
  after?: string;
  /** Activities before timestamp */
  before?: string;
  /** Minimum gas cost (for USER_OP_SPONSORED) */
  minGasCost?: string;
}

/**
 * Common filter combinations for UserOperation
 */
export interface UserOperationFilters {
  /** Filter by network */
  network?: string;
  /** Filter by paymaster address */
  paymasterAddress?: string;
  /** Filter by sender */
  sender?: string;
  /** Operations after timestamp */
  after?: string;
  /** Operations before timestamp */
  before?: string;
  /** Minimum gas cost */
  minGasCost?: string;
  /** Maximum gas cost */
  maxGasCost?: string;
}

/**
 * ========================================
 * HELPER TYPES FOR DYNAMIC QUERIES
 * ========================================
 */

/**
 * Entity types for dynamic query building
 */
export type EntityType = 'paymasterContract' | 'activity' | 'userOperation';

/**
 * All where input types
 */
export type AllWhereInputs = PaymasterContractWhereInput | ActivityWhereInput | UserOperationWhereInput;

/**
 * All order by types
 */
export type AllOrderByTypes = PaymasterContractOrderBy | ActivityOrderBy | UserOperationOrderBy;

/**
 * All field types
 */
export type AllFieldTypes = PaymasterContractFields | ActivityFields | UserOperationFields;
