/**
 * TypeScript type definitions for the prepaid gas paymaster subgraph
 * Updated to match the new network-aware schema structure
 *
 * These types exactly match the GraphQL schema entities and support:
 * - Multi-network/multi-chain deployments
 * - Enhanced nullifier usage tracking
 * - Comprehensive analytics and revenue tracking
 * - Network-aware entity relationships
 */

/**
 * ========================================
 * CORE ENTITY TYPES (exact match to schema)
 * ========================================
 */

/**
 * Paymaster contract types
 */
export type PaymasterType = 'GasLimited' | 'OneTimeUse';

/**
 * PaymasterContract entity
 * Represents a deployed paymaster contract on a specific network
 */
export interface PaymasterContract {
  /** Contract address as ID (network-prefixed) */
  id: string;
  /** Contract type: "GasLimited" or "OneTimeUse" */
  contractType: PaymasterType;
  /** Contract address */
  address: string;
  /** Network/Chain identifier (e.g., "base-sepolia") */
  network: string;
  /** Chain ID (e.g., 84532 for Base Sepolia) */
  chainId: bigint;
  /** Total user deposits tracked by this paymaster */
  totalUsersDeposit: bigint;
  /** Current deposit in EntryPoint */
  currentDeposit: bigint;
  /** Calculated revenue (currentDeposit - totalUsersDeposit) */
  revenue: bigint;
  /** Block when contract was deployed */
  deployedAtBlock: bigint;
  /** Transaction hash of deployment */
  deployedAtTransaction: string;
  /** Timestamp of deployment */
  deployedAtTimestamp: bigint;
  /** Pools managed by this paymaster */
  pools: Pool[];
  /** Transactions  by this paymaster */
  Transactions: Transaction[];
  /** Last updated block */
  lastUpdatedBlock: bigint;
  /** Last updated timestamp */
  lastUpdatedTimestamp: bigint;
}

/**
 * Pool entity
 * Represents a gas payment pool managed by a paymaster
 */
export interface Pool {
  /** Pool ID as string (network-prefixed) */
  id: string;
  /** Numeric pool ID */
  poolId: bigint;
  /** Paymaster contract that manages this pool */
  paymaster: PaymasterContract;
  /** Network/Chain identifier */
  network: string;
  /** Chain ID */
  chainId: bigint;
  /** Fee required to join this pool */
  joiningFee: bigint;
  /** Total deposits in this pool */
  totalDeposits: bigint;
  /** Current number of members */
  memberCount: bigint;
  /** Current Merkle tree root */
  currentMerkleRoot: bigint;
  /** Current root index in history */
  currentRootIndex: number;
  /** Total number of roots in history */
  rootHistoryCount: number;
  /** Block when pool was created */
  createdAtBlock: bigint;
  /** Transaction hash of creation */
  createdAtTransaction: string;
  /** Timestamp of creation */
  createdAtTimestamp: bigint;
  /** Pool members */
  members: PoolMember[];
  /**  transactions from this pool */
  transactions: Transaction[];
  /** Last updated block */
  lastUpdatedBlock: bigint;
  /** Last updated timestamp */
  lastUpdatedTimestamp: bigint;
}

/**
 * PoolMember entity
 * Represents a member of a gas payment pool
 */
export interface PoolMember {
  /** Pool ID + Member Index as ID (network-prefixed) */
  id: string;
  /** Pool this member belongs to */
  pool: Pool;
  /** Network/Chain identifier */
  network: string;
  /** Chain ID */
  chainId: bigint;
  /** Member index in the pool */
  memberIndex: bigint;
  /** Identity commitment */
  identityCommitment: bigint;
  /** Merkle root when member was added */
  merkleRootWhenAdded: bigint;
  /** Root index when member was added */
  rootIndexWhenAdded: number;
  /** Block when member was added */
  addedAtBlock: bigint;
  /** Transaction hash of addition */
  addedAtTransaction: string;
  /** Timestamp of addition */
  addedAtTimestamp: bigint;
  /** For GasLimited: track gas usage (if applicable) */
  gasUsed?: bigint;
  /** For OneTimeUse: track if nullifier was used */
  nullifierUsed?: boolean;
  /** Nullifier value (if known) */
  nullifier?: bigint;
}

/**
 * Transaction entity
 * Represents a  user operation
 */
export interface Transaction {
  /** User operation hash as ID (network-prefixed) */
  id: string;
  /** User operation hash */
  userOpHash: string;
  /** Paymaster that  this operation */
  paymaster: PaymasterContract;
  /** Pool used for this operation */
  pool: Pool;
  /** Network/Chain identifier */
  network: string;
  /** Chain ID */
  chainId: bigint;
  /** Sender of the user operation */
  sender: string;
  /** Actual gas cost for this operation */
  actualGasCost: bigint;
  /** Nullifier used (for tracking) */
  nullifier: bigint;
  /** Block when operation was executed */
  executedAtBlock: bigint;
  /** Transaction hash of execution */
  executedAtTransaction: string;
  /** Timestamp of execution */
  executedAtTimestamp: bigint;
  /** Gas price used */
  gasPrice?: bigint;
  /** Total gas used (including postOp) */
  totalGasUsed?: bigint;
}

/**
 * NetworkInfo entity
 * Network/Chain information and statistics
 */
export interface NetworkInfo {
  /** Network identifier as ID */
  id: string;
  /** Network name (e.g., "Base Sepolia") */
  name: string;
  /** Chain ID */
  chainId: bigint;
  /** Total paymasters deployed on this network */
  totalPaymasters: bigint;
  /** Total pools across all paymasters */
  totalPools: bigint;
  /** Total members across all pools */
  totalMembers: bigint;
  /** Total  transactions */
  totalTransactions: bigint;
  /** Total gas spent */
  totalGasSpent: bigint;
  /** Total revenue generated */
  totalRevenue: bigint;
  /** First deployment block */
  firstDeploymentBlock: bigint;
  /** First deployment timestamp */
  firstDeploymentTimestamp: bigint;
  /** Last activity block */
  lastActivityBlock: bigint;
  /** Last activity timestamp */
  lastActivityTimestamp: bigint;
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
  totalUsersDeposit: string;
  currentDeposit: string;
  revenue: string;
  deployedAtBlock: string;
  deployedAtTransaction: string;
  deployedAtTimestamp: string;
  pools: SerializedPool[];
  transactions: SerializedTransaction[];
  lastUpdatedBlock: string;
  lastUpdatedTimestamp: string;
}

/**
 * Serialized Pool (BigInt -> string)
 */
export interface SerializedPool {
  id: string;
  poolId: string;
  paymaster: SerializedPaymasterContract;
  network: string;
  chainId: string;
  joiningFee: string;
  totalDeposits: string;
  memberCount: string;
  currentMerkleRoot: string;
  currentRootIndex: number;
  rootHistoryCount: number;
  createdAtBlock: string;
  createdAtTransaction: string;
  createdAtTimestamp: string;
  members: SerializedPoolMember[];
  transactions: SerializedTransaction[];
  lastUpdatedBlock: string;
  lastUpdatedTimestamp: string;
}

/**
 * Serialized PoolMember (BigInt -> string)
 */
export interface SerializedPoolMember {
  id: string;
  pool: SerializedPool;
  network: string;
  chainId: string;
  memberIndex: string;
  identityCommitment: string;
  merkleRootWhenAdded: string;
  rootIndexWhenAdded: number;
  addedAtBlock: string;
  addedAtTransaction: string;
  addedAtTimestamp: string;
  gasUsed?: string;
  nullifierUsed?: boolean;
  nullifier?: string;
}

/**
 * Serialized Transaction (BigInt -> string)
 */
export interface SerializedTransaction {
  id: string;
  userOpHash: string;
  paymaster: SerializedPaymasterContract;
  pool: SerializedPool;
  network: string;
  chainId: string;
  sender: string;
  actualGasCost: string;
  nullifier: string;
  executedAtBlock: string;
  executedAtTransaction: string;
  executedAtTimestamp: string;
  gasPrice?: string;
  totalGasUsed?: string;
}

/**
 * Serialized NetworkInfo (BigInt -> string)
 */
export interface SerializedNetworkInfo {
  id: string;
  name: string;
  chainId: string;
  totalPaymasters: string;
  totalPools: string;
  totalMembers: string;
  totalTransactions: string;
  totalGasSpent: string;
  totalRevenue: string;
  firstDeploymentBlock: string;
  firstDeploymentTimestamp: string;
  lastActivityBlock: string;
  lastActivityTimestamp: string;
}

/**
 * ========================================
 * RESPONSE WRAPPER TYPES
 * ========================================
 */

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
    };
    /** Verifier contract (if applicable) */
    verifier?: string;
  };
}

/**
 * Entity types for type guards
 */
export type EntityType = 'PaymasterContract' | 'Pool' | 'PoolMember' | 'Transaction' | 'NetworkInfo';
