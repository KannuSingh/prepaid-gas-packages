/**
 * Query builder for PaymasterContract entities
 * Updated for the new network-aware schema structure
 */

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type { PaymasterContract, PaymasterType, SerializedPaymasterContract } from '../../types/subgraph.js';
import { GET_PAYMASTER_WITH_RELATED } from '../../client/queries.js';
import { BaseQueryBuilder } from './base-query-builder.js';
import { PaymasterContractFields, PaymasterContractWhereInput } from '../types.js';
import { serializePaymasterContract } from '../../transformers/index.js';
import { NetworkName } from '@private-prepaid-gas/constants';

export type PaymasterContractOrderBy = 'deployedAtTimestamp' | 'revenue' | 'currentDeposit' | 'lastUpdatedTimestamp';

/**
 * Query builder for PaymasterContract entities
 *
 * Provides a fluent interface for building complex paymaster queries
 * with full support for the new network-aware schema.
 */
export class PaymasterContractQueryBuilder extends BaseQueryBuilder<
  PaymasterContract,
  SerializedPaymasterContract,
  PaymasterContractFields,
  PaymasterContractWhereInput,
  PaymasterContractOrderBy
> {
  constructor(private subgraphClient: SubgraphClient) {
    super(subgraphClient, 'paymasterContracts', 'deployedAtTimestamp', 'desc');
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

    const queryName = `GetPaymasterContracts`;

    return `
      query ${queryName}(${variables}) {
        paymasterContracts(${args}) {
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

  protected getSerializer(): (entity: PaymasterContract) => SerializedPaymasterContract {
    return serializePaymasterContract;
  }

  private getVariableDeclarations(): string {
    const declarations = ['$first: Int!', '$skip: Int!'];

    if (this.config.where) {
      this.addVariableDeclarations(this.config.where, declarations);
    }

    return declarations.join(', ');
  }

  private addVariableDeclarations(where: Partial<PaymasterContractWhereInput>, declarations: string[]): void {
    for (const [key] of Object.entries(where)) {
      switch (key) {
        case 'network':
          declarations.push('$network: String');
          break;
        case 'contractType':
          declarations.push('$contractType: String');
          break;
        case 'address':
          declarations.push('$address: String');
          break;
        case 'id':
          declarations.push('$id: ID');
          break;
        case 'revenue_gte':
          declarations.push('$revenue_gte: String');
          break;
        case 'revenue_lte':
          declarations.push('$revenue_lte: String');
          break;
        case 'revenue_gt':
          declarations.push('$revenue_gt: String');
          break;
        case 'currentDeposit_gte':
          declarations.push('$currentDeposit_gte: String');
          break;
        case 'currentDeposit_lte':
          declarations.push('$currentDeposit_lte: String');
          break;
        case 'deployedAtTimestamp_gte':
          declarations.push('$deployedAtTimestamp_gte: String');
          break;
        case 'deployedAtTimestamp_lte':
          declarations.push('$deployedAtTimestamp_lte: String');
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<PaymasterContractWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'network':
          variables.network = value;
          break;
        case 'contractType':
          variables.contractType = value;
          break;
        case 'address':
          variables.address = value;
          break;
        case 'id':
          variables.id = value;
          break;
        case 'revenue_gte':
        case 'revenue_lte':
        case 'revenue_gt':
          variables[key] = value;
          break;
        case 'currentDeposit_gte':
        case 'currentDeposit_lte':
          variables[key] = value;
          break;
        case 'deployedAtTimestamp_gte':
        case 'deployedAtTimestamp_lte':
          variables[key] = value;
          break;
      }
    }
  }

  private buildWhereConditions(where: Partial<PaymasterContractWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key] of Object.entries(where)) {
      switch (key) {
        case 'network':
          conditions.push('network: $network');
          break;
        case 'contractType':
          conditions.push('contractType: $contractType');
          break;
        case 'address':
          conditions.push('address: $address');
          break;
        case 'id':
          conditions.push('id: $id');
          break;
        case 'revenue_gte':
          conditions.push('revenue_gte: $revenue_gte');
          break;
        case 'revenue_lte':
          conditions.push('revenue_lte: $revenue_lte');
          break;
        case 'revenue_gt':
          conditions.push('revenue_gt: $revenue_gt');
          break;
        case 'currentDeposit_gte':
          conditions.push('currentDeposit_gte: $currentDeposit_gte');
          break;
        case 'currentDeposit_lte':
          conditions.push('currentDeposit_lte: $currentDeposit_lte');
          break;
        case 'deployedAtTimestamp_gte':
          conditions.push('deployedAtTimestamp_gte: $deployedAtTimestamp_gte');
          break;
        case 'deployedAtTimestamp_lte':
          conditions.push('deployedAtTimestamp_lte: $deployedAtTimestamp_lte');
          break;
      }
    }

    return conditions;
  }

  /**
   * Override default fields for PaymasterContract entity.
   */
  protected getDefaultFields(): string {
    return `
    id
    contractType
    address
    network
    chainId
    totalUsersDeposit
    currentDeposit
    revenue
    deployedAtBlock
    deployedAtTransaction
    deployedAtTimestamp
    lastUpdatedBlock
    lastUpdatedTimestamp
  `;
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
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const paymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .execute();
   * ```
   */
  byNetwork(network: NetworkName): this {
    this.where({ network: network });
    return this;
  }

  /**
   * Filter by contract type
   *
   * @param type - Paymaster contract type
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const gasLimitedPaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .byType("GasLimited")
   *   .execute();
   * ```
   */
  byType(type: PaymasterType): this {
    this.where({ contractType: type });
    return this;
  }

  /**
   * Filter by contract address
   *
   * @param address - Contract address
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const paymaster = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .byAddress("0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf")
   *   .first();
   * ```
   */
  byAddress(address: string): this {
    this.where({ address: address });
    return this;
  }

  /**
   * Filter by composite ID (network-address)
   * This is for direct lookup of a single paymaster.
   *
   * @param network - Network identifier
   * @param address - Paymaster contract address
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const paymaster = await client.query().paymasters()
   *   .byId("base-sepolia", "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf")
   *   .first();
   * ```
   */
  byId(network: NetworkName, address: string): this {
    this.where({ id: `${network}-${address}` });
    this.byNetwork(network);
    this.byAddress(address);
    return this;
  }

  /**
   * Filter by minimum revenue
   *
   * @param minRevenue - Minimum revenue in wei (as string)
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const profitablePaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .withMinRevenue("1000000000000000000") // 1 ETH
   *   .execute();
   * ```
   */
  withMinRevenue(minRevenue: string): this {
    this.where({ revenue_gte: minRevenue });
    return this;
  }

  /**
   * Filter by maximum revenue
   *
   * @param maxRevenue - Maximum revenue in wei (as string)
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  withMaxRevenue(maxRevenue: string): this {
    this.where({ revenue_lte: maxRevenue });
    return this;
  }

  /**
   * Filter by minimum deposit
   *
   * @param minDeposit - Minimum current deposit in wei (as string)
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const wellFundedPaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .withMinDeposit("5000000000000000000") // 5 ETH
   *   .execute();
   * ```
   */
  withMinDeposit(minDeposit: string): this {
    this.where({ currentDeposit_gte: minDeposit });
    return this;
  }

  /**
   * Filter by maximum deposit
   *
   * @param maxDeposit - Maximum current deposit in wei (as string)
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  withMaxDeposit(maxDeposit: string): this {
    this.where({ currentDeposit_lte: maxDeposit });
    return this;
  }

  /**
   * Filter by deployment date (after)
   *
   * @param timestamp - Timestamp string or number
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const recentPaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .deployedAfter("1704067200") // 2024-01-01
   *   .execute();
   * ```
   */
  deployedAfter(timestamp: string | number): this {
    this.where({ deployedAtTimestamp_gte: timestamp.toString() });
    return this;
  }

  /**
   * Filter by deployment date (before)
   *
   * @param timestamp - Timestamp string or number
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  deployedBefore(timestamp: string | number): this {
    this.where({ deployedAtTimestamp_lte: timestamp.toString() });
    return this;
  }

  /**
   * Filter only active paymasters (positive revenue)
   *
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const activePaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .onlyActive()
   *   .execute();
   * ```
   */
  onlyActive(): this {
    this.where({ revenue_gt: '0' });
    return this;
  }

  /**
   * ========================================
   * ORDERING METHODS
   * ========================================
   */

  /**
   * Order by revenue (highest first)
   *
   * @returns PaymasterContractQueryBuilder for method chaining
   *
   * @example
   * ```typescript
   * const topPaymasters = await client.query().paymasters()
   *   .byNetwork("base-sepolia")
   *   .orderByRevenue()
   *   .limit(10)
   *   .execute();
   * ```
   */
  orderByRevenue(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('revenue', direction);
    return this;
  }

  /**
   * Order by current deposit
   *
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  orderByDeposit(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('currentDeposit', direction);
    return this;
  }

  /**
   * Order by deployment date
   *
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  orderByDeployment(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('deployedAtTimestamp', direction);
    return this;
  }

  /**
   * Order by last activity
   *
   * @returns PaymasterContractQueryBuilder for method chaining
   */
  orderByActivity(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('lastUpdatedTimestamp', direction);
    return this;
  }

  /**
   * ========================================
   * SPECIAL QUERIES
   * ========================================
   */

  /**
   * Get paymaster with related data (pools, transactions, withdrawals)
   *
   * @param poolsLimit - Maximum number of pools to fetch
   * @param transactionsLimit - Maximum number of transactions to fetch
   * @param withdrawalsLimit - Maximum number of withdrawals to fetch
   * @returns Promise resolving to paymaster with related data
   */
  async withRelated(
    poolsLimit: number = 10,
    transactionsLimit: number = 10,
    withdrawalsLimit: number = 10
  ): Promise<
    | (PaymasterContract & {
        pools: any[];
        transactions: any[];
        revenueWithdrawals: any[];
      })
    | null
  > {
    if (!this.config.where?.address || !this.config.where?.network) {
      throw new Error('Address and network are required for withRelated query');
    }

    const network = this.config.where.network;
    const address = this.config.where.address;
    const id = `${network}-${address}`;

    const result = await this.client.executeQuery<{
      paymasterContract: PaymasterContract & {
        pools: any[];
        transactions: any[];
        revenueWithdrawals: any[];
      };
    }>(GET_PAYMASTER_WITH_RELATED, {
      id,
      poolsFirst: poolsLimit,
      transactionsFirst: transactionsLimit,
      withdrawalsFirst: withdrawalsLimit,
    });

    return result.paymasterContract || null;
  }
}
