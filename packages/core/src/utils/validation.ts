/**
 * @fileoverview Validation Utilities
 * 
 * Comprehensive validation utilities for user operations, proofs, pool configurations,
 * and other paymaster-related data structures.
 */

import {
  type Address,
  type HexString,
  type BigNumberish,
  type PackedUserOperation,
  type PoolMembershipProof,
  type PaymasterData,
  type PaymasterContext,
  type PoolInfo,
  type GasLimits,
  type GasFees,
  type ValidationResult,
  type ValidationError,
  CONSTANTS,
  isAddress,
  isHexString,
  isHash,
} from '@private-prepaid-gas/types';

/**
 * Validation rule configuration
 */
export interface ValidationRule<T> {
  /** Name of the validation rule */
  readonly name: string;
  /** Function that performs the validation */
  readonly validate: (value: T) => ValidationResult;
  /** Whether this rule is required or optional */
  readonly required?: boolean;
  /** Custom error message for this rule */
  readonly message?: string;
}

/**
 * Validation context for more detailed validation
 */
export interface ValidationContext {
  /** Chain ID for chain-specific validations */
  readonly chainId?: number;
  /** Entry point address for user operation validation */
  readonly entryPoint?: Address;
  /** Maximum gas limits allowed */
  readonly maxGasLimits?: GasLimits;
  /** Minimum gas fees required */
  readonly minGasFees?: GasFees;
  /** Whether to perform strict validation */
  readonly strict?: boolean;
}

/**
 * Comprehensive validation result with detailed information
 */
export interface DetailedValidationResult extends ValidationResult {
  /** Validation warnings (non-blocking issues) */
  readonly warnings: readonly ValidationError[];
  /** Performance metrics for the validation */
  readonly metrics?: {
    readonly duration: number;
    readonly rulesExecuted: number;
  };
}

/**
 * User Operation validator with comprehensive checks
 */
export class UserOperationValidator {
  private readonly context: ValidationContext;
  private readonly rules: readonly ValidationRule<PackedUserOperation>[];

  constructor(context: ValidationContext = {}) {
    this.context = context;
    this.rules = this.createDefaultRules();
  }

  /**
   * Validates a packed user operation
   * 
   * @param userOp - The user operation to validate
   * @returns Detailed validation result
   * 
   * @example
   * ```typescript
   * const validator = new UserOperationValidator({ chainId: 84532 });
   * const result = validator.validate(userOp);
   * 
   * if (!result.isValid) {
   *   console.error('Validation errors:', result.errors);
   * }
   * ```
   */
  validate(userOp: PackedUserOperation): DetailedValidationResult {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const ruleResult = rule.validate(userOp);
        if (!ruleResult.isValid) {
          errors.push(...ruleResult.errors);
        }
      } catch (error) {
        errors.push({
          field: 'unknown',
          message: `Validation rule '${rule.name}' failed: ${error}`,
          code: 'RULE_EXECUTION_ERROR',
        });
      }
    }

    // Perform additional context-specific validations
    this.validateContext(userOp, errors, warnings);

    const duration = Date.now() - startTime;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        duration,
        rulesExecuted: this.rules.length,
      },
    };
  }

  /**
   * Validates user operation gas parameters
   * 
   * @param userOp - The user operation to validate
   * @returns Validation result
   */
  validateGasParameters(userOp: PackedUserOperation): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate preVerificationGas
    const preVerificationGas = BigInt(userOp.preVerificationGas);
    if (preVerificationGas < BigInt(21000)) {
      errors.push({
        field: 'preVerificationGas',
        message: 'preVerificationGas must be at least 21000',
        code: 'INSUFFICIENT_PRE_VERIFICATION_GAS',
      });
    }

    // Validate accountGasLimits (packed callGasLimit and verificationGasLimit)
    try {
      const gasLimits = this.unpackGasLimits(userOp.accountGasLimits);
      
      if (gasLimits.callGasLimit < BigInt(1000)) {
        errors.push({
          field: 'accountGasLimits',
          message: 'callGasLimit must be at least 1000',
          code: 'INSUFFICIENT_CALL_GAS_LIMIT',
        });
      }

      if (gasLimits.verificationGasLimit < BigInt(100000)) {
        errors.push({
          field: 'accountGasLimits',
          message: 'verificationGasLimit must be at least 100000',
          code: 'INSUFFICIENT_VERIFICATION_GAS_LIMIT',
        });
      }

      // Check against maximum limits if provided
      if (this.context.maxGasLimits) {
        const maxCallGas = BigInt(this.context.maxGasLimits.callGasLimit);
        const maxVerificationGas = BigInt(this.context.maxGasLimits.verificationGasLimit);

        if (gasLimits.callGasLimit > maxCallGas) {
          errors.push({
            field: 'accountGasLimits',
            message: `callGasLimit exceeds maximum of ${maxCallGas}`,
            code: 'EXCESSIVE_CALL_GAS_LIMIT',
          });
        }

        if (gasLimits.verificationGasLimit > maxVerificationGas) {
          errors.push({
            field: 'accountGasLimits',
            message: `verificationGasLimit exceeds maximum of ${maxVerificationGas}`,
            code: 'EXCESSIVE_VERIFICATION_GAS_LIMIT',
          });
        }
      }
    } catch (error) {
      errors.push({
        field: 'accountGasLimits',
        message: `Failed to unpack gas limits: ${error}`,
        code: 'INVALID_GAS_LIMITS_FORMAT',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates user operation fee parameters
   * 
   * @param userOp - The user operation to validate
   * @returns Validation result
   */
  validateFeeParameters(userOp: PackedUserOperation): ValidationResult {
    const errors: ValidationError[] = [];

    try {
      const gasFees = this.unpackGasFees(userOp.gasFees);

      // Validate maxFeePerGas > 0
      if (gasFees.maxFeePerGas <= BigInt(0)) {
        errors.push({
          field: 'gasFees',
          message: 'maxFeePerGas must be greater than 0',
          code: 'INVALID_MAX_FEE_PER_GAS',
        });
      }

      // Validate maxPriorityFeePerGas <= maxFeePerGas
      if (gasFees.maxPriorityFeePerGas > gasFees.maxFeePerGas) {
        errors.push({
          field: 'gasFees',
          message: 'maxPriorityFeePerGas must not exceed maxFeePerGas',
          code: 'INVALID_PRIORITY_FEE',
        });
      }

      // Check against minimum fees if provided
      if (this.context.minGasFees) {
        const minMaxFee = BigInt(this.context.minGasFees.maxFeePerGas);
        const minPriorityFee = BigInt(this.context.minGasFees.maxPriorityFeePerGas);

        if (gasFees.maxFeePerGas < minMaxFee) {
          errors.push({
            field: 'gasFees',
            message: `maxFeePerGas below minimum of ${minMaxFee}`,
            code: 'INSUFFICIENT_MAX_FEE_PER_GAS',
          });
        }

        if (gasFees.maxPriorityFeePerGas < minPriorityFee) {
          errors.push({
            field: 'gasFees',
            message: `maxPriorityFeePerGas below minimum of ${minPriorityFee}`,
            code: 'INSUFFICIENT_PRIORITY_FEE',
          });
        }
      }
    } catch (error) {
      errors.push({
        field: 'gasFees',
        message: `Failed to unpack gas fees: ${error}`,
        code: 'INVALID_GAS_FEES_FORMAT',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates paymaster and data field
   * 
   * @param userOp - The user operation to validate
   * @returns Validation result
   */
  validatePaymasterData(userOp: PackedUserOperation): ValidationResult {
    const errors: ValidationError[] = [];

    // If paymasterAndData is not empty, validate it
    if (userOp.paymasterAndData !== '0x') {
      if (!isHexString(userOp.paymasterAndData)) {
        errors.push({
          field: 'paymasterAndData',
          message: 'paymasterAndData must be a valid hex string',
          code: 'INVALID_PAYMASTER_DATA_FORMAT',
        });
      } else {
        // Check minimum length (20 bytes for paymaster address)
        const dataLength = (userOp.paymasterAndData.length - 2) / 2;
        if (dataLength < 20) {
          errors.push({
            field: 'paymasterAndData',
            message: 'paymasterAndData must include at least paymaster address (20 bytes)',
            code: 'INSUFFICIENT_PAYMASTER_DATA_LENGTH',
          });
        }

        // For Private Prepaid Gas, validate the full data structure
        if (dataLength === CONSTANTS.PAYMASTER_DATA_SIZE + 20) { // 20 bytes address + data
          try {
            const paymasterAddress = userOp.paymasterAndData.slice(0, 42); // 0x + 40 chars
            const paymasterData = userOp.paymasterAndData.slice(42) as HexString;

            if (!isAddress(paymasterAddress)) {
              errors.push({
                field: 'paymasterAndData',
                message: 'Invalid paymaster address in paymasterAndData',
                code: 'INVALID_PAYMASTER_ADDRESS',
              });
            }

            // Validate the paymaster data structure
            const dataValidator = new PaymasterDataValidator();
            const dataResult = dataValidator.validateEncoded(`0x${paymasterData}`);
            if (!dataResult.isValid) {
              errors.push(...dataResult.errors.map(e => ({
                ...e,
                field: 'paymasterAndData',
                code: `PAYMASTER_DATA_${e.code}`,
              })));
            }
          } catch (error) {
            errors.push({
              field: 'paymasterAndData',
              message: `Failed to validate paymaster data: ${error}`,
              code: 'PAYMASTER_DATA_VALIDATION_ERROR',
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates default validation rules for user operations
   */
  private createDefaultRules(): readonly ValidationRule<PackedUserOperation>[] {
    return [
      {
        name: 'sender_validation',
        validate: (userOp) => ({
          isValid: isAddress(userOp.sender),
          errors: isAddress(userOp.sender) ? [] : [{
            field: 'sender',
            message: 'sender must be a valid Ethereum address',
            code: 'INVALID_SENDER_ADDRESS',
          }],
        }),
        required: true,
      },
      {
        name: 'nonce_validation',
        validate: (userOp) => {
          try {
            const nonce = BigInt(userOp.nonce);
            return {
              isValid: nonce >= BigInt(0),
              errors: nonce >= BigInt(0) ? [] : [{
                field: 'nonce',
                message: 'nonce must be a non-negative number',
                code: 'INVALID_NONCE',
              }],
            };
          } catch {
            return {
              isValid: false,
              errors: [{
                field: 'nonce',
                message: 'nonce must be a valid number',
                code: 'INVALID_NONCE_FORMAT',
              }],
            };
          }
        },
        required: true,
      },
      {
        name: 'hex_fields_validation',
        validate: (userOp) => {
          const errors: ValidationError[] = [];
          const hexFields = [
            'initCode', 'callData', 'accountGasLimits', 
            'gasFees', 'paymasterAndData', 'signature'
          ] as const;

          for (const field of hexFields) {
            if (!isHexString(userOp[field])) {
              errors.push({
                field,
                message: `${field} must be a valid hex string`,
                code: 'INVALID_HEX_STRING',
              });
            }
          }

          return {
            isValid: errors.length === 0,
            errors,
          };
        },
        required: true,
      },
      {
        name: 'gas_parameters_validation',
        validate: (userOp) => this.validateGasParameters(userOp),
        required: true,
      },
      {
        name: 'fee_parameters_validation',
        validate: (userOp) => this.validateFeeParameters(userOp),
        required: true,
      },
      {
        name: 'paymaster_data_validation',
        validate: (userOp) => this.validatePaymasterData(userOp),
        required: false,
      },
    ];
  }

  /**
   * Performs context-specific validations
   */
  private validateContext(
    userOp: PackedUserOperation, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Chain-specific validations
    if (this.context.chainId) {
      // Add chain-specific validation logic here
      // For example, different chains might have different gas requirements
    }

    // Entry point specific validations
    if (this.context.entryPoint) {
      // Validate against specific entry point requirements
    }

    // Strict mode validations
    if (this.context.strict) {
      // Perform additional strict validations
      this.performStrictValidations(userOp, warnings);
    }
  }

  /**
   * Performs strict mode validations that generate warnings
   */
  private performStrictValidations(userOp: PackedUserOperation, warnings: ValidationError[]): void {
    // Check for potentially inefficient operations
    if (userOp.callData.length > 10000) { // Arbitrary large calldata threshold
      warnings.push({
        field: 'callData',
        message: 'Large callData may result in high gas costs',
        code: 'LARGE_CALLDATA_WARNING',
      });
    }

    // Check for missing signature in non-simulation contexts
    if (userOp.signature === '0x') {
      warnings.push({
        field: 'signature',
        message: 'Empty signature - ensure this is intentional for simulation',
        code: 'EMPTY_SIGNATURE_WARNING',
      });
    }
  }

  /**
   * Unpacks gas limits from accountGasLimits field
   */
  private unpackGasLimits(accountGasLimits: HexString): { callGasLimit: bigint; verificationGasLimit: bigint } {
    // accountGasLimits is packed as: verificationGasLimit (16 bytes) || callGasLimit (16 bytes)
    const data = accountGasLimits.slice(2); // Remove 0x
    if (data.length !== 64) {
      throw new Error('accountGasLimits must be exactly 32 bytes');
    }

    const verificationGasLimit = BigInt('0x' + data.slice(0, 32));
    const callGasLimit = BigInt('0x' + data.slice(32, 64));

    return { callGasLimit, verificationGasLimit };
  }

  /**
   * Unpacks gas fees from gasFees field
   */
  private unpackGasFees(gasFees: HexString): { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } {
    // gasFees is packed as: maxPriorityFeePerGas (16 bytes) || maxFeePerGas (16 bytes)
    const data = gasFees.slice(2); // Remove 0x
    if (data.length !== 64) {
      throw new Error('gasFees must be exactly 32 bytes');
    }

    const maxPriorityFeePerGas = BigInt('0x' + data.slice(0, 32));
    const maxFeePerGas = BigInt('0x' + data.slice(32, 64));

    return { maxFeePerGas, maxPriorityFeePerGas };
  }
}

/**
 * Pool membership proof validator
 */
export class ProofValidator {
  /**
   * Validates a pool membership proof structure
   * 
   * @param proof - The proof to validate
   * @returns Detailed validation result
   */
  validate(proof: PoolMembershipProof): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate merkle tree depth
    const depth = parseInt(proof.merkleTreeDepth);
    if (isNaN(depth) || depth < 1 || depth > 32) {
      errors.push({
        field: 'merkleTreeDepth',
        message: 'merkleTreeDepth must be between 1 and 32',
        code: 'INVALID_MERKLE_TREE_DEPTH',
      });
    }

    // Validate merkle tree root
    if (!isHash(proof.merkleTreeRoot)) {
      errors.push({
        field: 'merkleTreeRoot',
        message: 'merkleTreeRoot must be a valid 32-byte hash',
        code: 'INVALID_MERKLE_TREE_ROOT',
      });
    }

    // Validate nullifier
    if (!isHash(proof.nullifier)) {
      errors.push({
        field: 'nullifier',
        message: 'nullifier must be a valid 32-byte hash',
        code: 'INVALID_NULLIFIER',
      });
    }

    // Validate message
    if (!isHash(proof.message)) {
      errors.push({
        field: 'message',
        message: 'message must be a valid 32-byte hash',
        code: 'INVALID_MESSAGE',
      });
    }

    // Validate scope
    if (!isHash(proof.scope)) {
      errors.push({
        field: 'scope',
        message: 'scope must be a valid 32-byte hash',
        code: 'INVALID_SCOPE',
      });
    }

    // Validate points array
    if (!Array.isArray(proof.points) || proof.points.length !== 8) {
      errors.push({
        field: 'points',
        message: 'points must be an array of exactly 8 elements',
        code: 'INVALID_POINTS_ARRAY_LENGTH',
      });
    } else {
      // Validate each point
      proof.points.forEach((point, index) => {
        try {
          const pointValue = BigInt(point);
          // Check if point is within the BN254 scalar field
          const BN254_SCALAR_FIELD = BigInt('0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001');
          if (pointValue >= BN254_SCALAR_FIELD) {
            errors.push({
              field: 'points',
              message: `Point ${index} exceeds BN254 scalar field`,
              code: 'POINT_EXCEEDS_SCALAR_FIELD',
            });
          }
        } catch {
          errors.push({
            field: 'points',
            message: `Point ${index} is not a valid number`,
            code: 'INVALID_POINT_FORMAT',
          });
        }
      });
    }

    // Check for zero nullifier (warning)
    if (proof.nullifier === '0x' + '0'.repeat(64)) {
      warnings.push({
        field: 'nullifier',
        message: 'Nullifier is zero - ensure this is intentional',
        code: 'ZERO_NULLIFIER_WARNING',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates that a proof corresponds to a specific pool configuration
   * 
   * @param proof - The proof to validate
   * @param poolInfo - The pool information for validation
   * @returns Validation result
   */
  validateForPool(proof: PoolMembershipProof, poolInfo: PoolInfo): ValidationResult {
    const errors: ValidationError[] = [];

    // First validate the proof structure
    const structureResult = this.validate(proof);
    if (!structureResult.isValid) {
      errors.push(...structureResult.errors);
    }

    // Additional pool-specific validations could go here
    // For example, checking that the proof's merkle root is in the pool's history

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Paymaster data validator
 */
export class PaymasterDataValidator {
  /**
   * Validates paymaster data structure
   * 
   * @param data - The paymaster data to validate
   * @returns Detailed validation result
   */
  validate(data: PaymasterData): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate config
    if (!isHexString(data.config) || data.config.length !== 66) { // 0x + 64 chars
      errors.push({
        field: 'config',
        message: 'config must be a 32-byte hex string',
        code: 'INVALID_CONFIG_FORMAT',
      });
    }

    // Validate pool ID
    if (!isHexString(data.poolId) || data.poolId.length !== 66) { // 0x + 64 chars
      errors.push({
        field: 'poolId',
        message: 'poolId must be a 32-byte hex string',
        code: 'INVALID_POOL_ID_FORMAT',
      });
    }

    // Validate proof
    const proofValidator = new ProofValidator();
    const proofResult = proofValidator.validate(data.proof);
    if (!proofResult.isValid) {
      errors.push(...proofResult.errors.map(e => ({
        ...e,
        field: `proof.${e.field}`,
        code: `PROOF_${e.code}`,
      })));
    }
    warnings.push(...proofResult.warnings.map(e => ({
      ...e,
      field: `proof.${e.field}`,
      code: `PROOF_${e.code}`,
    })));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates encoded paymaster data
   * 
   * @param encoded - The encoded paymaster data
   * @returns Validation result
   */
  validateEncoded(encoded: HexString): ValidationResult {
    const errors: ValidationError[] = [];

    // Check total length
    const expectedLength = 2 + (CONSTANTS.PAYMASTER_DATA_SIZE * 2); // 0x + hex chars
    if (encoded.length !== expectedLength) {
      errors.push({
        field: 'encoded',
        message: `Encoded data must be exactly ${CONSTANTS.PAYMASTER_DATA_SIZE} bytes`,
        code: 'INVALID_ENCODED_DATA_LENGTH',
      });
    }

    // Validate hex format
    if (!isHexString(encoded)) {
      errors.push({
        field: 'encoded',
        message: 'Encoded data must be a valid hex string',
        code: 'INVALID_ENCODED_DATA_FORMAT',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Pool configuration validator
 */
export class PoolValidator {
  /**
   * Validates pool information
   * 
   * @param poolInfo - The pool information to validate
   * @returns Validation result
   */
  validate(poolInfo: PoolInfo): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate joining fee
    try {
      const joiningFee = BigInt(poolInfo.joiningFee);
      if (joiningFee < BigInt(0)) {
        errors.push({
          field: 'joiningFee',
          message: 'joiningFee must be non-negative',
          code: 'INVALID_JOINING_FEE',
        });
      }
    } catch {
      errors.push({
        field: 'joiningFee',
        message: 'joiningFee must be a valid number',
        code: 'INVALID_JOINING_FEE_FORMAT',
      });
    }

    // Validate total deposits
    try {
      const totalDeposits = BigInt(poolInfo.totalDeposits);
      if (totalDeposits < BigInt(0)) {
        errors.push({
          field: 'totalDeposits',
          message: 'totalDeposits must be non-negative',
          code: 'INVALID_TOTAL_DEPOSITS',
        });
      }
    } catch {
      errors.push({
        field: 'totalDeposits',
        message: 'totalDeposits must be a valid number',
        code: 'INVALID_TOTAL_DEPOSITS_FORMAT',
      });
    }

    // Validate root history index
    if (!Number.isInteger(poolInfo.rootHistoryCurrentIndex) || poolInfo.rootHistoryCurrentIndex < 0) {
      errors.push({
        field: 'rootHistoryCurrentIndex',
        message: 'rootHistoryCurrentIndex must be a non-negative integer',
        code: 'INVALID_ROOT_HISTORY_INDEX',
      });
    }

    // Validate root history count
    if (!Number.isInteger(poolInfo.rootHistoryCount) || poolInfo.rootHistoryCount < 0) {
      errors.push({
        field: 'rootHistoryCount',
        message: 'rootHistoryCount must be a non-negative integer',
        code: 'INVALID_ROOT_HISTORY_COUNT',
      });
    }

    // Validate index is within bounds
    if (poolInfo.rootHistoryCurrentIndex >= poolInfo.rootHistoryCount && poolInfo.rootHistoryCount > 0) {
      errors.push({
        field: 'rootHistoryCurrentIndex',
        message: 'rootHistoryCurrentIndex must be less than rootHistoryCount',
        code: 'ROOT_HISTORY_INDEX_OUT_OF_BOUNDS',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Creates a user operation validator with the specified context
 * 
 * @param context - Validation context
 * @returns UserOperationValidator instance
 */
export function createUserOperationValidator(context?: ValidationContext): UserOperationValidator {
  return new UserOperationValidator(context);
}

/**
 * Creates a proof validator
 * 
 * @returns ProofValidator instance
 */
export function createProofValidator(): ProofValidator {
  return new ProofValidator();
}

/**
 * Creates a paymaster data validator
 * 
 * @returns PaymasterDataValidator instance
 */
export function createPaymasterDataValidator(): PaymasterDataValidator {
  return new PaymasterDataValidator();
}

/**
 * Creates a pool validator
 * 
 * @returns PoolValidator instance
 */
export function createPoolValidator(): PoolValidator {
  return new PoolValidator();
}

/**
 * Convenience function to validate a user operation with default settings
 * 
 * @param userOp - The user operation to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateUserOperation(
  userOp: PackedUserOperation, 
  context?: ValidationContext
): DetailedValidationResult {
  const validator = new UserOperationValidator(context);
  return validator.validate(userOp);
}

/**
 * Convenience function to validate a proof
 * 
 * @param proof - The proof to validate
 * @returns Validation result
 */
export function validateProof(proof: PoolMembershipProof): DetailedValidationResult {
  const validator = new ProofValidator();
  return validator.validate(proof);
}

/**
 * Convenience function to validate paymaster data
 * 
 * @param data - The paymaster data to validate
 * @returns Validation result
 */
export function validatePaymasterData(data: PaymasterData): DetailedValidationResult {
  const validator = new PaymasterDataValidator();
  return validator.validate(data);
}

/**
 * Convenience function to validate pool information
 * 
 * @param poolInfo - The pool information to validate
 * @returns Validation result
 */
export function validatePool(poolInfo: PoolInfo): ValidationResult {
  const validator = new PoolValidator();
  return validator.validate(poolInfo);
}

// Export validators and utility functions
export {
  UserOperationValidator,
  ProofValidator,
  PaymasterDataValidator,
  PoolValidator,
};

export type {
  ValidationRule,
  ValidationContext,
  DetailedValidationResult,
};