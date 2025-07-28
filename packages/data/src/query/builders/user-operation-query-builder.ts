/**
 * Query builder for UserOperation entities
 * For detailed user operation tracking and analytics
 */

import type { SubgraphClient } from '../../client/subgraph-client.js';
import type { UserOperation, SerializedUserOperation } from '../../types/subgraph.js';
import { BaseQueryBuilder } from './base-query-builder.js';
import { UserOperationFields, UserOperationWhereInput, UserOperationOrderBy } from '../types.js';
import { serializeUserOperation } from '../../transformers/index.js';
import { PaymasterType } from '@prepaid-gas/constants';

/**
 * Query builder for UserOperation entities
 *
 * Provides a fluent interface for building complex user operation queries
 * with support for paymaster filtering, gas analysis, and nullifier tracking.
 */
export class UserOperationQueryBuilder extends BaseQueryBuilder<
  UserOperation,
  SerializedUserOperation,
  UserOperationFields,
  UserOperationWhereInput,
  UserOperationOrderBy
> {
  constructor(private subgraphClient: SubgraphClient) {
    super(subgraphClient, 'userOperations', 'timestamp', 'desc');
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

    const queryName = `GetUserOperations`;

    return `
      query ${queryName}(${variables}) {
        userOperations(${args}) {
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

  protected getSerializer(): (entity: UserOperation) => SerializedUserOperation {
    return serializeUserOperation;
  }

  private getVariableDeclarations(): string {
    const declarations = ['$first: Int!', '$skip: Int!'];

    if (this.config.where) {
      this.addVariableDeclarations(this.config.where, declarations);
    }

    return declarations.join(', ');
  }

  private addVariableDeclarations(where: Partial<UserOperationWhereInput>, declarations: string[]): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
          declarations.push('$id: ID');
          break;
        case 'hash':
          declarations.push('$hash: String');
          break;
        case 'network':
          declarations.push('$network: String');
          break;
        case 'paymaster':
          declarations.push('$paymaster: String');
          break;
        case 'sender':
          declarations.push('$sender: String');
          break;
        case 'nullifier':
          declarations.push('$nullifier: String');
          break;
        case 'actualGasCost_gte':
        case 'actualGasCost_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'block_gte':
        case 'block_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'timestamp_gte':
        case 'timestamp_lte':
          declarations.push(`$${key}: String`);
          break;
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            if ('address' in value) {
              declarations.push('$paymasterAddress: String');
            }
            if ('contractType' in value) {
              declarations.push('$paymasterContractType: String');
            }
            if ('network' in value) {
              declarations.push('$paymasterNetwork: String');
            }
          }
          break;
      }
    }
  }

  private addWhereVariables(where: Partial<UserOperationWhereInput>, variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
        case 'hash':
        case 'network':
        case 'paymaster':
        case 'sender':
        case 'nullifier':
        case 'actualGasCost_gte':
        case 'actualGasCost_lte':
        case 'block_gte':
        case 'block_lte':
        case 'timestamp_gte':
        case 'timestamp_lte':
          variables[key] = value;
          break;
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            if ('address' in value) {
              variables.paymasterAddress = value.address;
            }
            if ('contractType' in value) {
              variables.paymasterContractType = value.contractType;
            }
            if ('network' in value) {
              variables.paymasterNetwork = value.network;
            }
          }
          break;
      }
    }
  }

  private buildWhereConditions(where: Partial<UserOperationWhereInput>): string[] {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'paymaster_':
          if (typeof value === 'object' && value) {
            const nestedConditions: string[] = [];
            if ('address' in value) {
              nestedConditions.push('address: $paymasterAddress');
            }
            if ('contractType' in value) {
              nestedConditions.push('contractType: $paymasterContractType');
            }
            if ('network' in value) {
              nestedConditions.push('network: $paymasterNetwork');
            }
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
   * Override default fields for UserOperation entity.
   */
  protected getDefaultFields(): string {
    return `
    id
    hash
    network
    chainId
    sender
    actualGasCost
    nullifier
    block
    transaction
    timestamp
    
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
   * Filter by network
   */
  byNetwork(network: string): this {
    this.where({ network: network });
    return this;
  }

  /**
   * Filter by user operation hash
   */
  byHash(hash: string): this {
    this.where({ hash: hash });
    return this;
  }

  /**
   * Filter by composite ID (network-contractAddress-userOpHash)
   */
  byId(id: string): this {
    this.where({ id: id });
    return this;
  }

  /**
   * Filter by paymaster ID
   */
  byPaymaster(paymasterId: string): this {
    this.where({ paymaster: paymasterId });
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
   * Filter by sender address
   */
  bySender(sender: string): this {
    this.where({ sender: sender });
    return this;
  }

  /**
   * Filter by nullifier
   */
  byNullifier(nullifier: string): this {
    this.where({ nullifier: nullifier });
    return this;
  }

  /**
   * Filter by minimum gas cost
   */
  withMinGasCost(minGasCost: string): this {
    this.where({ actualGasCost_gte: minGasCost });
    return this;
  }

  /**
   * Filter by maximum gas cost
   */
  withMaxGasCost(maxGasCost: string): this {
    this.where({ actualGasCost_lte: maxGasCost });
    return this;
  }

  /**
   * Filter user operations after timestamp
   */
  afterTimestamp(timestamp: string | number): this {
    this.where({ timestamp_gte: timestamp.toString() });
    return this;
  }

  /**
   * Filter user operations before timestamp
   */
  beforeTimestamp(timestamp: string | number): this {
    this.where({ timestamp_lte: timestamp.toString() });
    return this;
  }

  /**
   * Filter user operations after block
   */
  afterBlock(block: string | number): this {
    this.where({ block_gte: block.toString() });
    return this;
  }

  /**
   * Filter user operations before block
   */
  beforeBlock(block: string | number): this {
    this.where({ block_lte: block.toString() });
    return this;
  }

  /**
   * Filter user operations within a time range
   */
  betweenTimestamps(startTimestamp: string | number, endTimestamp: string | number): this {
    this.afterTimestamp(startTimestamp);
    this.beforeTimestamp(endTimestamp);
    return this;
  }

  /**
   * Filter user operations within a block range
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
   * Order by gas cost (highest first by default)
   */
  orderByGasCost(direction: 'asc' | 'desc' = 'desc'): this {
    this.orderBy('actualGasCost', direction);
    return this;
  }

  /**
   * Order by sender address
   */
  orderBySender(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy('sender', direction);
    return this;
  }

  /**
   * Order by nullifier
   */
  orderByNullifier(direction: 'asc' | 'desc' = 'asc'): this {
    this.orderBy('nullifier', direction);
    return this;
  }

  /**
   * ========================================
   * ANALYTICS METHODS
   * ========================================
   */

  /**
   * Get gas statistics for user operations
   */
  async getGasStatistics(): Promise<{
    totalOperations: number;
    totalGasCost: string;
    averageGasCost: string;
    minGasCost: string;
    maxGasCost: string;
    medianGasCost: string;
  }> {
    const operations = await this.execute();

    const totalOperations = operations.length;
    const totalGasCost = operations.reduce((sum, op) => sum + BigInt(op.actualGasCost), 0n);

    const averageGasCost = totalOperations > 0 ? totalGasCost / BigInt(totalOperations) : 0n;

    // Find min and max gas costs
    const gasCosts = operations.map((op) => BigInt(op.actualGasCost));
    const minGasCost = gasCosts.length > 0 ? gasCosts.reduce((min, cost) => (cost < min ? cost : min)) : 0n;
    const maxGasCost = gasCosts.length > 0 ? gasCosts.reduce((max, cost) => (cost > max ? cost : max)) : 0n;

    // Calculate median gas cost
    const sortedGasCosts = gasCosts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const medianGasCost = sortedGasCosts.length > 0 ? sortedGasCosts[Math.floor(sortedGasCosts.length / 2)] : 0n;

    return {
      totalOperations,
      totalGasCost: totalGasCost.toString(),
      averageGasCost: averageGasCost.toString(),
      minGasCost: minGasCost.toString(),
      maxGasCost: maxGasCost.toString(),
      medianGasCost: medianGasCost?.toString() ?? '0',
    };
  }

  /**
   * Get user operation timeline
   */
  async getOperationTimeline(days: number = 30): Promise<
    Array<{
      date: string;
      operations: number;
      totalGasCost: string;
      averageGasCost: string;
      uniqueSenders: number;
    }>
  > {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - days * 24 * 60 * 60;

    const operations = await this.afterTimestamp(startTime).orderByTimestamp('asc').execute();

    // Group by date
    const timeline: Record<
      string,
      {
        operations: number;
        totalGasCost: bigint;
        senders: Set<string>;
      }
    > = {};

    for (const op of operations) {
      const date = new Date(Number(op.timestamp) * 1000).toISOString().split('T')[0]!;

      if (!timeline[date]) {
        timeline[date] = {
          operations: 0,
          totalGasCost: 0n,
          senders: new Set(),
        };
      }

      timeline[date].operations += 1;
      timeline[date].totalGasCost += BigInt(op.actualGasCost);
      timeline[date].senders.add(op.sender);
    }

    return Object.entries(timeline).map(([date, stats]) => ({
      date,
      operations: stats.operations,
      totalGasCost: stats.totalGasCost.toString(),
      averageGasCost: stats.operations > 0 ? (stats.totalGasCost / BigInt(stats.operations)).toString() : '0',
      uniqueSenders: stats.senders.size,
    }));
  }

  /**
   * Get sender analysis
   */
  async getSenderAnalysis(): Promise<
    Array<{
      sender: string;
      operationCount: number;
      totalGasCost: string;
      averageGasCost: string;
      firstOperation: string;
      lastOperation: string;
    }>
  > {
    const operations = await this.execute();

    // Group by sender
    const senderStats: Record<
      string,
      {
        operationCount: number;
        totalGasCost: bigint;
        timestamps: number[];
      }
    > = {};

    for (const op of operations) {
      const currentSenderStats = senderStats[op.sender] || {
        operationCount: 0,
        totalGasCost: 0n,
        timestamps: [],
      };

      currentSenderStats.operationCount += 1;
      currentSenderStats.totalGasCost += BigInt(op.actualGasCost);

      const timestamp = Number(op.timestamp);
      if (!isNaN(timestamp)) {
        currentSenderStats.timestamps.push(timestamp);
      }

      senderStats[op.sender] = currentSenderStats;
    }

    return Object.entries(senderStats)
      .map(([sender, stats]) => {
        const sortedTimestamps = (stats.timestamps ?? []).sort((a, b) => a - b);
        const averageGasCost = stats.operationCount > 0 ? stats.totalGasCost / BigInt(stats.operationCount) : 0n;

        return {
          sender,
          operationCount: stats.operationCount,
          totalGasCost: stats.totalGasCost.toString(),
          averageGasCost: averageGasCost.toString(),
          firstOperation: sortedTimestamps.length > 0 ? (sortedTimestamps[0]?.toString() ?? '0') : '0',
          lastOperation:
            sortedTimestamps.length > 0 ? (sortedTimestamps[sortedTimestamps.length - 1]?.toString() ?? '0') : '0',
        };
      })
      .sort((a, b) => b.operationCount - a.operationCount);
  }
}

/**
 * ========================================
 * CONVENIENCE FUNCTIONS
 * ========================================
 */

/**
 * Get user operation by hash
 */
export async function getUserOperationByHash(
  client: SubgraphClient,
  hash: string,
  network: string
): Promise<UserOperation | null> {
  return new UserOperationQueryBuilder(client).byNetwork(network).byHash(hash).first();
}

/**
 * Get recent user operations
 */
export async function getRecentUserOperations(
  client: SubgraphClient,
  network: string,
  limit: number = 10
): Promise<UserOperation[]> {
  return new UserOperationQueryBuilder(client).byNetwork(network).orderByTimestamp().limit(limit).execute();
}

/**
 * Get user operations by sender
 */
export async function getUserOperationsBySender(
  client: SubgraphClient,
  sender: string,
  network: string
): Promise<UserOperation[]> {
  return new UserOperationQueryBuilder(client).byNetwork(network).bySender(sender).orderByTimestamp().execute();
}

/**
 * Get user operations by paymaster
 */
export async function getUserOperationsByPaymaster(
  client: SubgraphClient,
  paymasterAddress: string,
  network: string
): Promise<UserOperation[]> {
  return new UserOperationQueryBuilder(client)
    .byNetwork(network)
    .byPaymasterAddress(paymasterAddress)
    .orderByTimestamp()
    .execute();
}

/**
 * Get expensive user operations (high gas cost)
 */
export async function getExpensiveUserOperations(
  client: SubgraphClient,
  network: string,
  minGasCost: string,
  limit: number = 10
): Promise<UserOperation[]> {
  return new UserOperationQueryBuilder(client)
    .byNetwork(network)
    .withMinGasCost(minGasCost)
    .orderByGasCost()
    .limit(limit)
    .execute();
}
