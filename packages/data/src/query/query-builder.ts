/**
 * Main query builder that provides access to all entity-specific query builders
 * Updated for the new network-aware schema structure
 *
 * This is the entry point for the fluent query API. It provides methods to start
 * building queries for different entity types and includes convenience methods
 * for common cross-entity queries.
 */

import type { SubgraphClient } from '../client/subgraph-client.js';
import { PaymasterContractQueryBuilder } from './builders/paymaster-query-builder.js';
import { PoolQueryBuilder } from './builders/pool-query-builder.js';
import { PoolMemberQueryBuilder } from './builders/pool-member-query-builder.js';
import { TransactionQueryBuilder } from './builders/transaction-query-builder.js';
import { NetworkInfoQueryBuilder } from './builders/network-info-query-builder.js';

/**
 * Main query builder that provides access to all entity-specific query builders
 *
 * This class serves as the entry point for the fluent query API and provides
 * methods to start building queries for different entity types.
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
   *
   * @returns PaymasterContractQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const paymasters = await client.query()
   *   .paymasters()
   *   .byNetwork("base-sepolia")
   *   .byType("GasLimited")
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
   * Start building a query for pools
   *
   * @returns PoolQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const pools = await client.query()
   *   .pools()
   *   .byNetwork("base-sepolia")
   *   .byPaymaster("0x456...")
   *   .withMinMembers(10)
   *   .orderByPopularity()
   *   .limit(20)
   *   .execute();
   * ```
   */
  pools(): PoolQueryBuilder {
    return new PoolQueryBuilder(this.client);
  }

  /**
   * Start building a query for pool members
   *
   * @returns PoolMemberQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const members = await client.query()
   *   .poolMembers()
   *   .byNetwork("base-sepolia")
   *   .byPool("123")
   *   .withNullifierUsed()
   *   .orderByJoinDate()
   *   .limit(50)
   *   .execute();
   * ```
   */
  poolMembers(): PoolMemberQueryBuilder {
    return new PoolMemberQueryBuilder(this.client);
  }

  /**
   * Start building a query for user operations
   *
   * @returns TransactionQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const transactions = await client.query()
   *   .transactions()
   *   .byNetwork("base-sepolia")
   *   .byPaymaster("0x456...")
   *   .bySender("0x789...")
   *   .orderByTimestamp()
   *   .limit(25)
   *   .execute();
   * ```
   */
  transactions(): TransactionQueryBuilder {
    return new TransactionQueryBuilder(this.client);
  }

  /**
   * Start building a query for network information
   *
   * @returns NetworkInfoQueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * const networkInfo = await client.query()
   *   .networkInfo()
   *   .byNetwork("base-sepolia")
   *   .execute();
   * ```
   */
  networkInfo(): NetworkInfoQueryBuilder {
    return new NetworkInfoQueryBuilder(this.client);
  }
}
