import { SubgraphClient } from '@prepaid-gas/data';
import { ChainId, getNetworkPreset } from '@prepaid-gas/constants';

import { PaymasterHandler, PaymasterHandlerConfig } from './PaymasterHandler';
import { GasLimitedPaymasterHandler } from './GasLimitedPaymasterHandler';
import { OneTimeUsePaymasterHandler } from './OneTimeUsePaymasterHandler';
import { CacheEnabledGasLimitedPaymasterHandler } from './CacheEnabledGasLimitedPaymasterHandler';

/**
 * Factory for creating appropriate paymaster handlers
 *
 * Determines which handler to use based on the paymaster address
 * and provides a centralized place for handler instantiation.
 */
export class PaymasterHandlerFactory {
  private static handlerCache = new Map<string, PaymasterHandler>();

  /**
   * Create appropriate handler for a given paymaster address
   *
   * @param paymasterAddress - The paymaster contract address
   * @param config - Configuration for the handler
   * @returns Promise resolving to the appropriate handler instance
   */
  static createHandler(paymasterAddress: `0x${string}`, config: PaymasterHandlerConfig): PaymasterHandler {
    const cacheKey = `${config.chainId}-${paymasterAddress}`;

    // Return cached handler if available
    if (this.handlerCache.has(cacheKey)) {
      return this.handlerCache.get(cacheKey)!;
    }

    const preset = config.preset;
    if (!preset) {
      throw new Error(`No network preset found for chainId: ${config.chainId}`);
    }

    let handler: PaymasterHandler;

    // Determine handler based on paymaster address
    if (paymasterAddress === preset.paymasters.GasLimitedPaymaster.address) {
      handler = new GasLimitedPaymasterHandler(config);
    } else if (paymasterAddress === preset.paymasters.OneTimeUsePaymaster.address) {
      handler = new OneTimeUsePaymasterHandler(config);
    } else if (paymasterAddress === preset.paymasters.CacheEnabledGasLimitedPaymaster.address) {
      handler = new CacheEnabledGasLimitedPaymasterHandler(config);
    } else {
      throw new Error(`Unsupported paymaster address: ${paymasterAddress}`);
    }

    // Cache the handler
    this.handlerCache.set(cacheKey, handler);

    return handler;
  }

  /**
   * Create handler from context that contains paymaster address
   *
   * @param context - Context containing paymaster address
   * @param chainId - Chain ID
   * @param options - Additional options
   * @returns Promise resolving to the appropriate handler instance
   */
  static createHandlerFromContext(
    context: `0x${string}`,
    chainId: ChainId,
    options: {
      subgraphUrl?: string;
      rpcUrl?: string;
    } = {}
  ): PaymasterHandler {
    // Parse context to extract paymaster address
    // This is a simplified version - in practice you'd use parsePaymasterContext
    // For now, assume the context starts with the paymaster address
    const paymasterAddress = context.slice(0, 42) as `0x${string}`;

    const preset = getNetworkPreset(chainId);
    if (!preset) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    // Use provided subgraph URL or fall back to preset default
    const finalSubgraphUrl = options.subgraphUrl || preset.defaultSubgraphUrl;

    if (!finalSubgraphUrl) {
      throw new Error(
        `No subgraph URL available for network(chainId: ${chainId}). Please provide one in options.subgraphUrl`
      );
    }

    // Initialize subgraph client
    const subgraphClient = new SubgraphClient(chainId, {
      subgraphUrl: finalSubgraphUrl,
    });

    const config: PaymasterHandlerConfig = {
      chainId,
      subgraphClient,
      rpcUrl: options.rpcUrl,
      preset,
    };

    return this.createHandler(paymasterAddress, config);
  }

  /**
   * Clear handler cache (useful for testing or configuration changes)
   */
  static clearCache(): void {
    this.handlerCache.clear();
  }

  /**
   * Get all supported paymaster addresses for a given chain
   *
   * @param chainId - Chain ID to get addresses for
   * @returns Array of supported paymaster addresses
   */
  static getSupportedPaymasters(chainId: ChainId): `0x${string}`[] {
    const preset = getNetworkPreset(chainId);
    if (!preset) {
      return [];
    }

    return [
      preset.paymasters.GasLimitedPaymaster.address,
      preset.paymasters.OneTimeUsePaymaster.address,
      preset.paymasters.CacheEnabledGasLimitedPaymaster.address,
    ].filter((address): address is `0x${string}` => !!address);
  }

  /**
   * Get paymaster type from address
   *
   * @param paymasterAddress - Paymaster contract address
   * @param chainId - Chain ID
   * @returns Paymaster type name or null if not found
   */
  static getPaymasterType(paymasterAddress: `0x${string}`, chainId: ChainId): string | null {
    const preset = getNetworkPreset(chainId);
    if (!preset) {
      return null;
    }

    if (paymasterAddress === preset.paymasters.GasLimitedPaymaster.address) {
      return 'GasLimitedPaymaster';
    } else if (paymasterAddress === preset.paymasters.OneTimeUsePaymaster.address) {
      return 'OneTimeUsePaymaster';
    } else if (paymasterAddress === preset.paymasters.CacheEnabledGasLimitedPaymaster.address) {
      return 'CacheEnabledGasLimitedPaymaster';
    }

    return null;
  }
}
