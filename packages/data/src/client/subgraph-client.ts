import { GraphQLClient } from "graphql-request";
import type { ChainId } from "../types/subgraph.js";
import {
  getValidatedNetworkPreset,
  NETWORK_PRESETS,
  type NetworkPreset,
} from "../network/presets.js";
import { QueryBuilder } from "../query/query-builder.js";

/**
 * Configuration for the subgraph client
 * Updated to support multiple paymaster contracts
 */
export type ClientOptions = {
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
  contractType?: "GasLimited" | "OneTimeUse";
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
  private requestMap: Map<string, Promise<any>> = new Map();
  private readonly maxPendingRequests = 100;

  constructor(chainId: ChainId, options: ClientOptions = {}) {
    const preset = getValidatedNetworkPreset(chainId);
    this.client = new GraphQLClient(
      options.subgraphUrl || preset.defaultSubgraphUrl,
    );
    this.chainId = chainId;
  }

  /**
   * Generate a unique key for a query/variables combination
   *
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @returns Unique key for the request
   */
  private generateRequestKey(
    query: string,
    variables: Record<string, any>,
  ): string {
    // Create a consistent key from query and variables
    const normalizedQuery = query.replace(/\s+/g, " ").trim();
    const sortedVariables = Object.keys(variables)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = variables[key];
          return sorted;
        },
        {} as Record<string, any>,
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
      const keysToDelete = Array.from(this.requestMap.keys()).slice(
        0,
        this.maxPendingRequests / 2,
      );
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
    } = {},
  ): SubgraphClient {
    return new SubgraphClient(chainId, options);
  }

  /**
   * Get all supported networks
   *
   * @returns Array of all supported network presets
   *
   * @example
   * ```typescript
   * const networks = SubgraphClient.getSupportedNetworks();
   * console.log(networks.map(n => n.network.chainName)); // ["Base Sepolia", ...]
   * ```
   */
  static getSupportedNetworks(): NetworkPreset[] {
    return Object.values(NETWORK_PRESETS);
  }
  /**
   * Get supported network preset
   *
   * @returns Supported network preset
   *
   * @example
   * ```typescript
   * const networkPreset = SubgraphClient.getNetworkPreset(84532);
   * console.log(networkPreset.chainName); // "Base Sepolia"
   * ```
   */
  static getNetworkPreset(chainId: ChainId): NetworkPreset {
    const preset = getValidatedNetworkPreset(chainId);
    return preset;
  }

  /**
   * Check if a chain ID is supported
   *
   * @param chainId - The chain ID to check
   * @returns True if supported, false otherwise
   *
   * @example
   * ```typescript
   * if (SubgraphClient.isNetworkSupported(84532)) {
   *   const client = SubgraphClient.createForNetwork(84532);
   * }
   * ```
   */
  static isNetworkSupported(chainId: number): boolean {
    return chainId in NETWORK_PRESETS;
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
  async executeQuery<T = any>(
    query: string,
    variables: Record<string, any> = {},
  ): Promise<T> {
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

        // Enhanced error handling with context
        console.error("GraphQL query failed:", {
          error,
          query: query.substring(0, 200) + "...", // Log first 200 chars
          variables,
          chainId: this.chainId,
        });

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
  async executeQueries<T = any>(
    queries: Array<{ query: string; variables?: Record<string, any> }>,
  ): Promise<T[]> {
    const promises = queries.map(({ query, variables = {} }) =>
      this.executeQuery<T>(query, variables),
    );
    return Promise.all(promises);
  }

  /**
   * Test connection to the subgraph
   *
   * @returns Promise resolving to true if connection is successful
   *
   * @example
   * ```typescript
   * const isConnected = await client.testConnection();
   * if (isConnected) {
   *   console.log("Subgraph is accessible");
   * }
   * ```
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.executeQuery(`
        query TestConnection {
          _meta {
            block {
              number
            }
          }
        }
      `);
      return true;
    } catch (error) {
      console.error("Subgraph connection test failed:", error);
      return false;
    }
  }

  /**
   * Get subgraph metadata
   *
   * @returns Promise resolving to subgraph metadata
   *
   * @example
   * ```typescript
   * const metadata = await client.getSubgraphMetadata();
   * console.log("Latest block:", metadata.block.number);
   * ```
   */
  async getSubgraphMetadata(): Promise<{
    block: {
      number: number;
      hash: string;
    };
    deployment: string;
  }> {
    const response = await this.executeQuery<{
      _meta: {
        block: {
          number: number;
          hash: string;
        };
        deployment: string;
      };
    }>(`
      query GetSubgraphMetadata {
        _meta {
          block {
            number
            hash
          }
          deployment
        }
      }
    `);
    return response._meta;
  }

  /**
   * Get health status of the subgraph
   *
   * @returns Promise resolving to health status information
   *
   * @example
   * ```typescript
   * const health = await client.getHealthStatus();
   * console.log("Sync status:", health.synced);
   * ```
   */
  async getHealthStatus(): Promise<{
    synced: boolean;
    latestBlock: number;
    chainHeadBlock: number;
    health: string;
  }> {
    try {
      const metadata = await this.getSubgraphMetadata();
      const isConnected = await this.testConnection();

      return {
        synced: isConnected,
        latestBlock: metadata.block.number,
        chainHeadBlock: metadata.block.number, // Approximation
        health: isConnected ? "healthy" : "unhealthy",
      };
    } catch (error) {
      return {
        synced: false,
        latestBlock: 0,
        chainHeadBlock: 0,
        health: "unhealthy",
      };
    }
  }

  /**
   * Create a new client for different network
   *
   * @param chainId - Target chain ID
   * @param options - Optional configuration overrides
   * @returns New SubgraphClient instance for the target network
   *
   * @example
   * ```typescript
   * const newClient = client.switchNetwork(8453); // Switch to Base Mainnet
   * ```
   */
  switchNetwork(
    chainId: ChainId,
    options: {
      subgraphUrl?: string;
      timeout?: number;
    } = {},
  ): SubgraphClient {
    return SubgraphClient.createForNetwork(chainId, options);
  }
}
