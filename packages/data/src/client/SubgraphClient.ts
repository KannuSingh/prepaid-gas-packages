/**
 * Core subgraph client for GraphQL queries
 * Minimal base client that specific query builders can use
 */

export interface QueryResult<T> {
  data: T;
  error?: string;
}

export interface SubgraphClientOptions {
  url?: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * Base subgraph client - handles the HTTP GraphQL communication
 */
export class SubgraphClient {
  private readonly url: string;
  private readonly options: SubgraphClientOptions;

  constructor(url: string, options: SubgraphClientOptions = {}) {
    this.url = url;
    this.options = options;
  }

  /**
   * Execute a GraphQL query against the subgraph
   */
  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<QueryResult<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout || 10000);

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { data?: T; errors?: Array<{ message: string }> };

      if (result.errors) {
        throw new Error(result.errors.map((e: { message: string }) => e.message).join(', '));
      }

      return {
        data: result.data as T,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.options.debug) {
        console.error('Subgraph query error:', errorMessage);
      }

      return {
        data: {} as T,
        error: errorMessage,
      };
    }
  }

  /**
   * Factory method to create client for specific network
   */
  static createForNetwork(chainId: number, options: SubgraphClientOptions = {}): SubgraphClient {
    const defaultUrl = SubgraphClient.getDefaultSubgraphUrl(chainId);
    return new SubgraphClient(options.url || defaultUrl, options);
  }

  /**
   * Get default subgraph URL for supported networks
   */
  private static getDefaultSubgraphUrl(chainId: number): string {
    switch (chainId) {
      case 84532: // Base Sepolia
        return process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/your-subgraph-id/prepaid-gas-paymasters/version/latest';
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }
}