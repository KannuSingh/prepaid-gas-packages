/**
 * @fileoverview Error Handling Utilities
 *
 * Comprehensive error handling system for Private Prepaid Gas paymaster operations.
 * Includes custom error classes, error recovery strategies, and detailed error reporting.
 */

import { type Address, type HexString, type PaymasterError, type ValidationError as IValidationError } from '@private-prepaid-gas/types';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for better classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  CONTRACT = 'contract',
  ENCODING = 'encoding',
  AUTHENTICATION = 'authentication',
  CONFIGURATION = 'configuration',
  RATE_LIMIT = 'rate_limit',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  USER_OPERATION = 'user_operation',
  PROOF = 'proof',
  POOL = 'pool',
  UNKNOWN = 'unknown',
}

/**
 * Detailed error information
 */
export interface ErrorDetails {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Human-readable error message */
  readonly message: string;
  /** Error category */
  readonly category: ErrorCategory;
  /** Error severity level */
  readonly severity: ErrorSeverity;
  /** Additional context data */
  readonly context?: Record<string, any>;
  /** Timestamp when error occurred */
  readonly timestamp: Date;
  /** Suggested recovery actions */
  readonly recoveryActions?: readonly string[];
  /** Whether the operation can be retried */
  readonly retryable: boolean;
}

/**
 * Base error class for all Private Prepaid Gas errors
 */
export abstract class PrepaidGasError extends Error {
  public readonly details: ErrorDetails;

  constructor(details: Omit<ErrorDetails, 'timestamp'>) {
    super(details.message);
    this.name = this.constructor.name;
    this.details = {
      ...details,
      timestamp: new Date(),
    };

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a JSON representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      details: this.details,
    };
  }

  /**
   * Returns whether this error can be retried
   */
  isRetryable(): boolean {
    return this.details.retryable;
  }

  /**
   * Returns the error category
   */
  getCategory(): ErrorCategory {
    return this.details.category;
  }

  /**
   * Returns the error severity
   */
  getSeverity(): ErrorSeverity {
    return this.details.severity;
  }
}

/**
 * Validation errors for invalid inputs or configurations
 */
export class ValidationError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>, recoveryActions?: readonly string[]) {
    super({
      code,
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context,
      recoveryActions,
      retryable: false,
    });
  }

  /**
   * Creates a validation error from validation result errors
   */
  static fromValidationErrors(errors: readonly IValidationError[]): ValidationError {
    const messages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    const codes = errors.map((e) => e.code).join(', ');

    return new ValidationError(
      `Validation failed: ${messages}`,
      `VALIDATION_FAILED: ${codes}`,
      { validationErrors: errors },
      ['Check input parameters', 'Verify data format', 'Consult API documentation']
    );
  }
}

/**
 * Network-related errors (timeouts, connection issues, etc.)
 */
export class NetworkError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      context,
      recoveryActions: [
        'Check network connectivity',
        'Verify RPC endpoint is accessible',
        'Retry operation after a delay',
      ],
      retryable: true,
    });
  }
}

/**
 * Smart contract interaction errors
 */
export class ContractError extends PrepaidGasError {
  constructor(message: string, code: string, contractAddress?: Address, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.CONTRACT,
      severity: ErrorSeverity.HIGH,
      context: {
        ...context,
        contractAddress,
      },
      recoveryActions: [
        'Verify contract address is correct',
        'Check if contract is deployed on this network',
        'Ensure sufficient gas for transaction',
      ],
      retryable: false,
    });
  }

  /**
   * Creates a contract error from a paymaster error code
   */
  static fromPaymasterError(
    paymasterError: PaymasterError,
    contractAddress?: Address,
    context?: Record<string, any>
  ): ContractError {
    const errorMessages: Record<PaymasterError, string> = {
      IncorrectJoiningFee: 'The provided joining fee does not match the pool requirements',
      InsufficientDeposits: 'Pool has insufficient deposits to sponsor this operation',
      InsufficientPaymasterFund: 'Paymaster has insufficient funds',
      InvalidConfigFormat: 'Paymaster configuration format is invalid',
      InvalidDataLength: 'Paymaster data length is invalid',
      InvalidEntryPoint: 'Entry point address is invalid',
      InvalidJoiningFee: 'Joining fee value is invalid',
      InvalidMerkleRootIndex: 'Merkle root index is invalid',
      InvalidMerkleTreeRoot: 'Merkle tree root is invalid',
      InvalidMode: 'Paymaster mode is invalid',
      InvalidPaymasterData: 'Paymaster data is invalid',
      InvalidProofMessage: 'Proof message is invalid',
      InvalidProofScope: 'Proof scope is invalid',
      InvalidStubContextLength: 'Stub context length is invalid',
      InvalidVerifierAddress: 'Verifier address is invalid',
      LeafAlreadyExists: 'Identity commitment already exists in the pool',
      LeafCannotBeZero: 'Identity commitment cannot be zero',
      LeafDoesNotExist: 'Identity commitment does not exist in the pool',
      LeafGreaterThanSnarkScalarField: 'Identity commitment exceeds SNARK scalar field',
      MerkleRootNotInHistory: 'Merkle root is not in the pool history',
      MerkleTreeDepthUnsupported: 'Merkle tree depth is not supported',
      NullifierAlreadyUsed: 'Nullifier has already been used',
      PoolAlreadyExists: 'Pool with this ID already exists',
      PoolDoesNotExist: 'Pool with this ID does not exist',
      PoolHasNoMembers: 'Pool has no members',
      ProofVerificationFailed: 'Zero-knowledge proof verification failed',
      UnauthorizedCaller: 'Caller is not authorized for this operation',
      UserExceededGasFund: 'User operation exceeds available gas funding',
      WithdrawalNotAllowed: 'Withdrawal is not allowed at this time',
    };

    const message = errorMessages[paymasterError] || `Unknown paymaster error: ${paymasterError}`;

    return new ContractError(message, `PAYMASTER_${paymasterError.toUpperCase()}`, contractAddress, context);
  }
}

/**
 * Encoding/decoding errors
 */
export class EncodingError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.ENCODING,
      severity: ErrorSeverity.LOW,
      context,
      recoveryActions: ['Verify input data format', 'Check data length requirements', 'Ensure proper hex encoding'],
      retryable: false,
    });
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      context,
      recoveryActions: ['Verify wallet connection', 'Check account permissions', 'Ensure proper signing credentials'],
      retryable: false,
    });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.HIGH,
      context,
      recoveryActions: [
        'Check configuration parameters',
        'Verify contract addresses',
        'Ensure proper network settings',
      ],
      retryable: false,
    });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends PrepaidGasError {
  constructor(message: string, code: string, retryAfter?: number, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      context: {
        ...context,
        retryAfter,
      },
      recoveryActions: [
        `Wait ${retryAfter ? `${retryAfter} seconds` : 'a moment'} before retrying`,
        'Reduce request frequency',
        'Consider implementing request queuing',
      ],
      retryable: true,
    });
  }
}

/**
 * Insufficient funds errors
 */
export class InsufficientFundsError extends PrepaidGasError {
  constructor(message: string, code: string, required?: bigint, available?: bigint, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.INSUFFICIENT_FUNDS,
      severity: ErrorSeverity.HIGH,
      context: {
        ...context,
        required: required?.toString(),
        available: available?.toString(),
      },
      recoveryActions: ['Add funds to account', 'Reduce operation amount', 'Check token balances'],
      retryable: false,
    });
  }
}

/**
 * User operation specific errors
 */
export class UserOperationError extends PrepaidGasError {
  constructor(message: string, code: string, userOpHash?: HexString, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.USER_OPERATION,
      severity: ErrorSeverity.MEDIUM,
      context: {
        ...context,
        userOpHash,
      },
      recoveryActions: ['Review user operation parameters', 'Check gas limits and fees', 'Verify paymaster data'],
      retryable: false,
    });
  }
}

/**
 * Proof generation and verification errors
 */
export class ProofError extends PrepaidGasError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.PROOF,
      severity: ErrorSeverity.HIGH,
      context,
      recoveryActions: [
        'Verify proof parameters',
        'Check identity commitment is in pool',
        'Ensure nullifier is unique',
      ],
      retryable: false,
    });
  }
}

/**
 * Pool management errors
 */
export class PoolError extends PrepaidGasError {
  constructor(message: string, code: string, poolId?: HexString, context?: Record<string, any>) {
    super({
      code,
      message,
      category: ErrorCategory.POOL,
      severity: ErrorSeverity.MEDIUM,
      context: {
        ...context,
        poolId,
      },
      recoveryActions: ['Verify pool exists', 'Check pool configuration', 'Ensure sufficient pool deposits'],
      retryable: false,
    });
  }
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  /** Name of the recovery strategy */
  readonly name: string;
  /** Function that attempts to recover from the error */
  readonly recover: (error: PrepaidGasError, context?: any) => Promise<boolean>;
  /** Whether this strategy can handle the given error */
  readonly canHandle: (error: PrepaidGasError) => boolean;
  /** Maximum number of recovery attempts */
  readonly maxAttempts?: number;
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private readonly strategies: readonly RecoveryStrategy[] = [];

  constructor(strategies: readonly RecoveryStrategy[] = []) {
    this.strategies = [...strategies, ...this.createDefaultStrategies()];
  }

  /**
   * Attempts to recover from an error using available strategies
   *
   * @param error - The error to recover from
   * @param context - Additional context for recovery
   * @returns Whether recovery was successful
   */
  async attemptRecovery(error: PrepaidGasError, context?: any): Promise<boolean> {
    // Only attempt recovery for retryable errors
    if (!error.isRetryable()) {
      return false;
    }

    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const recovered = await strategy.recover(error, context);
          if (recovered) {
            return true;
          }
        } catch (recoveryError) {
          // Recovery strategy failed, continue to next strategy
          console.warn(`Recovery strategy '${strategy.name}' failed:`, recoveryError);
        }
      }
    }

    return false;
  }

  /**
   * Creates default recovery strategies
   */
  private createDefaultStrategies(): readonly RecoveryStrategy[] {
    return [
      {
        name: 'network_retry',
        canHandle: (error) => error.getCategory() === ErrorCategory.NETWORK,
        recover: async (_error) => {
          // Simple retry after delay for network errors
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true; // Indicates recovery was attempted
        },
        maxAttempts: 3,
      },
      {
        name: 'rate_limit_backoff',
        canHandle: (error) => error.getCategory() === ErrorCategory.RATE_LIMIT,
        recover: async (_error) => {
          const retryAfter = (_error.details.context?.retryAfter as number) || 5;
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return true;
        },
        maxAttempts: 1,
      },
    ];
  }
}

/**
 * Error aggregator for collecting multiple errors
 */
export class ErrorAggregator {
  private readonly errors: PrepaidGasError[] = [];

  /**
   * Adds an error to the aggregator
   */
  add(error: PrepaidGasError): void {
    this.errors.push(error);
  }

  /**
   * Creates an error from a generic Error object
   */
  addGeneric(error: Error, category: ErrorCategory = ErrorCategory.UNKNOWN): void {
    const prepaidGasError = new (class extends PrepaidGasError {})({
      code: 'GENERIC_ERROR',
      message: error.message,
      category,
      severity: ErrorSeverity.MEDIUM,
      context: {
        originalError: error.name,
        stack: error.stack,
      },
      retryable: false,
    });

    this.add(prepaidGasError);
  }

  /**
   * Returns whether there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Returns all collected errors
   */
  getErrors(): readonly PrepaidGasError[] {
    return [...this.errors];
  }

  /**
   * Returns errors by category
   */
  getErrorsByCategory(category: ErrorCategory): readonly PrepaidGasError[] {
    return this.errors.filter((error) => error.getCategory() === category);
  }

  /**
   * Returns errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): readonly PrepaidGasError[] {
    return this.errors.filter((error) => error.getSeverity() === severity);
  }

  /**
   * Clears all errors
   */
  clear(): void {
    this.errors.length = 0;
  }

  /**
   * Creates a summary error from all collected errors
   */
  createSummaryError(): PrepaidGasError | null {
    if (this.errors.length === 0) {
      return null;
    }

    if (this.errors.length === 1) {
      return this.errors[0];
    }

    const highestSeverity = this.getHighestSeverity();
    const categories = [...new Set(this.errors.map((e) => e.getCategory()))];
    const messages = this.errors.map((e) => e.message);

    return new (class extends PrepaidGasError {})({
      code: 'MULTIPLE_ERRORS',
      message: `Multiple errors occurred: ${messages.join('; ')}`,
      category: categories.length === 1 ? categories[0] : ErrorCategory.UNKNOWN,
      severity: highestSeverity,
      context: {
        errorCount: this.errors.length,
        categories,
        individualErrors: this.errors.map((e) => e.toJSON()),
      },
      retryable: this.errors.some((e) => e.isRetryable()),
    });
  }

  /**
   * Gets the highest severity among all errors
   */
  private getHighestSeverity(): ErrorSeverity {
    const severityOrder = [ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];

    let highest = ErrorSeverity.LOW;
    for (const error of this.errors) {
      const severity = error.getSeverity();
      if (severityOrder.indexOf(severity) > severityOrder.indexOf(highest)) {
        highest = severity;
      }
    }

    return highest;
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Checks if an error is a specific type of PrepaidGasError
   */
  static isErrorType<T extends PrepaidGasError>(error: any, errorClass: new (...args: any[]) => T): error is T {
    return error instanceof errorClass;
  }

  /**
   * Extracts error details from any error object
   */
  static extractErrorDetails(error: any): Partial<ErrorDetails> {
    if (error instanceof PrepaidGasError) {
      return error.details;
    }

    if (error instanceof Error) {
      return {
        code: 'GENERIC_ERROR',
        message: error.message,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.LOW,
      retryable: false,
    };
  }

  /**
   * Creates a PrepaidGasError from any error object
   */
  static fromGenericError(error: any, category?: ErrorCategory): PrepaidGasError {
    if (error instanceof PrepaidGasError) {
      return error;
    }

    const details = this.extractErrorDetails(error);

    return new (class extends PrepaidGasError {})({
      code: details.code || 'UNKNOWN_ERROR',
      message: details.message || 'An unknown error occurred',
      category: category || details.category || ErrorCategory.UNKNOWN,
      severity: details.severity || ErrorSeverity.MEDIUM,
      retryable: details.retryable || false,
      context: { originalError: error },
    });
  }
}

// Export all error classes and utilities
export { ValidationError as PrepaidGasValidationError };
