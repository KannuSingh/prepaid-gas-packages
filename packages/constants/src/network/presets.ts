/**
 * Network presets for prepaid gas paymaster system
 * Updated to support multi-network/multi-chain deployments
 *
 * These presets provide default configurations for supported networks,
 * including subgraph URLs, RPC endpoints, and contract addresses.
 */

import type { NetworkName, ChainId, PaymasterType } from './config';

/**
 * Network preset configuration
 * Extends NetworkConfig with deployment-specific settings
 */
export interface NetworkPreset {
  name: NetworkName;
  paymasterAddress: {
    GasLimitedPaymaster: `0x${string}`;
    OneTimeUsePaymaster: `0x${string}`;
  };
  /** Default subgraph URL for this network */
  defaultSubgraphUrl: string;
  /** Default RPC URL for this network */
  defaultRpcUrl: string;
  /** Network description for documentation */
  description: string;
  /** Supported paymaster types on this network */
  supportedPaymasterTypes: PaymasterType[];
  /** Whether this network is ready for production use */
  isProduction: boolean;
  /** Deployment status */
  deploymentStatus: 'active' | 'planned' | 'deprecated';
}

/**
 * ========================================
 * NETWORK PRESETS
 * ========================================
 */

/**
 * Base Sepolia network preset
 * Primary development and testing network
 */
export const BASE_SEPOLIA_PRESET: NetworkPreset = {
  name: 'base-sepolia',
  paymasterAddress: {
    GasLimitedPaymaster: '0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf',
    OneTimeUsePaymaster: '0x243A735115F34BD5c0F23a33a444a8d26e31E2E7',
  },
  defaultSubgraphUrl: 'https://api.studio.thegraph.com/query/113435/prepaid-gas-paymaster-base-sepolia/version/latest',
  defaultRpcUrl: 'https://sepolia.base.org',
  description: 'Base Sepolia testnet with GasLimited and OneTimeUse paymasters - ideal for development and testing',
  supportedPaymasterTypes: ['GasLimited', 'OneTimeUse'],
  isProduction: false,
  deploymentStatus: 'active',
};

/**
 * ========================================
 * PRESET COLLECTIONS
 * ========================================
 */

/**
 * All available network presets mapped by chain ID
 */
const NETWORK_PRESETS: Record<ChainId, NetworkPreset> = {
  84532: BASE_SEPOLIA_PRESET,
} as const;

/**
 * All available network presets mapped by network name
 */
const NETWORK_PRESETS_BY_NAME: Record<NetworkName, NetworkPreset> = {
  'base-sepolia': BASE_SEPOLIA_PRESET,
} as const;

/**
 * ========================================
 * PRESET UTILITIES
 * ========================================
 */

/**
 * Get network preset by chain ID
 *
 * @param chainId - The chain ID to look up
 * @returns The network preset if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const preset = getNetworkPreset(84532);
 * if (preset) {
 *   console.log(preset.network.chainName); // "Base Sepolia"
 * }
 * ```
 */
export function getNetworkPreset(chainId: ChainId): NetworkPreset | undefined {
  return NETWORK_PRESETS[chainId];
}

/**
 * Get network preset by network name
 *
 * @param networkName - The network name to look up
 * @returns The network preset if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const preset = getNetworkPresetByName("base-sepolia");
 * if (preset) {
 *   console.log(preset.defaultSubgraphUrl);
 * }
 * ```
 */
export function getNetworkPresetByName(networkName: string): NetworkPreset | undefined {
  return NETWORK_PRESETS_BY_NAME[networkName as NetworkName];
}

/**
 * Get all supported chain IDs
 *
 * @returns Array of supported chain IDs
 *
 * @example
 * ```typescript
 * const chainIds = getSupportedChainIds();
 * console.log(chainIds); // [84532, 8453, 1, 11155111]
 * ```
 */
export function getSupportedChainIds(): ChainId[] {
  return Object.keys(NETWORK_PRESETS).map((id) => parseInt(id) as ChainId);
}

/**
 * Get all supported network names
 *
 * @returns Array of supported network names
 *
 * @example
 * ```typescript
 * const names = getSupportedNetworkNames();
 * console.log(names); // ["base-sepolia", "base", "ethereum", "sepolia"]
 * ```
 */
export function getSupportedNetworkNames(): NetworkName[] {
  return Object.keys(NETWORK_PRESETS_BY_NAME) as NetworkName[];
}

/**
 * Validate if a chain ID is supported
 *
 * @param chainId - The chain ID to validate
 * @returns True if supported, false otherwise
 *
 * @example
 * ```typescript
 * const isSupported = isSupportedChainId(84532);
 * console.log(isSupported); // true
 * ```
 */
export function isSupportedChainId(chainId: number): boolean {
  return chainId in NETWORK_PRESETS;
}

/**
 * Validate if a network name is supported
 *
 * @param networkName - The network name to validate
 * @returns True if supported, false otherwise
 *
 * @example
 * ```typescript
 * const isSupported = isSupportedNetworkName("base-sepolia");
 * console.log(isSupported); // true
 * ```
 */
export function isSupportedNetworkName(networkName: string): boolean {
  return networkName in NETWORK_PRESETS_BY_NAME;
}

/**
 * Check if a network is active (has deployed contracts)
 *
 * @param chainId - The chain ID to check
 * @returns True if active, false otherwise
 *
 * @example
 * ```typescript
 * const isActive = isNetworkActive(84532);
 * console.log(isActive); // true
 * ```
 */
export function isNetworkActive(chainId: ChainId): boolean {
  const preset = getNetworkPreset(chainId);
  return preset?.deploymentStatus === 'active' || false;
}

/**
 * Check if a network is production-ready
 *
 * @param chainId - The chain ID to check
 * @returns True if production, false otherwise
 *
 * @example
 * ```typescript
 * const isProd = isNetworkProduction(84532);
 * console.log(isProd); // false (testnet)
 * ```
 */
export function isNetworkProduction(chainId: ChainId): boolean {
  const preset = getNetworkPreset(chainId);
  return preset?.isProduction || false;
}

/**
 * Check if a network supports a specific paymaster type
 *
 * @param chainId - The chain ID to check
 * @param type - The paymaster type to check
 * @returns True if supported, false otherwise
 *
 * @example
 * ```typescript
 * const supports = supportsPaymasterType(84532, "GasLimited");
 * console.log(supports); // true
 * ```
 */
export function supportsPaymasterType(chainId: ChainId, type: PaymasterType): boolean {
  const preset = getNetworkPreset(chainId);
  if (!preset) return false;

  return preset.supportedPaymasterTypes.includes(type);
}

/**
 * Get all supported paymaster types for a network
 *
 * @param chainId - The chain ID to get types for
 * @returns Array of supported paymaster types
 *
 * @example
 * ```typescript
 * const types = getSupportedPaymasterTypesForNetwork(84532);
 * console.log(types); // ["GasLimited", "OneTimeUse"]
 * ```
 */
export function getSupportedPaymasterTypesForNetwork(chainId: ChainId): PaymasterType[] {
  const preset = getNetworkPreset(chainId);
  return preset?.supportedPaymasterTypes || [];
}
