// network-info-query-builder.ts (Refactored)

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type { NetworkInfo, SerializedNetworkInfo } from '../../types/subgraph.js';
import { serializeNetworkInfo } from '../../transformers/index.js';
import { NetworkInfoFields, NetworkInfoWhereInput } from '../types.js';
import { BaseQueryBuilder } from './base-query-builder.js';
import { NetworkName } from '@private-prepaid-gas/constants';

export type NetworkInfoOrderBy =
  | 'id'
  | 'name'
  | 'totalPaymasters'
  | 'totalPools'
  | 'totalMembers'
  | 'totalTransactions'
  | 'totalGasSpent'
  | 'totalRevenue'
  | 'firstDeploymentTimestamp'
  | 'lastActivityTimestamp'
  | 'chainId';

/**
 * Query builder for NetworkInfo entities
 */
export class NetworkInfoQueryBuilder extends BaseQueryBuilder<
  NetworkInfo,
  SerializedNetworkInfo,
  NetworkInfoFields,
  NetworkInfoWhereInput,
  NetworkInfoOrderBy
> {
  constructor(private subgraphClient: SubgraphClient) {
    super(subgraphClient, 'networkInfos', 'name', 'asc'); // Default order by name, ascending
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

    return `
      query GetNetworkInfos(${variables}) {
        networkInfos(${args}) {
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

  protected getSerializer(): (entity: NetworkInfo) => SerializedNetworkInfo {
    return serializeNetworkInfo;
  }

  private getVariableDeclarations(): string {
    const declarations = ['$first: Int!', '$skip: Int!'];

    if (this.config.where) {
      this.addVariableDeclarations(this.config.where, declarations);
    }

    return declarations.join(', ');
  }

  private addVariableDeclarations(where: Partial<NetworkInfoWhereInput>, declarations: string[]): void {
    for (const [key] of Object.entries(where)) {
      switch (key) {
        case 'id':
          declarations.push('$id: ID');
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<NetworkInfoWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      variables[key] = value;
    }
  }

  private buildWhereConditions(where: Partial<NetworkInfoWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key] of Object.entries(where)) {
      conditions.push(`${key}: $${key}`);
    }

    return conditions;
  }

  /**
   * Override default fields for NetworkInfo entity.
   */
  protected getDefaultFields(): string {
    return `
      id
      name
      chainId
      rpcUrl
      explorerUrl
      totalPaymasters
      totalPools
      totalMembers
      totalTransactions
      totalGasSpent
      totalRevenue
      firstDeploymentTimestamp
      lastActivityTimestamp
    `;
  }

  /**
   * ========================================
   * FILTERING METHODS
   * ========================================
   */

  /**
   * Filter by a specific network.
   *
   * @param network - Network identifier (e.g., "base-sepolia").
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networkInfo = await client.query().networkInfo()
   * .byNetwork("base-sepolia")
   * .execute();
   * ```
   */
  byNetwork(network: NetworkName): this {
    this.where({ id: network });
    return this;
  }

  /**
   * ========================================
   * ORDERING METHODS (, inherited from BaseQueryBuilder)
   * ========================================
   */

  /**
   * Order results by the total number of paymasters.
   *
   * @param direction - Sort direction, "desc" for most paymasters first (default), "asc" for fewest.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByPaymasters = await client.query().networkInfo()
   * .orderByPaymasters("desc")
   * .limit(5)
   * .execute();
   * ```
   */
  orderByPaymasters(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalPaymasters', direction);
    return this;
  }

  /**
   * Order results by the total number of pools.
   *
   * @param direction - Sort direction, "desc" for most pools first (default), "asc" for fewest.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByPools = await client.query().networkInfo()
   * .orderByPools("desc")
   * .execute();
   * ```
   */
  orderByPools(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalPools', direction);
    return this;
  }

  /**
   * Order results by the total number of members.
   *
   * @param direction - Sort direction, "desc" for most members first (default), "asc" for fewest.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByMembers = await client.query().networkInfo()
   * .orderByMembers("desc")
   * .execute();
   * ```
   */
  orderByMembers(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalMembers', direction);
    return this;
  }

  /**
   * Order results by the total number of user operations.
   *
   * @param direction - Sort direction, "desc" for most user operations first (default), "asc" for fewest.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByTransactions = await client.query().networkInfo()
   * .orderByTransactions("desc")
   * .execute();
   * ```
   */
  orderByTransactions(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalTransactions', direction);
    return this;
  }

  /**
   * Order results by the total gas spent.
   *
   * @param direction - Sort direction, "desc" for most gas spent first (default), "asc" for least.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByGas = await client.query().networkInfo()
   * .orderByGasSpent("desc")
   * .execute();
   * ```
   */
  orderByGasSpent(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalGasSpent', direction);
    return this;
  }

  /**
   * Order results by the total revenue.
   *
   * @param direction - Sort direction, "desc" for most revenue first (default), "asc" for least.
   * @returns The current query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const networksByRevenue = await client.query().networkInfo()
   * .orderByRevenue("desc")
   * .execute();
   * ```
   */
  orderByRevenue(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalRevenue', direction);
    return this;
  }
}
