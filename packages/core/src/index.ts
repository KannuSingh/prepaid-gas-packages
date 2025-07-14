/**
 * @fileoverview Private Prepaid Gas Core SDK
 * 
 * The main entry point for the Private Prepaid Gas Core SDK.
 * This package provides comprehensive tools for interacting with Private Prepaid Gas paymaster contracts,
 * including client creation, data encoding/validation, and error handling.
 * 
 * @version 1.0.0
 * @author Private Prepaid Gas Team
 * @license MIT
 */

// ===========================
// Client Components
// ===========================

export {
  PrepaidGasPaymaster,
  createPrepaidGasPaymaster,
  type PrepaidGasPaymasterClientConfig,
  type CreatePoolParams,
  type AddMemberParams,
  type AddMembersParams,
  type ValidateUserOpParams,
  type GasEstimationResult,
  type EventFilterOptions,
} from './client/PrepaidGasPaymaster';

// ===========================
// Encoding Utilities
// ===========================

export {
  PaymasterDataEncoder,
  UserOperationEncoder,
  EncodingUtils,
  createPaymasterDataEncoder,
  createUserOperationEncoder,
  type EncodingResult,
  type DecodingResult,
} from './utils/encoding';

// ===========================
// Validation Utilities
// ===========================

export {
  UserOperationValidator,
  ProofValidator,
  PaymasterDataValidator,
  PoolValidator,
  createUserOperationValidator,
  createProofValidator,
  createPaymasterDataValidator,
  createPoolValidator,
  validateUserOperation,
  validateProof,
  validatePaymasterData,
  validatePool,
  type ValidationRule,
  type ValidationContext,
  type DetailedValidationResult,
} from './utils/validation';

// ===========================
// Error Handling
// ===========================

export {
  PrepaidGasError,
  PrepaidGasValidationError,
  NetworkError,
  ContractError,
  EncodingError,
  AuthenticationError,
  ConfigurationError,
  RateLimitError,
  InsufficientFundsError,
  UserOperationError,
  ProofError,
  PoolError,
  ErrorRecoveryManager,
  ErrorAggregator,
  ErrorUtils,
  ErrorSeverity,
  ErrorCategory,
  type ErrorDetails,
  type RecoveryStrategy,
} from './utils/errors';

// ===========================
// Constants and Configuration
// ===========================

export {
  SDK_CONSTANTS,
  DEFAULT_GAS_LIMITS,
  DEFAULT_GAS_FEES,
  DEFAULT_RETRY_CONFIG,
  NETWORK_CONFIGS,
  ENVIRONMENT_CONFIGS,
  ConfigManager,
  ConstantUtils,
  createConfigManager,
  getDefaultConfig,
  getNetworkConfig,
  type NetworkConfig,
  type EnvironmentConfig,
} from './constants';

// ===========================
// Re-export Important Types
// ===========================

// Re-export commonly used types from the types package for convenience
export type {
  // Common types
  Address,
  HexString,
  BigNumberish,
  Hash,
  TransactionHash,
  Result,
  AsyncResult,
  Logger,
  RetryConfig,
  
  // Paymaster types
  PackedUserOperation,
  PoolMembershipProof,
  PaymasterValidationData,
  PaymasterContext,
  PaymasterData,
  PoolInfo,
  MerkleRootInfo,
  PaymasterMode,
  PostOpMode,
  
  // Event types
  MemberAddedEvent,
  MembersAddedEvent,
  PoolCreatedEvent,
  UserOpSponsoredEvent,
  RevenueWithdrawnEvent,
  
  // Gas and fee types
  GasLimits,
  GasFees,
  
  // Error types
  PaymasterError,
  ValidationError,
  ValidationResult,
} from '@private-prepaid-gas/types';

// Re-export contract artifacts for convenience
export type {
  GasLimitedPaymaster,
  OneTimeUsePaymaster,
} from '@private-prepaid-gas/contracts';

export {
  GAS_LIMITED_PAYMASTER_ABI,
  ONE_TIME_USE_PAYMASTER_ABI,
} from '@private-prepaid-gas/contracts';

// ===========================
// Package Information
// ===========================

/** Package version */
export const VERSION = '1.0.0';

/** Package name */
export const PACKAGE_NAME = '@private-prepaid-gas/core';

/** Supported contract versions */
export const SUPPORTED_CONTRACT_VERSIONS = ['1.0.0'] as const;

/** Minimum required Node.js version */
export const MIN_NODE_VERSION = '18.0.0';

/**
 * Package metadata and feature information
 */
export const PACKAGE_INFO = {
  name: PACKAGE_NAME,
  version: VERSION,
  description: 'Core SDK for Private Prepaid Gas paymaster integration',
  features: [
    'Complete paymaster client implementation',
    'Data encoding and validation utilities',
    'Comprehensive error handling',
    'TypeScript support with full type safety',
    'Multiple network support',
    'Flexible configuration management',
    'Built-in retry mechanisms',
    'Event monitoring and filtering',
  ],
  supportedNetworks: [
    'Base Sepolia (testnet)',
    // Additional networks as they are added
  ],
  dependencies: {
    viem: '^2.31.3',
    '@semaphore-protocol/core': '^4.11.1',
  },
} as const;

// ===========================
// Utility Functions
// ===========================

/**
 * Creates a complete SDK instance with all necessary components
 * 
 * @param config - Configuration for the SDK
 * @returns Object containing all SDK components
 * 
 * @example
 * ```typescript
 * import { createSDK } from '@private-prepaid-gas/core';
 * 
 * const sdk = createSDK({
 *   chain: baseSepolia,
 *   transport: http('https://sepolia.base.org'),
 *   gasLimitedPaymasterAddress: '0x...',
 *   oneTimeUsePaymasterAddress: '0x...',
 * });
 * 
 * // Use the SDK components
 * const pool = await sdk.client.createPool({ joiningFee: '1000000', paymasterType: 'gas-limited' });
 * const validation = sdk.validators.userOperation.validate(userOp);
 * ```
 */
export function createSDK(config: PrepaidGasPaymasterClientConfig) {
  // Initialize configuration manager
  const configManager = createConfigManager();
  if (config.chain?.id) {
    try {
      configManager.setNetwork(config.chain.id);
    } catch {
      // Network config not found, continue with defaults
    }
  }

  // Create client
  const client = createPrepaidGasPaymaster(config);

  // Create validators
  const validators = {
    userOperation: createUserOperationValidator({
      chainId: config.chain?.id,
    }),
    proof: createProofValidator(),
    paymasterData: createPaymasterDataValidator(),
    pool: createPoolValidator(),
  };

  // Create encoders
  const encoders = {
    paymasterData: createPaymasterDataEncoder(),
    userOperation: createUserOperationEncoder(),
  };

  // Create error management
  const errorManager = new ErrorRecoveryManager();
  const errorAggregator = new ErrorAggregator();

  return {
    // Core client
    client,
    
    // Validators
    validators,
    
    // Encoders
    encoders,
    
    // Error handling
    errorManager,
    errorAggregator,
    
    // Configuration
    config: configManager,
    
    // Utility functions
    utils: {
      constants: ConstantUtils,
      errors: ErrorUtils,
    },
    
    // Package info
    version: VERSION,
    packageInfo: PACKAGE_INFO,
  };
}

/**
 * Type for the complete SDK instance
 */
export type SDKInstance = ReturnType<typeof createSDK>;

/**
 * Validates the SDK environment and configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result with any issues found
 */
export function validateSDKEnvironment(config: PrepaidGasPaymasterClientConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Node.js version
  if (typeof process !== 'undefined' && process.version) {
    const nodeVersion = process.version.slice(1); // Remove 'v' prefix
    const [major] = nodeVersion.split('.').map(Number);
    const minMajor = parseInt(MIN_NODE_VERSION.split('.')[0]);
    
    if (major < minMajor) {
      errors.push(`Node.js version ${nodeVersion} is not supported. Minimum required: ${MIN_NODE_VERSION}`);
    }
  }

  // Validate chain configuration
  if (!config.chain) {
    errors.push('Chain configuration is required');
  } else {
    const networkConfig = getNetworkConfig(config.chain.id);
    if (!networkConfig) {
      warnings.push(`Network configuration not found for chain ID ${config.chain.id}. Using defaults.`);
    }
  }

  // Validate contract addresses
  if (!config.gasLimitedPaymasterAddress) {
    errors.push('Gas Limited Paymaster address is required');
  }

  if (!config.oneTimeUsePaymasterAddress) {
    errors.push('One Time Use Paymaster address is required');
  }

  // Validate transport
  if (!config.transport) {
    errors.push('Transport configuration is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets version information for all SDK components
 * 
 * @returns Object containing version information
 */
export function getVersionInfo() {
  return {
    sdk: VERSION,
    package: PACKAGE_NAME,
    supportedContracts: SUPPORTED_CONTRACT_VERSIONS,
    minNodeVersion: MIN_NODE_VERSION,
    buildDate: new Date().toISOString(),
  };
}

// ===========================
// Module Documentation
// ===========================

/**
 * ## Private Prepaid Gas Core SDK
 * 
 * This package provides a comprehensive SDK for interacting with Private Prepaid Gas paymaster contracts.
 * It includes everything needed to build applications that sponsor user operations through privacy-preserving pools.
 * 
 * ### Key Features
 * 
 * - **Complete Paymaster Client**: Full-featured client for all paymaster operations
 * - **Data Encoding/Validation**: Utilities for encoding paymaster data and validating user operations
 * - **Error Handling**: Comprehensive error system with recovery strategies
 * - **Type Safety**: Full TypeScript support with detailed type definitions
 * - **Multi-Network**: Support for multiple blockchain networks
 * - **Configuration Management**: Flexible configuration system for different environments
 * 
 * ### Quick Start
 * 
 * ```typescript
 * import { createSDK } from '@private-prepaid-gas/core';
 * import { http } from 'viem';
 * import { baseSepolia } from 'viem/chains';
 * 
 * const sdk = createSDK({
 *   chain: baseSepolia,
 *   transport: http('https://sepolia.base.org'),
 *   gasLimitedPaymasterAddress: '0x...',
 *   oneTimeUsePaymasterAddress: '0x...',
 * });
 * 
 * // Create a new pool
 * const result = await sdk.client.createPool({
 *   joiningFee: '1000000000000000', // 0.001 ETH
 *   paymasterType: 'gas-limited',
 * });
 * 
 * if (result.success) {
 *   console.log('Pool created:', result.data.poolId);
 * }
 * ```
 * 
 * ### Architecture
 * 
 * The SDK is organized into several key modules:
 * 
 * - **Client**: Main paymaster client for contract interactions
 * - **Encoding**: Utilities for encoding/decoding contract data
 * - **Validation**: Comprehensive validation for all data structures
 * - **Errors**: Detailed error handling with recovery strategies
 * - **Constants**: Configuration and constant values
 * 
 * ### Error Handling
 * 
 * The SDK uses a comprehensive error system that provides:
 * 
 * - Detailed error information with context
 * - Error categorization and severity levels
 * - Automatic retry mechanisms for recoverable errors
 * - Recovery suggestions for common issues
 * 
 * ### Configuration
 * 
 * The SDK supports multiple environments and networks:
 * 
 * - Development: Debug logging, relaxed timeouts
 * - Staging: Balanced configuration for testing
 * - Production: Optimized for performance and reliability
 * 
 * For more information, see the individual module documentation.
 */