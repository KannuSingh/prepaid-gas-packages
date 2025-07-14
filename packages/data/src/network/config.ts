/**
 * Network configuration for prepaid gas paymaster system
 * Updated to support multi-network/multi-chain deployments
 *
 * Based on the mapping files and schema, supports:
 * - Multiple networks (base-sepolia, base, ethereum, sepolia)
 * - Multiple paymaster types per network
 * - Chain ID and network name mapping
 * - Contract address management
 */

import type { NetworkName, ChainId, PaymasterType } from "../types/subgraph.js";

/**
 * Paymaster contract configuration
 */
export interface PaymasterContractConfig {
  /** Contract address */
  address: string;
  /** Contract type */
  type: PaymasterType;
  /** Block number when contract was deployed */
  startBlock: number;
  /** Deployment transaction hash */
  deploymentTx?: string;
  /** Whether this contract is active */
  isActive?: boolean;
}

/**
 * Network configuration interface
 */
export interface NetworkConfig {
  /** Network identifier used in subgraph (e.g., "base-sepolia") */
  name: NetworkName;
  /** Chain ID (e.g., 84532) */
  chainId: ChainId;
  /** Human-readable chain name (e.g., "Base Sepolia") */
  chainName: string;
  /** Network display name (e.g., "Base Sepolia Testnet") */
  networkName: string;
  /** Native currency symbol */
  nativeCurrency: string;
  /** Block explorer URL */
  blockExplorer: string;
  /** RPC URLs */
  rpcUrls: string[];
  /** Contract addresses */
  contracts: {
    /** Paymaster contracts by type */
    paymasters: {
      gasLimited?: PaymasterContractConfig;
      oneTimeUse?: PaymasterContractConfig;
    };
    /** Verifier contract (if applicable) */
    verifier?: string;
    /** EntryPoint contract (ERC-4337) */
    entryPoint?: string;
  };
  /** Network metadata */
  metadata: {
    /** Whether this is a testnet */
    isTestnet: boolean;
    /** Network launch date */
    launchDate?: string;
    /** Additional network tags */
    tags?: string[];
  };
}

/**
 * ========================================
 * NETWORK CONFIGURATIONS
 * ========================================
 */

/**
 * Base Sepolia network configuration
 * Primary testnet for development and testing
 */
export const BASE_SEPOLIA_NETWORK: NetworkConfig = {
  name: "base-sepolia",
  chainId: 84532,
  chainName: "Base Sepolia",
  networkName: "Base Sepolia Testnet",
  nativeCurrency: "ETH",
  blockExplorer: "https://sepolia.basescan.org",
  rpcUrls: [
    "https://sepolia.base.org",
    "https://base-sepolia.blockpi.network/v1/rpc/public",
    "https://base-sepolia.public.blastapi.io",
  ],
  contracts: {
    paymasters: {
      gasLimited: {
        address: "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf",
        type: "GasLimited",
        startBlock: 0, // Update with actual deployment block
        isActive: true,
      },
      oneTimeUse: {
        address: "0x243A735115F34BD5c0F23a33a444a8d26e31E2E7",
        type: "OneTimeUse",
        startBlock: 0, // Update with actual deployment block
        isActive: true,
      },
    },
    // Add other contract addresses as needed
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // Standard EntryPoint v0.6
  },
  metadata: {
    isTestnet: true,
    launchDate: "2024-01-01",
    tags: ["testnet", "development", "base"],
  },
};

/**
 * Base Mainnet network configuration
 * Production network (contracts TBD)
 */
export const BASE_MAINNET_NETWORK: NetworkConfig = {
  name: "base",
  chainId: 8453,
  chainName: "Base",
  networkName: "Base Mainnet",
  nativeCurrency: "ETH",
  blockExplorer: "https://basescan.org",
  rpcUrls: [
    "https://mainnet.base.org",
    "https://base.blockpi.network/v1/rpc/public",
    "https://base.public.blastapi.io",
  ],
  contracts: {
    paymasters: {
      // Add mainnet contract addresses when deployed
      // gasLimited: {
      //   address: "0x...",
      //   type: "GasLimited",
      //   startBlock: 0,
      //   isActive: true,
      // },
      // oneTimeUse: {
      //   address: "0x...",
      //   type: "OneTimeUse",
      //   startBlock: 0,
      //   isActive: true,
      // },
    },
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },
  metadata: {
    isTestnet: false,
    launchDate: "2023-08-09",
    tags: ["mainnet", "production", "base"],
  },
};

/**
 * Ethereum Mainnet network configuration
 * For potential future deployment
 */
export const ETHEREUM_MAINNET_NETWORK: NetworkConfig = {
  name: "ethereum",
  chainId: 1,
  chainName: "Ethereum",
  networkName: "Ethereum Mainnet",
  nativeCurrency: "ETH",
  blockExplorer: "https://etherscan.io",
  rpcUrls: [
    "https://eth.llamarpc.com",
    "https://ethereum.blockpi.network/v1/rpc/public",
    "https://ethereum.public.blastapi.io",
  ],
  contracts: {
    paymasters: {
      // Add Ethereum contract addresses when deployed
    },
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },
  metadata: {
    isTestnet: false,
    launchDate: "2015-07-30",
    tags: ["mainnet", "production", "ethereum"],
  },
};

/**
 * Sepolia testnet network configuration
 * For Ethereum testnet deployment
 */
export const SEPOLIA_NETWORK: NetworkConfig = {
  name: "sepolia",
  chainId: 11155111,
  chainName: "Sepolia",
  networkName: "Sepolia Testnet",
  nativeCurrency: "ETH",
  blockExplorer: "https://sepolia.etherscan.io",
  rpcUrls: [
    "https://sepolia.drpc.org",
    "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
    "https://sepolia.public.blastapi.io",
  ],
  contracts: {
    paymasters: {
      // Add Sepolia contract addresses when deployed
    },
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },
  metadata: {
    isTestnet: true,
    launchDate: "2021-10-10",
    tags: ["testnet", "development", "ethereum"],
  },
};

/**
 * ========================================
 * NETWORK UTILITIES
 * ========================================
 */

/**
 * All supported network configurations
 */
export const ALL_NETWORKS: NetworkConfig[] = [
  BASE_SEPOLIA_NETWORK,
  BASE_MAINNET_NETWORK,
  ETHEREUM_MAINNET_NETWORK,
  SEPOLIA_NETWORK,
];

/**
 * Network configurations mapped by chain ID
 */
export const NETWORKS_BY_CHAIN_ID: Record<ChainId, NetworkConfig> = {
  84532: BASE_SEPOLIA_NETWORK,
  8453: BASE_MAINNET_NETWORK,
  1: ETHEREUM_MAINNET_NETWORK,
  11155111: SEPOLIA_NETWORK,
};

/**
 * Network configurations mapped by network name
 */
export const NETWORKS_BY_NAME: Record<NetworkName, NetworkConfig> = {
  "base-sepolia": BASE_SEPOLIA_NETWORK,
  base: BASE_MAINNET_NETWORK,
  ethereum: ETHEREUM_MAINNET_NETWORK,
  sepolia: SEPOLIA_NETWORK,
};

/**
 * Get network configuration by chain ID
 *
 * @param chainId - The chain ID to look up
 * @returns Network configuration or undefined if not found
 *
 * @example
 * ```typescript
 * const config = getNetworkByChainId(84532);
 * if (config) {
 *   console.log(config.chainName); // "Base Sepolia"
 * }
 * ```
 */
export function getNetworkByChainId(
  chainId: number,
): NetworkConfig | undefined {
  return NETWORKS_BY_CHAIN_ID[chainId as ChainId];
}

/**
 * Get network configuration by network name
 *
 * @param networkName - The network name to look up
 * @returns Network configuration or undefined if not found
 *
 * @example
 * ```typescript
 * const config = getNetworkByName("base-sepolia");
 * if (config) {
 *   console.log(config.chainId); // 84532
 * }
 * ```
 */
export function getNetworkByName(
  networkName: string,
): NetworkConfig | undefined {
  return NETWORKS_BY_NAME[networkName as NetworkName];
}

/**
 * Get all paymaster contracts for a network
 *
 * @param networkConfig - Network configuration
 * @returns Array of paymaster contracts
 *
 * @example
 * ```typescript
 * const contracts = getAllPaymasterContracts(BASE_SEPOLIA_NETWORK);
 * console.log(contracts.length); // 2 (GasLimited + OneTimeUse)
 * ```
 */
export function getAllPaymasterContracts(
  networkConfig: NetworkConfig,
): PaymasterContractConfig[] {
  const contracts: PaymasterContractConfig[] = [];

  if (networkConfig.contracts.paymasters.gasLimited) {
    contracts.push(networkConfig.contracts.paymasters.gasLimited);
  }

  if (networkConfig.contracts.paymasters.oneTimeUse) {
    contracts.push(networkConfig.contracts.paymasters.oneTimeUse);
  }

  return contracts;
}

/**
 * Get paymaster contract by type
 *
 * @param networkConfig - Network configuration
 * @param type - Paymaster type
 * @returns Paymaster contract configuration or undefined
 *
 * @example
 * ```typescript
 * const gasLimited = getPaymasterByType(BASE_SEPOLIA_NETWORK, "GasLimited");
 * if (gasLimited) {
 *   console.log(gasLimited.address); // "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf"
 * }
 * ```
 */
export function getPaymasterByType(
  networkConfig: NetworkConfig,
  type: PaymasterType,
): PaymasterContractConfig | undefined {
  const paymasters = networkConfig.contracts.paymasters;

  switch (type) {
    case "GasLimited":
      return paymasters.gasLimited;
    case "OneTimeUse":
      return paymasters.oneTimeUse;
    default:
      return undefined;
  }
}

/**
 * Check if network has a specific paymaster type
 *
 * @param networkConfig - Network configuration
 * @param type - Paymaster type to check
 * @returns True if network has the paymaster type
 *
 * @example
 * ```typescript
 * const hasGasLimited = hasPaymasterType(BASE_SEPOLIA_NETWORK, "GasLimited");
 * console.log(hasGasLimited); // true
 * ```
 */
export function hasPaymasterType(
  networkConfig: NetworkConfig,
  type: PaymasterType,
): boolean {
  return getPaymasterByType(networkConfig, type) !== undefined;
}

/**
 * Get paymaster contract by address
 *
 * @param networkConfig - Network configuration
 * @param address - Contract address
 * @returns Paymaster contract configuration or undefined
 *
 * @example
 * ```typescript
 * const contract = getPaymasterByAddress(
 *   BASE_SEPOLIA_NETWORK,
 *   "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf"
 * );
 * if (contract) {
 *   console.log(contract.type); // "GasLimited"
 * }
 * ```
 */
export function getPaymasterByAddress(
  networkConfig: NetworkConfig,
  address: string,
): PaymasterContractConfig | undefined {
  const normalizedAddress = address.toLowerCase();
  const contracts = getAllPaymasterContracts(networkConfig);

  return contracts.find(
    (contract) => contract.address.toLowerCase() === normalizedAddress,
  );
}

/**
 * Get default paymaster for a network
 * Returns GasLimited if available, otherwise OneTimeUse
 *
 * @param networkConfig - Network configuration
 * @returns Default paymaster contract or undefined
 *
 * @example
 * ```typescript
 * const defaultPaymaster = getDefaultPaymaster(BASE_SEPOLIA_NETWORK);
 * if (defaultPaymaster) {
 *   console.log(defaultPaymaster.type); // "GasLimited"
 * }
 * ```
 */
export function getDefaultPaymaster(
  networkConfig: NetworkConfig,
): PaymasterContractConfig | undefined {
  // Prefer GasLimited as default
  const gasLimited = getPaymasterByType(networkConfig, "GasLimited");
  if (gasLimited && gasLimited.isActive !== false) {
    return gasLimited;
  }

  // Fall back to OneTimeUse
  const oneTimeUse = getPaymasterByType(networkConfig, "OneTimeUse");
  if (oneTimeUse && oneTimeUse.isActive !== false) {
    return oneTimeUse;
  }

  return undefined;
}

/**
 * Get supported paymaster types for a network
 *
 * @param networkConfig - Network configuration
 * @returns Array of supported paymaster types
 *
 * @example
 * ```typescript
 * const types = getSupportedPaymasterTypes(BASE_SEPOLIA_NETWORK);
 * console.log(types); // ["GasLimited", "OneTimeUse"]
 * ```
 */
export function getSupportedPaymasterTypes(
  networkConfig: NetworkConfig,
): PaymasterType[] {
  const types: PaymasterType[] = [];

  if (networkConfig.contracts.paymasters.gasLimited) {
    types.push("GasLimited");
  }

  if (networkConfig.contracts.paymasters.oneTimeUse) {
    types.push("OneTimeUse");
  }

  return types;
}

/**
 * Validate network configuration
 *
 * @param config - Network configuration to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * const result = validateNetworkConfig(BASE_SEPOLIA_NETWORK);
 * if (!result.isValid) {
 *   console.error("Invalid config:", result.errors);
 * }
 * ```
 */
export function validateNetworkConfig(config: NetworkConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic validation
  if (!config.name) {
    errors.push("Network name is required");
  }

  if (!config.chainId || config.chainId <= 0) {
    errors.push("Valid chain ID is required");
  }

  if (!config.chainName) {
    errors.push("Chain name is required");
  }

  if (!config.rpcUrls || config.rpcUrls.length === 0) {
    errors.push("At least one RPC URL is required");
  }

  // Validate RPC URLs
  config.rpcUrls.forEach((url, index) => {
    try {
      new URL(url);
    } catch {
      errors.push(`Invalid RPC URL at index ${index}: ${url}`);
    }
  });

  // Validate block explorer URL
  if (config.blockExplorer) {
    try {
      new URL(config.blockExplorer);
    } catch {
      errors.push(`Invalid block explorer URL: ${config.blockExplorer}`);
    }
  }

  // Validate paymaster contracts
  const paymasters = getAllPaymasterContracts(config);
  if (paymasters.length === 0) {
    errors.push("At least one paymaster contract is required");
  }

  // Validate contract addresses
  paymasters.forEach((contract) => {
    if (!contract.address || !contract.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push(`Invalid paymaster contract address: ${contract.address}`);
    }

    if (contract.startBlock < 0) {
      errors.push(
        `Invalid start block for ${contract.type}: ${contract.startBlock}`,
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if an address is a valid Ethereum address
 *
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 *
 * @example
 * ```typescript
 * const isValid = isValidAddress("0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf");
 * console.log(isValid); // true
 * ```
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get network name from contract address
 * Based on the contract-to-network mapping from utils.ts
 *
 * @param contractAddress - Contract address
 * @returns Network name or undefined if not found
 *
 * @example
 * ```typescript
 * const network = getNetworkFromContractAddress("0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf");
 * console.log(network); // "base-sepolia"
 * ```
 */
export function getNetworkFromContractAddress(
  contractAddress: string,
): NetworkName | undefined {
  const normalizedAddress = contractAddress.toLowerCase();

  // Check each network for matching contract addresses
  for (const [networkName, config] of Object.entries(NETWORKS_BY_NAME)) {
    const contracts = getAllPaymasterContracts(config);
    const hasContract = contracts.some(
      (contract) => contract.address.toLowerCase() === normalizedAddress,
    );

    if (hasContract) {
      return networkName as NetworkName;
    }
  }

  return undefined;
}

/**
 * Contract address to network mapping (from utils.ts)
 * Used for quick lookups in event handlers
 */
export const CONTRACT_TO_NETWORK_MAP = new Map<string, NetworkName>([
  // Base Sepolia contracts
  ["0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf".toLowerCase(), "base-sepolia"], // GasLimited
  ["0x243A735115F34BD5c0F23a33a444a8d26e31E2E7".toLowerCase(), "base-sepolia"], // OneTimeUse

  // Add other networks as they're deployed
  // ["0x...".toLowerCase(), "base"],
  // ["0x...".toLowerCase(), "ethereum"],
  // ["0x...".toLowerCase(), "sepolia"],
]);

/**
 * Get network from contract address using lookup map
 * Optimized version for event handlers
 *
 * @param contractAddress - Contract address
 * @returns Network name or undefined if not found
 */
export function getNetworkFromContract(
  contractAddress: string,
): NetworkName | undefined {
  return CONTRACT_TO_NETWORK_MAP.get(contractAddress.toLowerCase());
}
