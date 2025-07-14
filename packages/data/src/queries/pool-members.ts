/**
 * Pool members query builder - specifically for core package usage
 * This is the main query needed by PrepaidGasPaymaster for ZK proof generation
 */

import { SubgraphClient, type QueryResult } from '../client/SubgraphClient';

export interface PoolMember {
  identityCommitment: string;
  memberIndex: string;
}

export interface PoolMembersQueryResult {
  poolMembers: PoolMember[];
}

/**
 * Pool members query builder focused on ZK proof generation needs
 */
export class PoolMembersQuery {
  private client: SubgraphClient;
  private poolId?: string;
  private limit: number = 1000;
  private orderByField: 'memberIndex' | 'identityCommitment' = 'memberIndex';

  constructor(client: SubgraphClient) {
    this.client = client;
  }

  /**
   * Filter by specific pool ID
   */
  forPool(poolId: string): this {
    if (!poolId || typeof poolId !== 'string') {
      throw new Error('Invalid pool ID provided');
    }
    this.poolId = poolId;
    return this;
  }

  /**
   * Limit number of results (default: 1000, max: 1000)
   */
  limitTo(count: number): this {
    if (count <= 0 || count > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }
    this.limit = count;
    return this;
  }

  /**
   * Order results by field
   */
  orderBy(field: 'memberIndex' | 'identityCommitment'): this {
    this.orderByField = field;
    return this;
  }

  /**
   * Execute the query
   */
  async execute(): Promise<QueryResult<PoolMembersQueryResult>> {
    if (!this.poolId) {
      return {
        data: { poolMembers: [] },
        error: 'Pool ID is required',
      };
    }

    const query = `
      query GetPoolMembers($poolId: String!, $first: Int!, $orderBy: String!) {
        poolMembers(
          where: { pool: $poolId }
          first: $first
          orderBy: $orderBy
        ) {
          identityCommitment
          memberIndex
        }
      }
    `;

    const variables = {
      poolId: this.poolId,
      first: this.limit,
      orderBy: this.orderByField,
    };

    return this.client.query<PoolMembersQueryResult>(query, variables);
  }
}

/**
 * Factory function for core package to create pool members query
 * This is the main export that core package will import
 */
export function createPoolMembersQuery(chainId: number, options?: { url?: string; timeout?: number; debug?: boolean }): PoolMembersQuery {
  const client = SubgraphClient.createForNetwork(chainId, options);
  return new PoolMembersQuery(client);
}

/**
 * Simplified function for core package - gets pool members directly
 * This matches the existing usage pattern in PrepaidGasPaymaster
 */
export async function getPoolMembers(
  poolId: string, 
  chainId: number, 
  options?: { url?: string; timeout?: number; debug?: boolean }
): Promise<QueryResult<{ poolMembers: Array<{ identityCommitment: string }> }>> {
  try {
    const query = createPoolMembersQuery(chainId, options);
    const result = await query.forPool(poolId).execute();
    
    // Transform to match existing interface
    return {
      data: {
        poolMembers: result.data.poolMembers.map(member => ({
          identityCommitment: member.identityCommitment
        }))
      },
      error: result.error
    };
  } catch (error) {
    return {
      data: { poolMembers: [] },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}