/**
 * Query builder for Activity entities
 * For the unified timeline of all paymaster events
 * Supports type-safe filtering by activity type
 */

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type {
  Activity,
  ActivityType,
  SerializedActivity,
  DepositActivity,
  RevenueActivity,
  SerializedDepositActivity,
  SerializedRevenueActivity,
  ActivityTypeMap,
  SerializedActivityTypeMap,
} from '../../types/subgraph.js';
import { BaseQueryBuilder } from './base-query-builder.js';
import { ActivityFields, ActivityWhereInput, ActivityOrderBy } from '../types.js';
import { serializeActivity } from '../../transformers/index.js';
import { PaymasterType } from '@prepaid-gas/constants';

/**
 * Base Activity Query Builder
 * Generic type T allows for typed results based on activity type
 */
export class ActivityQueryBuilder<
  T extends Activity = Activity,
  S extends SerializedActivity = SerializedActivity,
> extends BaseQueryBuilder<T, S, ActivityFields, ActivityWhereInput, ActivityOrderBy> {
  constructor(private subgraphClient: SubgraphClient) {
    super(subgraphClient, 'activities', 'timestamp', 'desc');
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

    const queryName = `GetActivities`;

    return `
      query ${queryName}(${variables}) {
        activities(${args}) {
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

  protected getSerializer(): (entity: T) => S {
    // The generic serializeActivity function handles all activity types correctly
    // TypeScript casting is safe here since all our activity types extend the base Activity
    return serializeActivity as unknown as (entity: T) => S;
  }

  private getVariableDeclarations(): string {
    const declarations = ['$first: Int!', '$skip: Int!'];

    if (this.config.where) {
      this.addVariableDeclarations(this.config.where, declarations);
    }

    return declarations.join(', ');
  }

  private addVariableDeclarations(where: Partial<ActivityWhereInput>, declarations: string[]): void {
    for (const [key] of Object.entries(where)) {
      switch (key) {
        case 'id':
          declarations.push('$id: ID');
          break;
        case 'type':
          declarations.push('$type: String');
          break;
        case 'network':
          declarations.push('$network: String');
          break;
        case 'paymaster':
          declarations.push('$paymaster: String');
          break;
        case 'block_gte':
        case 'block_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'timestamp_gte':
        case 'timestamp_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'depositor':
          declarations.push('$depositor: String');
          break;
        case 'commitment':
          declarations.push('$commitment: String');
          break;
        case 'memberIndex_gte':
        case 'memberIndex_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'sender':
          declarations.push('$sender: String');
          break;
        case 'userOpHash':
          declarations.push('$userOpHash: String');
          break;
        case 'actualGasCost_gte':
        case 'actualGasCost_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'withdrawAddress':
          declarations.push('$withdrawAddress: String');
          break;
        case 'amount_gte':
        case 'amount_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'paymaster_':
          // Nested paymaster filtering
          declarations.push('$paymasterAddress: String');
          declarations.push('$paymasterContractType: String');
          declarations.push('$paymasterNetwork: String');
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<ActivityWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
        case 'type':
        case 'network':
        case 'paymaster':
        case 'block_gte':
        case 'block_lte':
        case 'timestamp_gte':
        case 'timestamp_lte':
        case 'depositor':
        case 'commitment':
        case 'memberIndex_gte':
        case 'memberIndex_lte':
        case 'sender':
        case 'userOpHash':
        case 'actualGasCost_gte':
        case 'actualGasCost_lte':
        case 'withdrawAddress':
        case 'amount_gte':
        case 'amount_lte':
          variables[key] = value;
          break;
        case 'paymaster_':
          // Handle nested paymaster filtering
          if (value && typeof value === 'object') {
            if (value.address) variables.paymasterAddress = value.address;
            if (value.contractType) variables.paymasterContractType = value.contractType;
            if (value.network) variables.paymasterNetwork = value.network;
          }
          break;
      }
    }
  }

  private buildWhereConditions(where: Partial<ActivityWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'paymaster_':
          // Handle nested paymaster filtering
          if (value && typeof value === 'object') {
            const nestedConditions: string[] = [];
            if (value.address) nestedConditions.push('address: $paymasterAddress');
            if (value.contractType) nestedConditions.push('contractType: $paymasterContractType');
            if (value.network) nestedConditions.push('network: $paymasterNetwork');
            if (nestedConditions.length > 0) {
              conditions.push(`paymaster_: { ${nestedConditions.join(', ')} }`);
            }
          }
          break;
        default:
          conditions.push(`${key}: $${key}`);
          break;
      }
    }

    return conditions;
  }

  /**
   * Override default fields for Activity entity.
   */
  protected getDefaultFields(): string {
    return `
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
    
    # Paymaster relation
    paymaster {
      id
      address
      contractType
      network
    }
  `;
  }

  /**
   * ========================================
   * FILTERING METHODS
   * ========================================
   */

  /**
   * Filter by activity type (generic version)
   */
  byType(type: ActivityType): this {
    this.where({ type: type });
    return this;
  }

  /**
   * ========================================
   * TYPED FILTERING METHODS
   * ========================================
   */

  /**
   * Filter by activity type with type narrowing
   * Returns a typed query builder for the specific activity type
   */
  byTyped<K extends keyof ActivityTypeMap>(
    type: K
  ): ActivityQueryBuilder<ActivityTypeMap[K], SerializedActivityTypeMap[K]> {
    this.where({ type: type });
    return this as unknown as ActivityQueryBuilder<ActivityTypeMap[K], SerializedActivityTypeMap[K]>;
  }

  /**
   * Filter by network
   */
  byNetwork(network: string): this {
    this.where({ network: network });
    return this;
  }

  /**
   * Filter by paymaster address
   */
  byPaymasterAddress(address: string): this {
    this.where({ paymaster_: { address: address } });
    return this;
  }

  /**
   * Filter by paymaster contract type
   */
  byPaymasterType(contractType: PaymasterType): this {
    this.where({ paymaster_: { contractType: contractType } });
    return this;
  }

  /**
   * Filter activities after timestamp
   */
  afterTimestamp(timestamp: string | number): this {
    this.where({ timestamp_gte: timestamp.toString() });
    return this;
  }

  /**
   * Filter activities before timestamp
   */
  beforeTimestamp(timestamp: string | number): this {
    this.where({ timestamp_lte: timestamp.toString() });
    return this;
  }

  /**
   * Filter activities after block
   */
  afterBlock(block: string | number): this {
    this.where({ block_gte: block.toString() });
    return this;
  }

  /**
   * Filter activities before block
   */
  beforeBlock(block: string | number): this {
    this.where({ block_lte: block.toString() });
    return this;
  }

  /**
   * ========================================
   * DEPOSIT-SPECIFIC FILTERING
   * ========================================
   */

  /**
   * Filter deposit activities by depositor
   */
  byDepositor(depositor: string): this {
    this.where({ depositor: depositor });
    return this;
  }

  /**
   * Filter deposit activities by commitment
   */
  byCommitment(commitment: string): this {
    this.where({ commitment: commitment });
    return this;
  }

  /**
   * Filter deposit activities by minimum member index
   */
  withMinMemberIndex(minIndex: string): this {
    this.where({ memberIndex_gte: minIndex });
    return this;
  }

  /**
   * Filter deposit activities by maximum member index
   */
  withMaxMemberIndex(maxIndex: string): this {
    this.where({ memberIndex_lte: maxIndex });
    return this;
  }

  /**
   * ========================================
   * USER_OP-SPECIFIC FILTERING
   * ========================================
   */

  /**
   * Filter user operation activities by sender
   */
  bySender(sender: string): this {
    this.where({ sender: sender });
    return this;
  }

  /**
   * Filter user operation activities by user op hash
   */
  byUserOpHash(userOpHash: string): this {
    this.where({ userOpHash: userOpHash });
    return this;
  }

  /**
   * Filter user operation activities by minimum gas cost
   */
  withMinGasCost(minGasCost: string): this {
    this.where({ actualGasCost_gte: minGasCost });
    return this;
  }

  /**
   * Filter user operation activities by maximum gas cost
   */
  withMaxGasCost(maxGasCost: string): this {
    this.where({ actualGasCost_lte: maxGasCost });
    return this;
  }

  /**
   * ========================================
   * REVENUE-SPECIFIC FILTERING
   * ========================================
   */

  /**
   * Filter revenue withdrawal activities by withdraw address
   */
  byWithdrawAddress(withdrawAddress: string): this {
    this.where({ withdrawAddress: withdrawAddress });
    return this;
  }

  /**
   * Filter revenue withdrawal activities by minimum amount
   */
  withMinAmount(minAmount: string): this {
    this.where({ amount_gte: minAmount });
    return this;
  }

  /**
   * Filter revenue withdrawal activities by maximum amount
   */
  withMaxAmount(maxAmount: string): this {
    this.where({ amount_lte: maxAmount });
    return this;
  }

  /**
   * ========================================
   * TYPED CONVENIENCE FILTERS
   * ========================================
   */

  /**
   * Filter only deposit activities (returns typed DepositActivity[])
   */
  onlyDeposits(): ActivityQueryBuilder<DepositActivity, SerializedDepositActivity> {
    return this.byTyped('DEPOSIT');
  }

  /**
   * Filter only revenue withdrawal activities (returns typed RevenueActivity[])
   */
  onlyRevenueWithdrawals(): ActivityQueryBuilder<RevenueActivity, SerializedRevenueActivity> {
    return this.byTyped('REVENUE_WITHDRAWN');
  }

  /**
   * Filter only user operation activities
   * Note: For detailed user operations, use userOperations() query builder instead
   */
  onlyUserOps(): this {
    return this.byType('USER_OP_SPONSORED');
  }

  /**
   * Filter activities within a time range
   */
  betweenTimestamps(startTimestamp: string | number, endTimestamp: string | number): this {
    this.afterTimestamp(startTimestamp);
    this.beforeTimestamp(endTimestamp);
    return this;
  }

  /**
   * Filter activities within a block range
   */
  betweenBlocks(startBlock: string | number, endBlock: string | number): this {
    this.afterBlock(startBlock);
    this.beforeBlock(endBlock);
    return this;
  }

  /**
   * ========================================
   * ORDERING METHODS
   * ========================================
   */

  /**
   * Order by timestamp (most recent first by default)
   */
  orderByTimestamp(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('timestamp', direction);
    return this;
  }

  /**
   * Order by block number
   */
  orderByBlock(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('block', direction);
    return this;
  }

  /**
   * Order by activity type
   */
  orderByType(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy('type', direction);
    return this;
  }

  /**
   * Order by gas cost (for USER_OP_SPONSORED activities)
   */
  orderByGasCost(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('actualGasCost', direction);
    return this;
  }

  /**
   * Order by amount (for REVENUE_WITHDRAWN activities)
   */
  orderByAmount(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('amount', direction);
    return this;
  }
}

/**
 * ========================================
 * TYPED QUERY BUILDER FACTORIES
 * ========================================
 */

/**
 * Create a typed deposit activity query builder
 */
export function createDepositActivityQueryBuilder(
  client: SubgraphClient
): ActivityQueryBuilder<DepositActivity, SerializedDepositActivity> {
  return new ActivityQueryBuilder<DepositActivity, SerializedDepositActivity>(client).onlyDeposits();
}

/**
 * Create a typed revenue activity query builder
 */
export function createRevenueActivityQueryBuilder(
  client: SubgraphClient
): ActivityQueryBuilder<RevenueActivity, SerializedRevenueActivity> {
  return new ActivityQueryBuilder<RevenueActivity, SerializedRevenueActivity>(client).onlyRevenueWithdrawals();
}
