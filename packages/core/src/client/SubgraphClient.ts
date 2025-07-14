/**
 * Simple SubgraphClient implementation focused on actual usage patterns
 */

/**
 * Subgraph client configuration
 */
export interface SubgraphClientOptions {
  url: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * Basic query result interface
 */
export interface QueryResult<T> {
  data: T;
  error?: string;
}

/**
 * Simple subgraph client - minimal implementation for actual usage
 */
export class SubgraphClient {
  private readonly url: string;
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor(options: SubgraphClientOptions) {
    this.url = options.url;
    this.timeout = options.timeout || 30000;
    this.debug = options.debug || false;
  }

  /**
   * Creates a subgraph client for specific network
   */
  static createForNetwork(chainId: number, options: Partial<SubgraphClientOptions> = {}): SubgraphClient {
    // Default subgraph URLs for supported networks
    const defaultUrls: Record<number, string> = {
      84532: 'https://api.studio.thegraph.com/query/prepaid-gas-paymasters/base-sepolia', // Base Sepolia
      // Add other networks as needed
    };

    const url = options.url || defaultUrls[chainId];
    if (!url) {
      throw new Error(`No subgraph URL configured for chain ID ${chainId}`);
    }

    return new SubgraphClient({
      url,
      timeout: options.timeout,
      debug: options.debug,
    });
  }

  /**
   * Execute a raw GraphQL query
   */
  async query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<QueryResult<T>> {
    try {
      if (this.debug) {
        console.log('Subgraph query:', query, variables);
      }

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      return {
        data: result.data as T,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.debug) {
        console.error('Subgraph query error:', errorMessage);
      }

      return {
        data: {} as T,
        error: errorMessage,
      };
    }
  }

  /**
   * Get pool members for ZK proof generation - this is the main query needed
   * Based on actual usage in PrepaidGasPaymaster for creating Semaphore groups
   */
  async getPoolMembers(poolId: string): Promise<QueryResult<{ poolMembers: Array<{ identityCommitment: string }> }>> {
    const query = `
      query GetPoolMembers($poolId: String!) {
        poolMembers(
          where: { pool: $poolId }
          orderBy: memberIndex
        ) {
          identityCommitment
        }
      }
    `;

    return this.query(query, { poolId });
  }

  /**
   * Get pool information - used for validation and fee checking
   */
  async getPoolInfo(poolId: string): Promise<QueryResult<{ pool: { id: string; joiningFee: string; memberCount: number } | null }>> {
    const query = `
      query GetPoolInfo($poolId: String!) {
        pool(id: $poolId) {
          id
          joiningFee
          memberCount
        }
      }
    `;

    return this.query(query, { poolId });
  }
}