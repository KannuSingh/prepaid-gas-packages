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
   * Get pools for a specific network and paymaster
   */
  async getPools(networkId: string, paymasterAddress?: string): Promise<QueryResult<unknown>> {
    const query = `
      query GetPools($networkId: String!, $paymasterAddress: String) {
        pools(
          where: { 
            networkId: $networkId
            ${paymasterAddress ? ', paymaster: $paymasterAddress' : ''}
          }
          orderBy: createdAt
          orderDirection: desc
        ) {
          id
          poolId
          joiningFee
          totalDeposits
          memberCount
          createdAt
          paymaster {
            id
            address
          }
        }
      }
    `;

    return this.query(query, { networkId, paymasterAddress });
  }

  /**
   * Get pool members by identity commitment
   */
  async getPoolMembersByIdentity(identityCommitment: string): Promise<QueryResult<unknown>> {
    const query = `
      query GetPoolMembersByIdentity($identityCommitment: String!) {
        poolMembers(
          where: { identityCommitment: $identityCommitment }
        ) {
          id
          memberIndex
          identityCommitment
          pool {
            id
            poolId
            paymaster {
              address
            }
          }
        }
      }
    `;

    return this.query(query, { identityCommitment });
  }

  /**
   * Get user operations sponsored by pools
   */
  async getUserOpsSponsored(poolId?: string, limit: number = 100): Promise<QueryResult<unknown>> {
    const query = `
      query GetUserOpsSponsored($poolId: String, $limit: Int!) {
        userOpsSponsored(
          ${poolId ? 'where: { poolId: $poolId }' : ''}
          orderBy: blockTimestamp
          orderDirection: desc
          first: $limit
        ) {
          id
          userOpHash
          sender
          actualGasCost
          nullifier
          poolId
          blockTimestamp
        }
      }
    `;

    return this.query(query, { poolId, limit });
  }
}