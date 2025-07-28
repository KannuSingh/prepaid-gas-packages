import {
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType,
  GetPaymasterStubDataReturnType,
} from 'viem/account-abstraction';

import { SubgraphClient } from '@prepaid-gas/data';
import { ChainId, getNetworkPreset } from '@prepaid-gas/constants';
import { parsePaymasterContext } from '../utils';
import { GetPaymasterStubDataV7Parameters } from './index';
import { PaymasterHandler } from './handlers/PaymasterHandler';
import { PaymasterHandlerFactory } from './handlers/PaymasterHandlerFactory';

/**
 * PrepaidGasPaymaster client
 *
 * @example
 * ```typescript
 * // Create client for Base Sepolia
 * const paymaster = PrepaidGasPaymaster.createForNetwork(84532);
 *
 * // The client automatically determines the appropriate handler
 * // based on the paymaster address in the context
 * const stubData = await paymaster.getPaymasterStubData({
 *   sender: '0x...',
 *   callData: '0x...',
 *   context: encodePaymasterContext(paymasterAddress, identity),
 *   chainId: 84532,
 *   entryPointAddress: '0x...'
 * });
 * ```
 */
export class PrepaidGasPaymaster {
  private chainId: ChainId;
  private options: {
    subgraphUrl?: string;
    rpcUrl?: string;
  };
  private subgraphClient: SubgraphClient;

  constructor(
    chainId: ChainId,
    options: {
      /** Custom subgraph URL (optional, uses default if not provided) */
      subgraphUrl?: string;
      /** Custom RPC URL */
      rpcUrl?: string;
    } = {}
  ) {
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

    // Initialize subgraph client
    this.subgraphClient = new SubgraphClient(chainId, {
      subgraphUrl: finalSubgraphUrl,
    });
  }

  /**
   * Create a PrepaidGasPaymaster instance for any supported network by chain ID
   *
   * @param chainId - The chain ID to create paymaster for
   * @param options - Optional configuration overrides
   * @returns Configured PrepaidGasPaymaster instance
   *
   * @example
   * ```typescript
   * // Create for Base Sepolia
   * const paymaster = PrepaidGasPaymaster.createForNetwork(84532);
   *
   * // Create with custom options
   * const paymaster = PrepaidGasPaymaster.createForNetwork(8453, {
   *   subgraphUrl: "https://custom-subgraph.com",
   *   rpcUrl: "https://base-mainnet.g.alchemy.com/v2/your-key"
   * });
   * ```
   */
  static createForNetwork(
    chainId: ChainId,
    options: {
      subgraphUrl?: string;
      rpcUrl?: string;
    } = {}
  ): PrepaidGasPaymaster {
    return new PrepaidGasPaymaster(chainId, options);
  }

  /**
   * Generate stub paymaster data for gas estimation
   *
   * Automatically determines the appropriate paymaster handler based on the
   * paymaster address in the context and delegates to the handler.
   *
   * @param parameters - Parameters for generating stub data
   * @returns Promise resolving to paymaster stub data
   */
  async getPaymasterStubData(parameters: GetPaymasterStubDataV7Parameters): Promise<GetPaymasterStubDataReturnType> {
    const handler = await this.getHandlerForContext(parameters.context as `0x${string}`);
    return handler.getPaymasterStubData(parameters);
  }

  /**
   * Generate real paymaster data
   *
   * Automatically determines the appropriate paymaster handler based on the
   * paymaster address in the context and delegates to the handler.
   *
   * @param parameters - Parameters for generating paymaster data
   * @returns Promise resolving to encoded paymaster data
   */
  async getPaymasterData(parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType> {
    const handler = this.getHandlerForContext(parameters.context as `0x${string}`);
    return handler.getPaymasterData(parameters);
  }

  /**
   * Get the subgraph client instance
   *
   * @returns The configured subgraph client
   */
  getSubgraphClient(): SubgraphClient {
    return this.subgraphClient;
  }

  /**
   * Get information about supported paymasters for this network
   *
   * @returns Array of supported paymaster addresses and their types
   */
  getSupportedPaymasters(): Array<{
    address: `0x${string}`;
    type: string;
  }> {
    const addresses = PaymasterHandlerFactory.getSupportedPaymasters(this.chainId);
    return addresses.map((address) => ({
      address,
      type: PaymasterHandlerFactory.getPaymasterType(address, this.chainId) || 'Unknown',
    }));
  }

  /**
   * Get handler for a specific paymaster address (useful for testing)
   *
   * @param paymasterAddress - Paymaster contract address
   * @returns The handler instance for the paymaster
   */
  getHandlerForAddress(paymasterAddress: `0x${string}`): PaymasterHandler {
    const preset = getNetworkPreset(this.chainId);
    if (!preset) {
      throw new Error(`Unsupported chainId: ${this.chainId}`);
    }

    return PaymasterHandlerFactory.createHandler(paymasterAddress, {
      chainId: this.chainId,
      subgraphClient: this.subgraphClient,
      rpcUrl: this.options.rpcUrl,
      preset,
    });
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Get the appropriate handler for a given context
   *
   * @param context - Encoded paymaster context
   * @returns The appropriate handler instance
   */
  private getHandlerForContext(context: `0x${string}`): PaymasterHandler {
    // Parse context to extract paymaster address
    const parsedContext = parsePaymasterContext(context);

    return this.getHandlerForAddress(parsedContext.paymasterAddress);
  }
}
