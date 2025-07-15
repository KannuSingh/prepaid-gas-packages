/**
 * Query builder for Pool entities
 * Updated for the new network-aware schema structure
 */

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type { Pool, SerializedPool } from '../../types/subgraph.js';
import { BaseQueryBuilder } from './base-query-builder.js';

import { PoolFields, PoolWhereInput } from '../types.js';
import { serializePool } from '../../transformers/index.js';
import { NetworkName } from '@prepaid-gas/constants';

export type PoolOrderBy =
  | 'createdAtTimestamp'
  | 'memberCount'
  | 'totalDeposits'
  | 'joiningFee'
  | 'lastUpdatedTimestamp'
  | 'poolId';

/**
 * Query builder for Pool entities
 *
 * Provides a fluent interface for building complex pool queries
 * with full support for the new network-aware schema.
 */
export class PoolQueryBuilder extends BaseQueryBuilder<Pool, SerializedPool, PoolFields, PoolWhereInput, PoolOrderBy> {
  private includeMembers: boolean = false;
  private membersLimit: number = 10;
  private includeTransactions: boolean = false;
  private transactionsLimit: number = 10;

  constructor(client: SubgraphClient) {
    super(client, 'pools', 'poolId', 'desc');
  }

  protected buildDynamicQuery(): string {
    const fields = this.config.selectedFields?.join('\n        ') || this.getDefaultFields();
    const variables = this.getVariableDeclarations();
    const whereClause = this.buildWhereClauseString();
    const orderByClause = this.config.orderBy ? `orderBy: ${this.config.orderBy}` : '';
    const orderDirectionClause = this.config.orderDirection ? `orderDirection: ${this.config.orderDirection}` : '';

    const args = [whereClause, orderByClause, orderDirectionClause, 'first: $first', 'skip: $skip']
      .filter(Boolean)
      .join(', ');

    const queryName = `GetPools`;

    return `
      query ${queryName}(${variables}) {
        pools(${args}) {
          ${fields}
        }
      }
    `;
  }
  protected buildVariables(): Record<string, any> {
    const variables: Record<string, any> = {
      first: this.config.first || 100,
      skip: this.config.skip || 0,
    };

    if (this.config.where) {
      this.addWhereVariables(this.config.where, variables);
    }

    return variables;
  }
  protected buildWhereClauseString(): string {
    if (!this.config.where || Object.keys(this.config.where).length === 0) {
      return '';
    }

    const conditions = this.buildWhereConditions(this.config.where);
    return conditions.length > 0 ? `where: { ${conditions.join(', ')} }` : '';
  }

  protected getSerializer(): (entity: Pool) => SerializedPool {
    return serializePool;
  }

  private getVariableDeclarations(): string {
    const declarations = ['$first: Int!', '$skip: Int!'];

    if (this.config.where) {
      this.addVariableDeclarations(this.config.where, declarations);
    }

    return declarations.join(', ');
  }

  private addVariableDeclarations(where: Partial<PoolWhereInput>, declarations: string[]): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'network':
          declarations.push('$network: String');
          break;
        case 'poolId':
          declarations.push('$poolId: String');
          break;
        case 'memberCount_gte':
          declarations.push('$memberCount_gte: String');
          break;
        case 'memberCount_lte':
          declarations.push('$memberCount_lte: String');
          break;
        case 'totalDeposits_gte':
          declarations.push('$totalDeposits_gte: String');
          break;
        case 'totalDeposits_lte':
          declarations.push('$totalDeposits_lte: String');
          break;
        case 'joiningFee_gte':
          declarations.push('$joiningFee_gte: String');
          break;
        case 'joiningFee_lte':
          declarations.push('$joiningFee_lte: String');
          break;
        case 'createdAtTimestamp_gte':
          declarations.push('$createdAtTimestamp_gte: String');
          break;
        case 'createdAtTimestamp_lte':
          declarations.push('$createdAtTimestamp_lte: String');
          break;
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            if ('address' in value) {
              declarations.push('$paymasterAddress: String');
            }
            if ('contractType' in value) {
              declarations.push('$paymasterType: String');
            }
          }
          break;
        case 'totalDeposits_gt':
          declarations.push('$totalDeposits_gt: String');
          break;
        case 'memberCount_gt':
          declarations.push('$memberCount_gt: String');
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<PoolWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'network':
          variables.network = value;
          break;
        case 'poolId':
          variables.poolId = value;
          break;
        case 'memberCount_gte':
        case 'memberCount_lte':
        case 'memberCount_gt':
          variables[key.replace('memberCount_', 'memberCount_')] = value;
          break;
        case 'totalDeposits_gte':
        case 'totalDeposits_lte':
        case 'totalDeposits_gt':
          variables[key.replace('totalDeposits_', 'totalDeposits_')] = value;
          break;
        case 'joiningFee_gte':
        case 'joiningFee_lte':
          variables[key.replace('joiningFee_', 'joiningFee_')] = value;
          break;
        case 'createdAtTimestamp_gte':
        case 'createdAtTimestamp_lte':
          variables[key.replace('createdAtTimestamp_', 'createdAtTimestamp_')] = value;
          break;
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            if ('address' in value) {
              variables.paymasterAddress = value.address;
            }
            if ('contractType' in value) {
              variables.paymasterType = value.contractType;
            }
          }
          break;
      }
    }
  }

  private buildWhereConditions(where: Partial<PoolWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'network':
          conditions.push('network: $network');
          break;
        case 'poolId':
          conditions.push('poolId: $poolId');
          break;
        case 'memberCount_gte':
          conditions.push('memberCount_gte: $memberCount_gte');
          break;
        case 'memberCount_lte':
          conditions.push('memberCount_lte: $memberCount_lte');
          break;
        case 'memberCount_gt':
          conditions.push('memberCount_gt: $memberCount_gt');
          break;
        case 'totalDeposits_gte':
          conditions.push('totalDeposits_gte: $totalDeposits_gte');
          break;
        case 'totalDeposits_lte':
          conditions.push('totalDeposits_lte: $totalDeposits_lte');
          break;
        case 'totalDeposits_gt':
          conditions.push('totalDeposits_gt: $totalDeposits_gt');
          break;
        case 'joiningFee_gte':
          conditions.push('joiningFee_gte: $joiningFee_gte');
          break;
        case 'joiningFee_lte':
          conditions.push('joiningFee_lte: $joiningFee_lte');
          break;
        case 'createdAtTimestamp_gte':
          conditions.push('createdAtTimestamp_gte: $createdAtTimestamp_gte');
          break;
        case 'createdAtTimestamp_lte':
          conditions.push('createdAtTimestamp_lte: $createdAtTimestamp_lte');
          break;
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            const nestedConditions: string[] = [];
            if ('address' in value) {
              nestedConditions.push('address: $paymasterAddress');
            }
            if ('contractType' in value) {
              nestedConditions.push('contractType: $paymasterType');
            }
            if (nestedConditions.length > 0) {
              conditions.push(`paymaster_: { ${nestedConditions.join(', ')} }`);
            }
          }
          break;
      }
    }

    return conditions;
  }
  /**
   * Override default fields for Pool entity.
   */
  protected getDefaultFields(): string {
    let baseFields = `
      id
      poolId
      network
      chainId
      joiningFee
      totalDeposits
      memberCount
      currentMerkleRoot
      currentRootIndex
      rootHistoryCount
      createdAtBlock
      createdAtTransaction
      createdAtTimestamp
      lastUpdatedBlock
      lastUpdatedTimestamp
      paymaster {
        id
        contractType
        address
      }
    `;

    // If members are requested, include them in the query
    if (this.includeMembers) {
      baseFields =
        baseFields +
        `
      members(first: ${this.membersLimit}, orderBy: addedAtTimestamp, orderDirection: desc) {
        id
        memberIndex
        identityCommitment
        merkleRootWhenAdded
        rootIndexWhenAdded
        addedAtBlock
        addedAtTransaction
        addedAtTimestamp
        gasUsed
        nullifierUsed
        nullifier
      }
      `;
    }

    if (this.includeTransactions) {
      baseFields =
        baseFields +
        `
      transactions (first: ${this.transactionsLimit}, orderBy: executedAtTimestamp, orderDirection: desc) {
        id
        userOpHash
        sender
        actualGasCost
        executedAtTimestamp
        nullifier
        executedAtTransaction
      }
      `;
    }

    return baseFields;
  }
  /**
   * ========================================
   * FILTERING METHODS
   * ========================================
   */

  /**
   * Filter by network
   *
   * @param network - Network identifier
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const pools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .execute();
   * ```
   */
  byNetwork(network: NetworkName): this {
    this.where({ network: network });
    return this;
  }

  /**
   * Filter by pool ID
   *
   * @param poolId - Pool ID
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const pool = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .byPoolId("123")
   *   .first();
   * ```
   */
  byPoolId(poolId: string): this {
    // Note: The GraphQL schema expects `poolId` as a `BigInt` for direct filtering,
    // but the `id` field (network-prefixed) is the primary ID.
    // If filtering by numeric `poolId`, it should be converted to string.
    // For `GET_POOL_DETAILS`, the `id` is "network-poolId".
    // This method will set the `id` for `GET_POOL_DETAILS` or `poolId` for general filtering.
    this.where({ poolId: poolId });
    return this;
  }

  /**
   * Filter by paymaster address
   *
   * @param paymaster - Paymaster contract address
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const pools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .byPaymaster("0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf")
   *   .execute();
   * ```
   */
  byPaymaster(paymaster: string): this {
    this.where({ paymaster_: { address: paymaster } });
    return this;
  }

  /**
   * Filter by minimum member count
   *
   * @param minMembers - Minimum number of members
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const popularPools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .withMinMembers(10)
   *   .execute();
   * ```
   */
  withMinMembers(minMembers: number): this {
    this.where({ memberCount_gte: minMembers.toString() });
    return this;
  }

  /**
   * Filter by maximum member count
   *
   * @param maxMembers - Maximum number of members
   * @returns PoolQueryBuilder for method chaining
   */
  withMaxMembers(maxMembers: number): this {
    this.where({ memberCount_lte: maxMembers.toString() });
    return this;
  }

  /**
   * Filter by minimum total deposits
   *
   * @param minDeposits - Minimum total deposits in wei (as string)
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const wellFundedPools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .withMinDeposits("1000000000000000000") // 1 ETH
   *   .execute();
   * ```
   */
  withMinDeposits(minDeposits: string): this {
    this.where({ totalDeposits_gte: minDeposits });
    return this;
  }

  /**
   * Filter by maximum total deposits
   *
   * @param maxDeposits - Maximum total deposits in wei (as string)
   * @returns PoolQueryBuilder for method chaining
   */
  withMaxDeposits(maxDeposits: string): this {
    this.where({ totalDeposits_lte: maxDeposits });
    return this;
  }

  /**
   * Filter by minimum joining fee
   *
   * @param minJoiningFee - Minimum joining fee in wei (as string)
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const expensivePools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .withMinJoiningFee("100000000000000000") // 0.1 ETH
   *   .execute();
   * ```
   */
  withMinJoiningFee(minJoiningFee: string): this {
    this.where({ joiningFee_gte: minJoiningFee });
    return this;
  }

  /**
   * Filter by maximum joining fee
   *
   * @param maxJoiningFee - Maximum joining fee in wei (as string)
   * @returns PoolQueryBuilder for method chaining
   */
  withMaxJoiningFee(maxJoiningFee: string): this {
    this.where({ joiningFee_lte: maxJoiningFee });
    return this;
  }

  /**
   * Filter by creation date (after)
   *
   * @param timestamp - Timestamp string or number
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const recentPools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .createdAfter("1704067200") // 2024-01-01
   *   .execute();
   * ```
   */
  createdAfter(timestamp: string | number): this {
    this.where({ createdAtTimestamp_gte: timestamp.toString() });
    return this;
  }

  /**
   * Filter by creation date (before)
   *
   * @param timestamp - Timestamp string or number
   * @returns PoolQueryBuilder for method chaining
   */
  createdBefore(timestamp: string | number): this {
    this.where({ createdAtTimestamp_lte: timestamp.toString() });
    return this;
  }

  /**
   * Filter only pools with members
   *
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const activePools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .withMembers(20)  // Include up to 20 members
   *   .execute();
   * ```
   */
  withMembers(limit: number = 10): this {
    this.includeMembers = true;
    this.membersLimit = limit;
    return this;
  }

  /**
   * Include transactions in pools
   *
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const activePools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .withTransactions(20)  // Include up to 20 transactions
   *   .execute();
   * ```
   */
  withTransactions(limit: number = 10): this {
    this.includeTransactions = true;
    this.transactionsLimit = limit;
    return this;
  }

  /**
   * Filter only active pools (positive deposits)
   *
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const activePools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .onlyActive()
   *   .execute();
   * ```
   */
  onlyActive(): this {
    this.where({ totalDeposits_gt: '0' });
    return this;
  }

  /**
   * ========================================
   * ORDERING METHODS
   * ========================================
   */

  /**
   * Order by member count (most popular first)
   *
   * @returns PoolQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const popularPools = await client.query().pools()
   *   .byNetwork("base-sepolia")
   *   .orderByPopularity()
   *   .limit(10)
   *   .execute();
   * ```
   */
  orderByPopularity(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('memberCount', direction);
    return this;
  }

  /**
   * Order by total deposits
   *
   * @returns PoolQueryBuilder for method chaining
   */
  orderByDeposits(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalDeposits', direction);
    return this;
  }

  /**
   * Order by joining fee
   *
   * @returns PoolQueryBuilder for method chaining
   */
  orderByJoiningFee(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy('joiningFee', direction);
    return this;
  }

  /**
   * Order by creation date (newest first)
   *
   * @returns PoolQueryBuilder for method chaining
   */
  orderByCreation(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('createdAtTimestamp', direction);
    return this;
  }

  /**
   * Order by last activity
   *
   * @returns PoolQueryBuilder for method chaining
   */
  orderByActivity(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('lastUpdatedTimestamp', direction);
    return this;
  }

  /**
   * Order by pool ID
   *
   * @returns PoolQueryBuilder for method chaining
   */
  orderByPoolId(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy('poolId', direction);
    return this;
  }
}
