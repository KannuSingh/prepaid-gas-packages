/**
 * Query builder for PaymasterContract entities (Updated)
 * For the new single-pool-per-contract architecture
 */

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type { PaymasterContract, SerializedPaymasterContract } from '../../types/subgraph.js';
import { BaseQueryBuilder } from './base-query-builder.js';
import { PaymasterContractFields, PaymasterContractWhereInput, PaymasterContractOrderBy } from '../types.js';
import { serializePaymasterContract } from '../../transformers/index.js';
import { PaymasterType } from '@prepaid-gas/constants';

/**
 * Query builder for PaymasterContract entities
 *
 * Provides a fluent interface for building complex paymaster queries
 * Updated for the new single-pool-per-contract schema.
 */
export class PaymasterContractQueryBuilder extends BaseQueryBuilder<
  PaymasterContract,
  SerializedPaymasterContract,
  PaymasterContractFields,
  PaymasterContractWhereInput,
  PaymasterContractOrderBy
> {
  constructor(private subgraphClient: SubgraphClient) {
    super(subgraphClient, 'paymasterContracts', 'deployedTimestamp', 'desc');
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
        case 'totalDeposit_gte':
          declarations.push('$totalDeposit_gte: String');
          break;
        case 'totalDeposit_lte':
          declarations.push('$totalDeposit_lte: String');
          break;
        case 'currentDeposit_gte':
          declarations.push('$currentDeposit_gte: String');
          break;
        case 'currentDeposit_lte':
          declarations.push('$currentDeposit_lte: String');
          break;
        case 'treeSize_gte':
          declarations.push('$treeSize_gte: String');
          break;
        case 'treeSize_lte':
          declarations.push('$treeSize_lte: String');
          break;
        case 'treeSize_gt':
          declarations.push('$treeSize_gt: String');
          break;
        case 'deployedTimestamp_gte':
          declarations.push('$deployedTimestamp_gte: String');
          break;
        case 'deployedTimestamp_lte':
          declarations.push('$deployedTimestamp_lte: String');
          break;
        case 'isDead':
          declarations.push('$isDead: Boolean');
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<PaymasterContractWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'network':
        case 'contractType':
        case 'address':
        case 'id':
        case 'revenue_gte':
        case 'revenue_lte':
        case 'revenue_gt':
        case 'totalDeposit_gte':
        case 'totalDeposit_lte':
        case 'currentDeposit_gte':
        case 'currentDeposit_lte':
        case 'treeSize_gte':
        case 'treeSize_lte':
        case 'treeSize_gt':
        case 'deployedTimestamp_gte':
        case 'deployedTimestamp_lte':
        case 'isDead':
          variables[key] = value;
          break;
      }
    }
  }

  private buildWhereConditions(where: Partial<PaymasterContractWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key] of Object.entries(where)) {
      conditions.push(`${key}: $${key}`);
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
    joiningAmount
    scope
    verifier
    totalDeposit
    currentDeposit
    revenue
    root
    rootIndex
    treeDepth
    treeSize
    isDead
    deployedBlock
    deployedTransaction
    deployedTimestamp
    lastBlock
    lastTimestamp
  `;
  }

  /**
   * Get fields with activities included
   */
  private getFieldsWithActivities(): string {
    return `
    ${this.getDefaultFields()}
    activities(orderBy:timestamp, orderDirection:desc) {
      id
      type
      network
      chainId
      block
      transaction
      timestamp
      
      # Deposit-specific fields
      depositor
      commitment
      memberIndex
      newRoot
      
      # UserOp-specific fields
      sender
      userOpHash
      actualGasCost
      
      # Revenue-specific fields
      withdrawAddress
      amount
    }
  `;
  }

  /**
   * ========================================
   * FILTERING METHODS
   * ========================================
   */

  /**
   * Filter by network
   */
  byNetwork(network: string): this {
    this.where({ network: network });
    return this;
  }

  /**
   * Filter by contract type
   */
  byContractType(type: PaymasterType): this {
    this.where({ contractType: type });
    return this;
  }

  /**
   * Filter by contract address
   */
  byAddress(address: string): this {
    this.where({ address: address });
    return this;
  }

  /**
   * Filter by composite ID (network-address)
   */
  byId(network: string, address: string): this {
    this.where({ id: `${network}-${address}` });
    return this;
  }

  /**
   * Filter by deployment date (after)
   */
  deployedAfter(timestamp: string | number): this {
    this.where({ deployedTimestamp_gte: timestamp.toString() });
    return this;
  }

  /**
   * Filter by deployment date (before)
   */
  deployedBefore(timestamp: string | number): this {
    this.where({ deployedTimestamp_lte: timestamp.toString() });
    return this;
  }

  /**
   * Filter only active paymasters (positive revenue)
   */
  onlyActive(): this {
    this.where({ revenue_gt: '0' });
    return this;
  }

  /**
   * Filter only alive paymasters (not dead)
   */
  onlyAlive(): this {
    this.where({ isDead: false });
    return this;
  }

  /**
   * Include activities in the query results
   * This replaces the need to manually select activities fields
   */
  withActivities(): this {
    // Set the fields to include activities
    const fieldsArray = this.getFieldsWithActivities()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    this.select(fieldsArray as PaymasterContractFields[]);
    return this;
  }

  /**
   * ========================================
   * ORDERING METHODS
   * ========================================
   */

  /**
   * Order by revenue (highest first)
   */
  orderByRevenue(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('revenue', direction);
    return this;
  }

  /**
   * Order by total deposit
   */
  orderByTotalDeposit(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('totalDeposit', direction);
    return this;
  }

  /**
   * Order by current deposit
   */
  orderByDeposit(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('currentDeposit', direction);
    return this;
  }

  /**
   * Order by number of members (tree size)
   */
  orderByMembers(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('treeSize', direction);
    return this;
  }

  /**
   * Order by deployment date
   */
  orderByDeployment(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('deployedTimestamp', direction);
    return this;
  }

  /**
   * Order by last activity
   */
  orderByActivity(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('lastTimestamp', direction);
    return this;
  }
}
