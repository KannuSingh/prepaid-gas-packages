/**
 * Main query builder for the paymaster subgraph (Updated)
 * Provides access to all entity-specific query builders
 *
 * This is the entry point for the fluent query API for the new
 * single-pool-per-contract architecture with 3 core entities:
 * - PaymasterContract (each contract IS a pool)
 * - Activity (unified timeline of all events)
 * - UserOperation (detailed operation tracking)
 */

import type { SubgraphClient } from '../client/subgraph-client.js';
import { PaymasterContractQueryBuilder } from './builders/paymaster-query-builder.js';
import {
  ActivityQueryBuilder,
  createDepositActivityQueryBuilder,
  createRevenueActivityQueryBuilder,
} from './builders/activity-query-builder.js';
import { UserOperationQueryBuilder } from './builders/user-operation-query-builder.js';
import type {
  DepositActivity,
  RevenueActivity,
  SerializedDepositActivity,
  SerializedRevenueActivity,
} from '../types/subgraph.js';

/**
 * Main query builder that provides access to all entity-specific query builders
 *
 */
export class QueryBuilder {
  constructor(private client: SubgraphClient) {}

  /**
   * ========================================
   * ENTITY-SPECIFIC QUERY BUILDERS
   * ========================================
   */

  /**
   * Start building a query for paymaster contracts
   * Each contract IS a pool in the new architecture
   *
   * @returns PaymasterContractQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const paymasters = await client.query()
   *   .paymasters()
   *   .byNetwork("base-sepolia")
   *   .byContractType("OneTimeUse")
   *   .withMinRevenue("1000000000000000000")
   *   .orderByRevenue()
   *   .limit(10)
   *   .execute();
   * ```
   */
  paymasters(): PaymasterContractQueryBuilder {
    return new PaymasterContractQueryBuilder(this.client);
  }

  /**
   * Start building a query for activities
   * Unified timeline of all events (deposits, user ops, revenue withdrawals)
   *
   * @returns ActivityQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * // Mixed timeline view - all activity types together
   * const activities = await client.query()
   *   .activities()
   *   .byNetwork("base-sepolia")
   *   .byPaymaster("0x456...")
   *   .afterTimestamp("1640995200")
   *   .orderByTimestamp()
   *   .limit(50)
   *   .execute();
   *
   * // For detailed user operation data with nullifier, use userOperations() instead
   * ```
   */
  activities(): ActivityQueryBuilder {
    return new ActivityQueryBuilder(this.client);
  }

  /**
   * Start building a query for user operations
   * Detailed tracking for specialized analytics including nullifier data
   *
   * @returns UserOperationQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const userOps = await client.query()
   *   .userOperations()
   *   .byNetwork("base-sepolia")
   *   .byPaymaster("0x456...")
   *   .bySender("0x789...")
   *   .withMinGasCost("1000000000000000")
   *   .orderByTimestamp()
   *   .limit(25)
   *   .execute();
   * ```
   */
  userOperations(): UserOperationQueryBuilder {
    return new UserOperationQueryBuilder(this.client);
  }

  /**
   * ========================================
   * TYPED ACTIVITY QUERY BUILDERS
   * ========================================
   */

  /**
   * Start building a query for deposit activities only
   * Returns typed DepositActivity[] results
   *
   * @returns ActivityQueryBuilder<DepositActivity> for fluent query building
   *
   * @example
   * ```typescript
   * const deposits = await client.query()
   *   .depositActivities()
   *   .byNetwork("base-sepolia")
   *   .byDepositor("0x123...")
   *   .orderByTimestamp()
   *   .limit(20)
   *   .execute();
   * ```
   */
  depositActivities(): ActivityQueryBuilder<DepositActivity, SerializedDepositActivity> {
    return createDepositActivityQueryBuilder(this.client);
  }

  /**
   * Start building a query for revenue withdrawal activities only
   * Returns typed RevenueActivity[] results
   *
   * @returns ActivityQueryBuilder<RevenueActivity> for fluent query building
   *
   * @example
   * ```typescript
   * const revenues = await client.query()
   *   .revenueActivities()
   *   .byNetwork("base-sepolia")
   *   .byWithdrawAddress("0x789...")
   *   .withMinAmount("5000000000000000000")
   *   .orderByAmount()
   *   .limit(10)
   *   .execute();
   * ```
   */
  revenueActivities(): ActivityQueryBuilder<RevenueActivity, SerializedRevenueActivity> {
    return createRevenueActivityQueryBuilder(this.client);
  }
}
