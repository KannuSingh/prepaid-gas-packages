/**
 * Network presets for prepaid gas paymaster system
 * Updated to support multi-network/multi-chain deployments
 *
 * These presets provide default configurations for supported networks,
 * including subgraph URLs, RPC endpoints, and contract addresses.
 */

import type { NetworkConfig, PaymasterContractConfig } from "./config.js";
import type { NetworkName, ChainId, PaymasterType } from "../types/subgraph.js";
import {
  BASE_SEPOLIA_NETWORK,
  BASE_MAINNET_NETWORK,
  ETHEREUM_MAINNET_NETWORK,
  SEPOLIA_NETWORK,
  NETWORKS_BY_CHAIN_ID,
  NETWORKS_BY_NAME,
  validateNetworkConfig,
  getAllPaymasterContracts,
  getSupportedPaymasterTypes,
} from "./config.js";

/**
 * Network preset configuration
 * Extends NetworkConfig with deployment-specific settings
 */
export interface NetworkPreset {
  /** The network configuration */
  network: NetworkConfig;
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
  deploymentStatus: "active" | "planned" | "deprecated";
  /** Additional metadata */
  metadata?: {
    /** Subgraph deployment key */
    subgraphDeploymentKey?: string;
    /** IPFS hash for subgraph */
    ipfsHash?: string;
    /** Last updated timestamp */
    lastUpdated?: string;
  };
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
  network: BASE_SEPOLIA_NETWORK,
  defaultSubgraphUrl:
    "https://api.studio.thegraph.com/query/113435/prepaid-gas-paymaster-base-sepolia/version/latest",
  defaultRpcUrl: "https://sepolia.base.org",
  description:
    "Base Sepolia testnet with GasLimited and OneTimeUse paymasters - ideal for development and testing",
  supportedPaymasterTypes: ["GasLimited", "OneTimeUse"],
  isProduction: false,
  deploymentStatus: "active",
  metadata: {
    subgraphDeploymentKey: "prepaid-gas-paymaster-base-sepolia",
    lastUpdated: "2024-01-01",
  },
};

/**
 * Base Mainnet network preset
 * Production network (contracts planned)
 */
export const BASE_MAINNET_PRESET: NetworkPreset = {
  network: BASE_MAINNET_NETWORK,
  defaultSubgraphUrl:
    "https://api.studio.thegraph.com/query/113435/prepaid-gas-paymaster-base/version/latest",
  defaultRpcUrl: "https://mainnet.base.org",
  description:
    "Base Mainnet for production deployments - contracts to be deployed",
  supportedPaymasterTypes: [], // Will be updated when contracts are deployed
  isProduction: true,
  deploymentStatus: "planned",
  metadata: {
    subgraphDeploymentKey: "prepaid-gas-paymaster-base",
    lastUpdated: "2024-01-01",
  },
};

/**
 * Ethereum Mainnet network preset
 * Future production network
 */
export const ETHEREUM_MAINNET_PRESET: NetworkPreset = {
  network: ETHEREUM_MAINNET_NETWORK,
  defaultSubgraphUrl:
    "https://api.studio.thegraph.com/query/113435/prepaid-gas-paymaster-ethereum/version/latest",
  defaultRpcUrl: "https://eth.llamarpc.com",
  description:
    "Ethereum Mainnet for production deployments - contracts to be deployed",
  supportedPaymasterTypes: [], // Will be updated when contracts are deployed
  isProduction: true,
  deploymentStatus: "planned",
  metadata: {
    subgraphDeploymentKey: "prepaid-gas-paymaster-ethereum",
    lastUpdated: "2024-01-01",
  },
};

/**
 * Sepolia network preset
 * Ethereum testnet for development
 */
export const SEPOLIA_PRESET: NetworkPreset = {
  network: SEPOLIA_NETWORK,
  defaultSubgraphUrl:
    "https://api.studio.thegraph.com/query/113435/prepaid-gas-paymaster-sepolia/version/latest",
  defaultRpcUrl: "https://sepolia.drpc.org",
  description: "Sepolia testnet for Ethereum-based development and testing",
  supportedPaymasterTypes: [], // Will be updated when contracts are deployed
  isProduction: false,
  deploymentStatus: "planned",
  metadata: {
    subgraphDeploymentKey: "prepaid-gas-paymaster-sepolia",
    lastUpdated: "2024-01-01",
  },
};

/**
 * ========================================
 * PRESET COLLECTIONS
 * ========================================
 */

/**
 * All available network presets mapped by chain ID
 */
export const NETWORK_PRESETS: Record<ChainId, NetworkPreset> = {
  84532: BASE_SEPOLIA_PRESET,
  8453: BASE_MAINNET_PRESET,
  1: ETHEREUM_MAINNET_PRESET,
  11155111: SEPOLIA_PRESET,
} as const;

/**
 * All available network presets mapped by network name
 */
export const NETWORK_PRESETS_BY_NAME: Record<NetworkName, NetworkPreset> = {
  "base-sepolia": BASE_SEPOLIA_PRESET,
  base: BASE_MAINNET_PRESET,
  ethereum: ETHEREUM_MAINNET_PRESET,
  sepolia: SEPOLIA_PRESET,
} as const;

/**
 * Active network presets (ready for use)
 */
export const ACTIVE_NETWORK_PRESETS = Object.values(NETWORK_PRESETS).filter(
  (preset) => preset.deploymentStatus === "active",
);

/**
 * Production network presets
 */
export const PRODUCTION_NETWORK_PRESETS = Object.values(NETWORK_PRESETS).filter(
  (preset) => preset.isProduction,
);

/**
 * Testnet network presets
 */
export const TESTNET_NETWORK_PRESETS = Object.values(NETWORK_PRESETS).filter(
  (preset) => !preset.isProduction,
);

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
export function getNetworkPreset(chainId: number): NetworkPreset | undefined {
  return NETWORK_PRESETS[chainId as ChainId];
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
export function getNetworkPresetByName(
  networkName: string,
): NetworkPreset | undefined {
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
 * Get active chain IDs (networks with deployed contracts)
 *
 * @returns Array of active chain IDs
 *
 * @example
 * ```typescript
 * const activeChains = getActiveChainIds();
 * console.log(activeChains); // [84532]
 * ```
 */
export function getActiveChainIds(): ChainId[] {
  return ACTIVE_NETWORK_PRESETS.map((preset) => preset.network.chainId);
}

/**
 * Get production chain IDs
 *
 * @returns Array of production chain IDs
 *
 * @example
 * ```typescript
 * const prodChains = getProductionChainIds();
 * console.log(prodChains); // [8453, 1]
 * ```
 */
export function getProductionChainIds(): ChainId[] {
  return PRODUCTION_NETWORK_PRESETS.map((preset) => preset.network.chainId);
}

/**
 * Get testnet chain IDs
 *
 * @returns Array of testnet chain IDs
 *
 * @example
 * ```typescript
 * const testChains = getTestnetChainIds();
 * console.log(testChains); // [84532, 11155111]
 * ```
 */
export function getTestnetChainIds(): ChainId[] {
  return TESTNET_NETWORK_PRESETS.map((preset) => preset.network.chainId);
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
export function isNetworkActive(chainId: number): boolean {
  const preset = getNetworkPreset(chainId);
  return preset?.deploymentStatus === "active" || false;
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
export function isNetworkProduction(chainId: number): boolean {
  const preset = getNetworkPreset(chainId);
  return preset?.isProduction || false;
}

/**
 * Get a helpful error message for unsupported networks
 *
 * @param chainId - The unsupported chain ID
 * @returns Formatted error message with supported alternatives
 *
 * @example
 * ```typescript
 * const error = getUnsupportedNetworkError(999);
 * console.log(error); // "Unsupported network with chainId: 999..."
 * ```
 */
export function getUnsupportedNetworkError(chainId: number): string {
  const supported = getSupportedChainIds();
  const active = getActiveChainIds();

  return `Unsupported network with chainId: ${chainId}. 
Supported networks: ${supported.join(", ")}
Active networks: ${active.join(", ")}
Use one of the active networks for immediate testing.`;
}

/**
 * Validate network preset configuration
 *
 * @param preset - The preset to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * const result = validateNetworkPreset(BASE_SEPOLIA_PRESET);
 * if (!result.isValid) {
 *   console.error("Invalid preset:", result.errors);
 * }
 * ```
 */
export function validateNetworkPreset(preset: NetworkPreset): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate network config first
  const networkValidation = validateNetworkConfig(preset.network);
  if (!networkValidation.isValid) {
    errors.push(...networkValidation.errors);
  }

  // Validate preset-specific fields
  if (!preset.defaultSubgraphUrl) {
    errors.push("Default subgraph URL is required");
  } else {
    try {
      new URL(preset.defaultSubgraphUrl);
    } catch {
      errors.push("Default subgraph URL must be a valid URL");
    }
  }

  if (!preset.defaultRpcUrl) {
    errors.push("Default RPC URL is required");
  } else {
    try {
      new URL(preset.defaultRpcUrl);
    } catch {
      errors.push("Default RPC URL must be a valid URL");
    }
  }

  if (!preset.description || !preset.description.trim()) {
    errors.push("Description is required");
  }

  if (
    !preset.supportedPaymasterTypes ||
    !Array.isArray(preset.supportedPaymasterTypes)
  ) {
    errors.push("Supported paymaster types array is required");
  }

  // Validate that supported paymaster types match actual network contracts
  if (preset.supportedPaymasterTypes && preset.network.contracts) {
    const actualTypes = getSupportedPaymasterTypes(preset.network);
    const declaredTypes = preset.supportedPaymasterTypes;

    // Check for types declared but not configured
    declaredTypes.forEach((type) => {
      if (!actualTypes.includes(type)) {
        errors.push(
          `Paymaster type '${type}' is declared as supported but no contract address configured`,
        );
      }
    });

    // Check for types configured but not declared
    actualTypes.forEach((type) => {
      if (!declaredTypes.includes(type)) {
        errors.push(
          `Paymaster type '${type}' is configured but not declared as supported`,
        );
      }
    });
  }

  // Validate deployment status
  const validStatuses = ["active", "planned", "deprecated"];
  if (!validStatuses.includes(preset.deploymentStatus)) {
    errors.push(
      `Invalid deployment status: ${preset.deploymentStatus}. Must be one of: ${validStatuses.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get preset configuration with validation
 *
 * @param chainId - The chain ID to get preset for
 * @returns The validated preset configuration
 * @throws Error if chain ID is not supported or preset is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const preset = getValidatedNetworkPreset(84532);
 *   console.log(preset.network.chainName); // "Base Sepolia"
 * } catch (error) {
 *   console.error("Invalid network:", error.message);
 * }
 * ```
 */
export function getValidatedNetworkPreset(chainId: number): NetworkPreset {
  const preset = getNetworkPreset(chainId);

  if (!preset) {
    throw new Error(getUnsupportedNetworkError(chainId));
  }

  const validation = validateNetworkPreset(preset);
  if (!validation.isValid) {
    throw new Error(
      `Invalid network preset for chainId ${chainId}: ${validation.errors.join(", ")}`,
    );
  }

  return preset;
}

/**
 * Get paymaster contracts for a specific network
 *
 * @param chainId - The chain ID to get contracts for
 * @returns Array of paymaster contracts or empty array if network not supported
 *
 * @example
 * ```typescript
 * const contracts = getPaymasterContracts(84532);
 * console.log(contracts); // [{ address: "0x...", type: "GasLimited", startBlock: 0 }]
 * ```
 */
export function getPaymasterContracts(chainId: number): Array<{
  address: string;
  type: PaymasterType;
  startBlock: number;
}> {
  const preset = getNetworkPreset(chainId);
  if (!preset) return [];

  const contracts = getAllPaymasterContracts(preset.network);
  return contracts.map((contract) => ({
    address: contract.address,
    type: contract.type,
    startBlock: contract.startBlock,
  }));
}

/**
 * Get paymaster contract by type for a specific network
 *
 * @param chainId - The chain ID
 * @param type - The paymaster type
 * @returns Paymaster contract info or undefined if not found
 *
 * @example
 * ```typescript
 * const contract = getPaymasterContract(84532, "GasLimited");
 * if (contract) {
 *   console.log(contract.address); // "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf"
 * }
 * ```
 */
export function getPaymasterContract(
  chainId: number,
  type: PaymasterType,
):
  | {
      address: string;
      type: PaymasterType;
      startBlock: number;
    }
  | undefined {
  const preset = getNetworkPreset(chainId);
  if (!preset) return undefined;

  const contract =
    preset.network.contracts.paymasters[
      type === "GasLimited" ? "gasLimited" : "oneTimeUse"
    ];

  if (!contract) return undefined;

  return {
    address: contract.address,
    type: contract.type,
    startBlock: contract.startBlock,
  };
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
export function supportsPaymasterType(
  chainId: number,
  type: PaymasterType,
): boolean {
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
export function getSupportedPaymasterTypesForNetwork(
  chainId: number,
): PaymasterType[] {
  const preset = getNetworkPreset(chainId);
  return preset?.supportedPaymasterTypes || [];
}

/**
 * Get default configuration for a network
 *
 * @param chainId - The chain ID to get config for
 * @returns Default configuration object
 *
 * @example
 * ```typescript
 * const config = getDefaultNetworkConfig(84532);
 * console.log(config.subgraphUrl); // "https://api.studio.thegraph.com/..."
 * ```
 */
export function getDefaultNetworkConfig(chainId: number):
  | {
      subgraphUrl: string;
      rpcUrl: string;
      network: NetworkConfig;
    }
  | undefined {
  const preset = getNetworkPreset(chainId);
  if (!preset) return undefined;

  return {
    subgraphUrl: preset.defaultSubgraphUrl,
    rpcUrl: preset.defaultRpcUrl,
    network: preset.network,
  };
}
