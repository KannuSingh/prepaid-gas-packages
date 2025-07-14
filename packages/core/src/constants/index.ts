/**
 * @fileoverview Constants and Configuration Utilities
 * 
 * Centralized constants, default configurations, and utility functions
 * for Private Prepaid Gas paymaster operations.
 */

import { type Chain } from 'viem';
import {
  type Address,
  type BigNumberish,
  type GasLimits,
  type GasFees,
  type RetryConfig,
  CONSTANTS as TYPE_CONSTANTS,
} from '@private-prepaid-gas/types';

/**
 * Core SDK constants extending the base constants from types package
 */
export const SDK_CONSTANTS = {
  ...TYPE_CONSTANTS,
  
  // SDK Version
  VERSION: '1.0.0',
  
  // Default timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_TIMEOUT: 5000,
  DEFAULT_CONFIRMATION_TIMEOUT: 60000,
  
  // Default gas parameters
  DEFAULT_GAS_MULTIPLIER: 1.1,
  DEFAULT_MAX_FEE_PER_GAS_MULTIPLIER: 1.25,
  DEFAULT_MAX_PRIORITY_FEE_MULTIPLIER: 1.1,
  
  // Rate limiting
  DEFAULT_REQUESTS_PER_SECOND: 10,
  DEFAULT_BURST_SIZE: 50,
  
  // Cache settings
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
  DEFAULT_MAX_CACHE_SIZE: 1000,
  
  // Pool constants
  MAX_POOL_MEMBERS: 2**20, // 1M members max for practical purposes
  MIN_JOINING_FEE: '1000000000000000', // 0.001 ETH in wei
  MAX_JOINING_FEE: '10000000000000000000', // 10 ETH in wei
  
  // Proof constants  
  SEMAPHORE_TREE_DEPTH: 20,
  BN254_SCALAR_FIELD: '21888242871839275222246405745257275088548364400416034343698204186575808495617',
  
  // User operation limits
  MAX_CALLDATA_SIZE: 1000000, // 1MB
  MAX_INIT_CODE_SIZE: 50000,   // 50KB
  MAX_SIGNATURE_SIZE: 10000,   // 10KB
  
  // Network polling intervals
  BLOCK_POLLING_INTERVAL: 12000, // 12 seconds (Ethereum block time)
  EVENT_POLLING_INTERVAL: 5000,  // 5 seconds
  
  // Error retry constants
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_FACTOR: 2,
  MAX_RETRY_DELAY: 30000,
} as const;

/**
 * Default gas limits for different operations
 */
export const DEFAULT_GAS_LIMITS: Record<string, GasLimits> = {
  CREATE_POOL: {
    callGasLimit: '200000',
    verificationGasLimit: '150000',
    preVerificationGas: '21000',
  },
  ADD_MEMBER: {
    callGasLimit: '150000',
    verificationGasLimit: '100000',
    preVerificationGas: '21000',
  },
  ADD_MEMBERS: {
    callGasLimit: '300000', // Base + per member
    verificationGasLimit: '150000',
    preVerificationGas: '21000',
  },
  USER_OPERATION: {
    callGasLimit: '100000',
    verificationGasLimit: '200000',
    preVerificationGas: '50000',
  },
} as const;

/**
 * Default gas fees (in wei)
 */
export const DEFAULT_GAS_FEES: GasFees = {
  maxFeePerGas: '20000000000', // 20 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
} as const;

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: SDK_CONSTANTS.MAX_RETRY_ATTEMPTS,
  initialDelay: 1000,
  maxDelay: SDK_CONSTANTS.MAX_RETRY_DELAY,
  backoffFactor: SDK_CONSTANTS.RETRY_BACKOFF_FACTOR,
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry validation errors or if max attempts reached
    if (error.message.includes('validation') || attempt >= SDK_CONSTANTS.MAX_RETRY_ATTEMPTS) {
      return false;
    }
    // Retry network errors, timeouts, and rate limits
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('rate limit');
  },
} as const;

/**
 * Supported network configurations
 */
export interface NetworkConfig {
  /** Chain configuration */
  readonly chain: Chain;
  /** Default RPC URLs */
  readonly rpcUrls: readonly string[];
  /** Gas station API URL for fee estimation */
  readonly gasStationUrl?: string;
  /** Block explorer URL */
  readonly explorerUrl: string;
  /** Default contract addresses */
  readonly contracts: {
    readonly gasLimitedPaymaster?: Address;
    readonly oneTimeUsePaymaster?: Address;
    readonly entryPoint?: Address;
  };
  /** Network-specific gas multipliers */
  readonly gasMultipliers?: {
    readonly fee: number;
    readonly limit: number;
  };
}

/**
 * Default network configurations
 */
export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  // Base Sepolia Testnet
  84532: {
    chain: {
      id: 84532,
      name: 'Base Sepolia',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: { http: ['https://sepolia.base.org'] },
        public: { http: ['https://sepolia.base.org'] },
      },
      blockExplorers: {
        default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
      },
      testnet: true,
    },
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia.public.blastapi.io',
    ],
    explorerUrl: 'https://sepolia.basescan.org',
    contracts: {
      // These would be filled in with actual deployed addresses
      gasLimitedPaymaster: undefined,
      oneTimeUsePaymaster: undefined,
      entryPoint: undefined,
    },
    gasMultipliers: {
      fee: 1.1,
      limit: 1.2,
    },
  },
  // Additional networks can be added here
} as const;

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  /** Environment name */
  readonly name: 'development' | 'staging' | 'production';
  /** Logging level */
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Enable debug features */
  readonly debug: boolean;
  /** API rate limits */
  readonly rateLimits: {
    readonly requestsPerSecond: number;
    readonly burstSize: number;
  };
  /** Cache configuration */
  readonly cache: {
    readonly ttl: number;
    readonly maxSize: number;
  };
  /** Network timeouts */
  readonly timeouts: {
    readonly default: number;
    readonly retry: number;
    readonly confirmation: number;
  };
}

/**
 * Environment configurations
 */
export const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  development: {
    name: 'development',
    logLevel: 'debug',
    debug: true,
    rateLimits: {
      requestsPerSecond: 20,
      burstSize: 100,
    },
    cache: {
      ttl: 60000, // 1 minute
      maxSize: 100,
    },
    timeouts: {
      default: 10000,
      retry: 2000,
      confirmation: 30000,
    },
  },
  staging: {
    name: 'staging',
    logLevel: 'info',
    debug: true,
    rateLimits: {
      requestsPerSecond: 15,
      burstSize: 75,
    },
    cache: {
      ttl: 180000, // 3 minutes
      maxSize: 500,
    },
    timeouts: {
      default: 20000,
      retry: 3000,
      confirmation: 45000,
    },
  },
  production: {
    name: 'production',
    logLevel: 'warn',
    debug: false,
    rateLimits: {
      requestsPerSecond: SDK_CONSTANTS.DEFAULT_REQUESTS_PER_SECOND,
      burstSize: SDK_CONSTANTS.DEFAULT_BURST_SIZE,
    },
    cache: {
      ttl: SDK_CONSTANTS.DEFAULT_CACHE_TTL,
      maxSize: SDK_CONSTANTS.DEFAULT_MAX_CACHE_SIZE,
    },
    timeouts: {
      default: SDK_CONSTANTS.DEFAULT_TIMEOUT,
      retry: SDK_CONSTANTS.DEFAULT_RETRY_TIMEOUT,
      confirmation: SDK_CONSTANTS.DEFAULT_CONFIRMATION_TIMEOUT,
    },
  },
} as const;

/**
 * Configuration utility class
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentEnvironment: EnvironmentConfig;
  private currentNetwork?: NetworkConfig;

  private constructor() {
    // Default to production config
    this.currentEnvironment = ENVIRONMENT_CONFIGS.production;
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Sets the environment configuration
   */
  setEnvironment(environment: keyof typeof ENVIRONMENT_CONFIGS): void {
    this.currentEnvironment = ENVIRONMENT_CONFIGS[environment];
  }

  /**
   * Sets the network configuration
   */
  setNetwork(chainId: number): void {
    const networkConfig = NETWORK_CONFIGS[chainId];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for chain ID: ${chainId}`);
    }
    this.currentNetwork = networkConfig;
  }

  /**
   * Gets the current environment configuration
   */
  getEnvironment(): EnvironmentConfig {
    return this.currentEnvironment;
  }

  /**
   * Gets the current network configuration
   */
  getNetwork(): NetworkConfig | undefined {
    return this.currentNetwork;
  }

  /**
   * Gets gas limits for a specific operation
   */
  getGasLimits(operation: keyof typeof DEFAULT_GAS_LIMITS): GasLimits {
    const baseLimits = DEFAULT_GAS_LIMITS[operation];
    const multiplier = this.currentNetwork?.gasMultipliers?.limit || 1;

    return {
      callGasLimit: (BigInt(baseLimits.callGasLimit) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
      verificationGasLimit: (BigInt(baseLimits.verificationGasLimit) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
      preVerificationGas: (BigInt(baseLimits.preVerificationGas) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
    };
  }

  /**
   * Gets adjusted gas fees based on network configuration
   */
  getGasFees(baseFees?: GasFees): GasFees {
    const fees = baseFees || DEFAULT_GAS_FEES;
    const multiplier = this.currentNetwork?.gasMultipliers?.fee || 1;

    return {
      maxFeePerGas: (BigInt(fees.maxFeePerGas) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
      maxPriorityFeePerGas: (BigInt(fees.maxPriorityFeePerGas) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
    };
  }

  /**
   * Gets retry configuration based on environment
   */
  getRetryConfig(): RetryConfig {
    const baseConfig = DEFAULT_RETRY_CONFIG;
    const envConfig = this.currentEnvironment;

    return {
      ...baseConfig,
      initialDelay: envConfig.timeouts.retry,
      maxDelay: Math.max(envConfig.timeouts.retry * 10, baseConfig.maxDelay),
    };
  }

  /**
   * Validates a configuration object
   */
  validateConfig(config: Partial<EnvironmentConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.rateLimits) {
      if (config.rateLimits.requestsPerSecond <= 0) {
        errors.push('requestsPerSecond must be positive');
      }
      if (config.rateLimits.burstSize <= 0) {
        errors.push('burstSize must be positive');
      }
    }

    if (config.cache) {
      if (config.cache.ttl <= 0) {
        errors.push('cache TTL must be positive');
      }
      if (config.cache.maxSize <= 0) {
        errors.push('cache maxSize must be positive');
      }
    }

    if (config.timeouts) {
      if (config.timeouts.default <= 0) {
        errors.push('default timeout must be positive');
      }
      if (config.timeouts.retry <= 0) {
        errors.push('retry timeout must be positive');
      }
      if (config.timeouts.confirmation <= 0) {
        errors.push('confirmation timeout must be positive');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Utility functions for working with constants
 */
export class ConstantUtils {
  /**
   * Calculates gas cost for adding members to a pool
   */
  static calculateAddMembersGas(memberCount: number): GasLimits {
    const baseGas = DEFAULT_GAS_LIMITS.ADD_MEMBER;
    const additionalGasPerMember = 30000; // Estimated additional gas per member

    const totalCallGas = BigInt(baseGas.callGasLimit) + BigInt(additionalGasPerMember * (memberCount - 1));

    return {
      callGasLimit: totalCallGas.toString(),
      verificationGasLimit: baseGas.verificationGasLimit,
      preVerificationGas: baseGas.preVerificationGas,
    };
  }

  /**
   * Validates that a joining fee is within acceptable bounds
   */
  static isValidJoiningFee(joiningFee: BigNumberish): boolean {
    try {
      const fee = BigInt(joiningFee.toString());
      const min = BigInt(SDK_CONSTANTS.MIN_JOINING_FEE);
      const max = BigInt(SDK_CONSTANTS.MAX_JOINING_FEE);
      return fee >= min && fee <= max;
    } catch {
      return false;
    }
  }

  /**
   * Validates that a tree depth is supported
   */
  static isValidTreeDepth(depth: number): boolean {
    return Number.isInteger(depth) && depth >= 1 && depth <= 32;
  }

  /**
   * Checks if a value is within the BN254 scalar field
   */
  static isValidScalarField(value: BigNumberish): boolean {
    try {
      const val = BigInt(value.toString());
      const max = BigInt(SDK_CONSTANTS.BN254_SCALAR_FIELD);
      return val < max;
    } catch {
      return false;
    }
  }

  /**
   * Formats gas values for display
   */
  static formatGas(gas: BigNumberish): string {
    try {
      const gasValue = BigInt(gas.toString());
      if (gasValue >= BigInt(1000000)) {
        return `${(Number(gasValue) / 1000000).toFixed(2)}M`;
      } else if (gasValue >= BigInt(1000)) {
        return `${(Number(gasValue) / 1000).toFixed(2)}K`;
      } else {
        return gasValue.toString();
      }
    } catch {
      return 'Invalid';
    }
  }

  /**
   * Formats fee values for display (converts wei to gwei)
   */
  static formatFee(fee: BigNumberish): string {
    try {
      const feeValue = BigInt(fee.toString());
      const gwei = Number(feeValue) / 1e9;
      return `${gwei.toFixed(2)} gwei`;
    } catch {
      return 'Invalid';
    }
  }

  /**
   * Gets the current timestamp in seconds
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Creates a delay for the specified milliseconds
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Creates a configuration manager instance
 */
export function createConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Gets default configuration for the specified environment
 */
export function getDefaultConfig(environment: keyof typeof ENVIRONMENT_CONFIGS): EnvironmentConfig {
  return ENVIRONMENT_CONFIGS[environment];
}

/**
 * Gets network configuration for the specified chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIGS[chainId];
}

// Export all constants and utilities
export {
  SDK_CONSTANTS,
  DEFAULT_GAS_LIMITS,
  DEFAULT_GAS_FEES,
  DEFAULT_RETRY_CONFIG,
  NETWORK_CONFIGS,
  ENVIRONMENT_CONFIGS,
  ConfigManager,
  ConstantUtils,
};

export type {
  NetworkConfig,
  EnvironmentConfig,
};