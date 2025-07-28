import {
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType,
  GetPaymasterStubDataReturnType,
} from 'viem/account-abstraction';
import { GetPaymasterStubDataV7Parameters } from '../index';
import type { SubgraphClient } from '@prepaid-gas/data';

/**
 * Handler interface for different paymaster implementations
 *
 * This interface defines the contract that all paymaster handlers must implement.
 * Each paymaster type (GasLimited, OneTimeUse, CacheEnabledGasLimited) will have
 * its own handler implementation.
 */
export interface PaymasterHandler {
  /**
   * Generate stub paymaster data for gas estimation
   *
   * @param parameters - Parameters for generating stub data
   * @returns Promise resolving to paymaster stub data
   */
  getPaymasterStubData(parameters: GetPaymasterStubDataV7Parameters): Promise<GetPaymasterStubDataReturnType>;

  /**
   * Generate real paymaster data with zero-knowledge proof
   *
   * @param parameters - Parameters for generating paymaster data
   * @returns Promise resolving to encoded paymaster data
   */
  getPaymasterData(parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType>;

  /**
   * Get the paymaster contract address this handler handles
   */
  getPaymasterAddress(): `0x${string}`;

  /**
   * Get the paymaster type name for debugging/logging
   */
  getPaymasterType(): string;
}

/**
 * Context shared across all paymaster handlers
 */
export interface PaymasterContext {
  paymasterAddress: `0x${string}`;
  identityHex: string;
}

/**
 * Network preset configuration
 */
export interface NetworkPreset {
  paymasters: {
    GasLimitedPaymaster: {
      address: `0x${string}`;
      joiningAmount: bigint;
      scope: bigint;
    };
    OneTimeUsePaymaster: {
      address: `0x${string}`;
      joiningAmount: bigint;
      scope: bigint;
    };
    CacheEnabledGasLimitedPaymaster: {
      address: `0x${string}`;
      joiningAmount: bigint;
      scope: bigint;
    };
  };
  defaultSubgraphUrl?: string;
}

/**
 * Configuration for paymaster handler instances
 */
export interface PaymasterHandlerConfig {
  chainId: number;
  subgraphClient: SubgraphClient;
  rpcUrl?: string;
  preset: NetworkPreset;
}
