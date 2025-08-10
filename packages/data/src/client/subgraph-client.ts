import { GraphQLClient } from 'graphql-request';
import { getNetworkPreset, type ChainId } from '@prepaid-gas/constants';
import { QueryBuilder } from '../query/query-builder.js';

/**
 * Configuration for the subgraph client
 * Updated to support multiple paymaster contracts
 */
export type SubClientOptions = {
  subgraphUrl?: string;
  timeout?: number;
};

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  /** Number of items to fetch (default: 100) */
  first?: number;
  /** Number of items to skip (default: 0) */
  skip?: number;
}

/**
 * Options for pool queries with field selection
 */
export interface PoolQueryOptions extends PaginationOptions {
  /** Specific fields to fetch */
  fields?: string[];
}

/**
 * Options for paymaster queries with field selection
 */
export interface PaymasterQueryOptions extends PaginationOptions {
  /** Specific fields to fetch */
  fields?: string[];
  /** Filter by contract type */
  contractType?: 'GasLimited' | 'OneTimeUse';
}

/**
 * Options for transaction queries with field selection
 */
export interface TransactionQueryOptions extends PaginationOptions {
  /** Specific fields to fetch */
  fields?: string[];
  /** Filter by paymaster address */
  paymasterAddress?: string;
  /** Filter by pool ID */
  poolId?: string;
  /** Filter by sender address */
  senderAddress?: string;
}

/**
 * Clean, focused subgraph client for data access
 * Handles GraphQL communication and basic data transformation
 * Updated for new PaymasterContract-based subgraph structure
 */
export class SubgraphClient {
  private client: GraphQLClient;
  private chainId: ChainId;
  private options: SubClientOptions;
  private requestMap: Map<string, Promise<any>> = new Map();
  private readonly maxPendingRequests = 100;

  constructor(chainId: ChainId, options: SubClientOptions = {}) {
    const preset = getNetworkPreset(chainId);
    this.chainId = chainId;
    this.options = options;
    // Use provided subgraph URL or fall back to preset default
    const finalSubgraphUrl = options.subgraphUrl || preset?.defaultSubgraphUrl;

    if (!finalSubgraphUrl) {
      throw new Error(
        `No subgraph URL available for network(chainId: ${chainId}). Please provide one in options.subgraphUrl`
      );
    }

    this.client = new GraphQLClient(finalSubgraphUrl);
  }

  /**
   * Generate a unique key for a query/variables combination
   *
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @returns Unique key for the request
   */
  private generateRequestKey(query: string, variables: Record<string, any>): string {
    // Create a consistent key from query and variables
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const sortedVariables = Object.keys(variables)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = variables[key];
          return sorted;
        },
        {} as Record<string, any>
      );

    return `${normalizedQuery}|${JSON.stringify(sortedVariables)}`;
  }

  /**
   * Clean up completed request from the map
   *
   * @param requestKey - Key of the request to clean up
   */
  private cleanupRequest(requestKey: string): void {
    this.requestMap.delete(requestKey);
  }

  /**
   * Clean up old requests if map gets too large
   */
  private cleanupOldRequests(): void {
    if (this.requestMap.size > this.maxPendingRequests) {
      // Clear half of the oldest requests
      const keysToDelete = Array.from(this.requestMap.keys()).slice(0, this.maxPendingRequests / 2);
      keysToDelete.forEach((key) => this.requestMap.delete(key));
    }
  }

  /**
   * Create SubgraphClient for a specific network using presets
   *
   * @param chainId - The chain ID to create client for
   * @param options - Optional configuration overrides
   * @returns Configured SubgraphClient instance
   *
   * @example
   * ```typescript
   * // Create for Base Sepolia using preset
   * const client = SubgraphClient.createForNetwork(84532);
   *
   * // Create with custom subgraph URL override
   * const client = SubgraphClient.createForNetwork(84532, {
   *   subgraphUrl: "https://custom-subgraph.com",
   *   timeout: 60000
   * });
   * ```
   */
  static createForNetwork(
    chainId: ChainId,
    options: {
      /** Custom subgraph URL (optional, uses preset default if not provided) */
      subgraphUrl?: string;
      /** Request timeout in milliseconds */
      timeout?: number;
    } = {}
  ): SubgraphClient {
    return new SubgraphClient(chainId, options);
  }

  /**
   * ✨ Create a fluent query builder instance
   *
   * This is the main entry point for the new query builder API.
   * Provides a fluent interface for building complex queries with type safety.
   *
   * @returns QueryBuilder for fluent query building
   *
   * @example
   * ```typescript
   * // Simple paymaster query
   * const paymasters = await client
   *   .query()
   *   .paymasters()
   *   .byType("GasLimited")
   *   .withMinRevenue("1000000000000000000")
   *   .orderByRevenue()
   *   .limit(10)
   *   .execute();
   *
   * // Complex pool query with members
   * const pools = await client
   *   .query()
   *   .pools()
   *   .byPaymaster("0x456...")
   *   .withMinMembers(10)
   *   .withMembers(50)
   *   .orderByPopularity()
   *   .limit(20)
   *   .execute();
   *
   * // Analytics query
   * const analytics = await client
   *   .query()
   *   .dailyGlobalStats()
   *   .forDateRange("2024-01-01", "2024-01-31")
   *   .withMinNewPools(2)
   *   .orderByNewest()
   *   .execute();
   * ```
   */
  query(): QueryBuilder {
    return new QueryBuilder(this);
  }

  /**
   * Execute a raw GraphQL query with request deduplication
   *
   * This method provides a generic interface for executing any GraphQL query,
   * with built-in deduplication to prevent duplicate requests for identical queries.
   *
   * @template T - The expected response type
   * @param query - GraphQL query string
   * @param variables - Query variables object
   * @returns Promise resolving to the query response data
   *
   * @example
   * ```typescript
   * const response = await client.executeQuery<{ pools: Pool[] }>(
   *   'query GetPools($first: Int!) { pools(first: $first) { id poolId } }',
   *   { first: 10 }
   * );
   * console.log(response.pools);
   * ```
   */
  async executeQuery<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    // Generate unique key for this request
    const requestKey = this.generateRequestKey(query, variables);

    // Check if identical request is already in progress
    const existingRequest = this.requestMap.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Clean up old requests if needed
    this.cleanupOldRequests();

    // Create new request promise
    const requestPromise = this.client
      .request<T>(query, variables)
      .then((response) => {
        // Clean up this request from the map
        this.cleanupRequest(requestKey);
        return response;
      })
      .catch((error) => {
        // Clean up this request from the map even on error
        this.cleanupRequest(requestKey);

        throw error;
      });

    // Store the promise in the map
    this.requestMap.set(requestKey, requestPromise);

    return requestPromise;
  }

  /**
   * Execute multiple queries in parallel with deduplication
   *
   * @param queries - Array of query objects with query string and variables
   * @returns Promise resolving to array of query responses
   *
   * @example
   * ```typescript
   * const results = await client.executeQueries([
   *   { query: 'query GetPools { pools { id } }', variables: {} },
   *   { query: 'query GetPaymasters { paymasterContracts { id } }', variables: {} }
   * ]);
   * ```
   */
  async executeQueries<T = any>(queries: Array<{ query: string; variables?: Record<string, any> }>): Promise<T[]> {
    const promises = queries.map(({ query, variables = {} }) => this.executeQuery<T>(query, variables));
    return Promise.all(promises);
  }
}
