/**
 * @workspace/data - Subgraph data access layer
 *
 * This package handles all subgraph interactions and data transformations
 * for the prepaid gas paymaster system.
 *
 * Updated for new PaymasterContract-based subgraph structure with comprehensive
 * analytics, revenue tracking, and multi-paymaster support.
 */

/**
 * ========================================
 * CORE TYPES (exact match to subgraph schema)
 * ========================================
 */

// Main entity types
export type {
  PaymasterContract,
  Pool,
  PoolMember,
  Transaction,
  NetworkMetadata,
  PaymasterType,
} from './types/subgraph.js';

// Serialized type definitions
export type {
  SerializedPaymasterContract,
  SerializedPool,
  SerializedPoolMember,
  SerializedNetworkInfo,
  SerializedTransaction,
} from './types/subgraph.js';

/**
 * ========================================
 * CLIENT TYPES AND CLASSES
 * ========================================
 */

// Main client class
export { SubgraphClient } from './client/subgraph-client.js';

/**
 * ========================================
 * QUERY BUILDER API
 * ========================================
 */

// Main query builder class
export { QueryBuilder } from './query/query-builder.js';

// Entity-specific query builders
export { PaymasterContractQueryBuilder } from './query/builders/paymaster-query-builder.js';

export { PoolQueryBuilder } from './query/builders/pool-query-builder.js';

export { PoolMemberQueryBuilder } from './query/builders/pool-member-query-builder.js';

export { TransactionQueryBuilder } from './query/builders/transaction-query-builder.js';

export { NetworkInfoQueryBuilder } from './query/builders/network-info-query-builder.js';

export { BaseQueryBuilder } from './query/builders/base-query-builder.js';

// Package version
export const VERSION = '2.0.0';
