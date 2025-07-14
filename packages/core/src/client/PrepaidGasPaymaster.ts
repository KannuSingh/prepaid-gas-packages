/**
 * @fileoverview PrepaidGasPaymaster Client
 * 
 * Comprehensive client for interacting with Private Prepaid Gas paymaster contracts.
 * Provides high-level APIs for pool management, proof generation, and user operation sponsorship.
 */

import { 
  createPublicClient, 
  createWalletClient, 
  type PublicClient, 
  type WalletClient, 
  type Chain, 
  type Transport,
  type Address as ViemAddress,
  type Hash,
  type TransactionReceipt,
  parseUnits,
  formatUnits,
  getContract,
  encodeFunctionData,
  decodeFunctionResult,
  type GetContractReturnType,
} from 'viem';

import { 
  GAS_LIMITED_PAYMASTER_ABI, 
  ONE_TIME_USE_PAYMASTER_ABI,
  type GasLimitedPaymaster,
  type OneTimeUsePaymaster,
} from '@private-prepaid-gas/contracts';

import {
  type Address,
  type HexString,
  type BigNumberish,
  type Result,
  type AsyncResult,
  type Logger,
  type RetryConfig,
  type PackedUserOperation,
  type PoolMembershipProof,
  type PaymasterValidationData,
  type PaymasterContext,
  type PoolInfo,
  type MerkleRootInfo,
  type PaymasterMode,
  type MemberAddedEvent,
  type PoolCreatedEvent,
  type UserOpSponsoredEvent,
  type PaymasterConfig,
  type GasLimits,
  type GasFees,
  type PaymasterData,
  type PaymasterError,
  CONSTANTS,
} from '@private-prepaid-gas/types';

/**
 * Configuration options for the PrepaidGasPaymaster client
 */
export interface PrepaidGasPaymasterClientConfig {
  /** The chain to connect to */
  readonly chain: Chain;
  /** The transport to use for the public client */
  readonly transport: Transport;
  /** Wallet client for signing transactions (optional) */
  readonly walletClient?: WalletClient;
  /** Address of the Gas Limited Paymaster contract */
  readonly gasLimitedPaymasterAddress: ViemAddress;
  /** Address of the One Time Use Paymaster contract */
  readonly oneTimeUsePaymasterAddress: ViemAddress;
  /** Logger instance for debugging (optional) */
  readonly logger?: Logger;
  /** Retry configuration for failed operations */
  readonly retryConfig?: RetryConfig;
  /** Enable/disable automatic gas estimation */
  readonly autoEstimateGas?: boolean;
  /** Default gas price multiplier for transactions */
  readonly gasPriceMultiplier?: number;
}

/**
 * Pool creation parameters
 */
export interface CreatePoolParams {
  /** Joining fee for the pool in wei */
  readonly joiningFee: BigNumberish;
  /** Type of paymaster (gas-limited or one-time-use) */
  readonly paymasterType: 'gas-limited' | 'one-time-use';
  /** Gas limit for the transaction */
  readonly gasLimit?: BigNumberish;
  /** Gas price for the transaction */
  readonly gasPrice?: BigNumberish;
}

/**
 * Member addition parameters
 */
export interface AddMemberParams {
  /** Pool ID to add member to */
  readonly poolId: HexString;
  /** Identity commitment of the new member */
  readonly identityCommitment: BigNumberish;
  /** Gas limit for the transaction */
  readonly gasLimit?: BigNumberish;
  /** Gas price for the transaction */
  readonly gasPrice?: BigNumberish;
}

/**
 * Batch member addition parameters
 */
export interface AddMembersParams {
  /** Pool ID to add members to */
  readonly poolId: HexString;
  /** Array of identity commitments for new members */
  readonly identityCommitments: readonly BigNumberish[];
  /** Gas limit for the transaction */
  readonly gasLimit?: BigNumberish;
  /** Gas price for the transaction */
  readonly gasPrice?: BigNumberish;
}

/**
 * User operation validation parameters
 */
export interface ValidateUserOpParams {
  /** The packed user operation */
  readonly userOp: PackedUserOperation;
  /** Pool membership proof */
  readonly proof: PoolMembershipProof;
  /** Pool ID for validation */
  readonly poolId: HexString;
  /** Validation mode */
  readonly mode: PaymasterMode;
}

/**
 * Gas estimation result
 */
export interface GasEstimationResult {
  /** Estimated gas limit */
  readonly gasLimit: BigNumberish;
  /** Estimated gas price */
  readonly gasPrice: BigNumberish;
  /** Total estimated cost in wei */
  readonly totalCost: BigNumberish;
  /** Breakdown of gas costs */
  readonly breakdown: {
    readonly verification: BigNumberish;
    readonly execution: BigNumberish;
    readonly postOp: BigNumberish;
  };
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  /** Block number to start filtering from */
  readonly fromBlock?: bigint;
  /** Block number to stop filtering at */
  readonly toBlock?: bigint;
  /** Pool ID to filter events for */
  readonly poolId?: HexString;
  /** Sender address to filter events for */
  readonly sender?: Address;
}

/**
 * Comprehensive client for Private Prepaid Gas paymaster operations
 */
export class PrepaidGasPaymaster {
  private readonly publicClient: PublicClient;
  private readonly walletClient?: WalletClient;
  private readonly gasLimitedContract: GetContractReturnType<typeof GAS_LIMITED_PAYMASTER_ABI, PublicClient>;
  private readonly oneTimeUseContract: GetContractReturnType<typeof ONE_TIME_USE_PAYMASTER_ABI, PublicClient>;
  private readonly config: PrepaidGasPaymasterClientConfig;
  private readonly logger?: Logger;

  /**
   * Creates a new PrepaidGasPaymaster client instance
   * 
   * @param config - Configuration options for the client
   */
  constructor(config: PrepaidGasPaymasterClientConfig) {
    this.config = config;
    this.logger = config.logger;

    // Create public client
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: config.transport,
    });

    // Store wallet client if provided
    this.walletClient = config.walletClient;

    // Create contract instances
    this.gasLimitedContract = getContract({
      address: config.gasLimitedPaymasterAddress,
      abi: GAS_LIMITED_PAYMASTER_ABI,
      client: this.publicClient,
    });

    this.oneTimeUseContract = getContract({
      address: config.oneTimeUsePaymasterAddress,
      abi: ONE_TIME_USE_PAYMASTER_ABI,
      client: this.publicClient,
    });

    this.logger?.info('PrepaidGasPaymaster client initialized', {
      chain: config.chain.name,
      gasLimitedAddress: config.gasLimitedPaymasterAddress,
      oneTimeUseAddress: config.oneTimeUsePaymasterAddress,
    });
  }

  // ===========================
  // Pool Management Methods
  // ===========================

  /**
   * Creates a new pool with the specified joining fee
   * 
   * @param params - Pool creation parameters
   * @returns Promise that resolves to the transaction hash and pool ID
   */
  async createPool(params: CreatePoolParams): AsyncResult<{ txHash: Hash; poolId: HexString }> {
    try {
      if (!this.walletClient) {
        return {
          success: false,
          error: new Error('Wallet client required for pool creation'),
        };
      }

      this.logger?.info('Creating pool', { params });

      const contract = params.paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      const contractAddress = params.paymasterType === 'gas-limited' 
        ? this.config.gasLimitedPaymasterAddress 
        : this.config.oneTimeUsePaymasterAddress;

      // Estimate gas if not provided
      const gasLimit = params.gasLimit ?? await this.estimateGasForPoolCreation(params);

      // Create pool transaction
      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: params.paymasterType === 'gas-limited' ? GAS_LIMITED_PAYMASTER_ABI : ONE_TIME_USE_PAYMASTER_ABI,
        functionName: 'createPool',
        args: [params.joiningFee],
        gas: BigInt(gasLimit.toString()),
      });

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Extract pool ID from logs
      const poolId = this.extractPoolIdFromLogs(receipt, params.paymasterType);

      this.logger?.info('Pool created successfully', { 
        txHash: hash, 
        poolId,
        paymasterType: params.paymasterType,
      });

      return {
        success: true,
        data: { txHash: hash, poolId },
      };
    } catch (error) {
      this.logger?.error('Failed to create pool', { error, params });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Adds a new member to an existing pool
   * 
   * @param params - Member addition parameters
   * @returns Promise that resolves to the transaction hash
   */
  async addMember(params: AddMemberParams): AsyncResult<Hash> {
    try {
      if (!this.walletClient) {
        return {
          success: false,
          error: new Error('Wallet client required for adding members'),
        };
      }

      this.logger?.info('Adding member to pool', { params });

      // Determine which contract to use based on pool ID
      const paymasterType = await this.getPoolPaymasterType(params.poolId);
      const contract = paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      const contractAddress = paymasterType === 'gas-limited' 
        ? this.config.gasLimitedPaymasterAddress 
        : this.config.oneTimeUsePaymasterAddress;

      // Estimate gas if not provided
      const gasLimit = params.gasLimit ?? await this.estimateGasForMemberAddition(params);

      // Add member transaction
      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: paymasterType === 'gas-limited' ? GAS_LIMITED_PAYMASTER_ABI : ONE_TIME_USE_PAYMASTER_ABI,
        functionName: 'addMember',
        args: [params.poolId, params.identityCommitment],
        gas: BigInt(gasLimit.toString()),
      });

      this.logger?.info('Member added successfully', { txHash: hash, poolId: params.poolId });

      return {
        success: true,
        data: hash,
      };
    } catch (error) {
      this.logger?.error('Failed to add member', { error, params });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Adds multiple members to an existing pool in a single transaction
   * 
   * @param params - Batch member addition parameters
   * @returns Promise that resolves to the transaction hash
   */
  async addMembers(params: AddMembersParams): AsyncResult<Hash> {
    try {
      if (!this.walletClient) {
        return {
          success: false,
          error: new Error('Wallet client required for adding members'),
        };
      }

      this.logger?.info('Adding members to pool', { 
        params: { ...params, memberCount: params.identityCommitments.length } 
      });

      // Determine which contract to use based on pool ID
      const paymasterType = await this.getPoolPaymasterType(params.poolId);
      const contractAddress = paymasterType === 'gas-limited' 
        ? this.config.gasLimitedPaymasterAddress 
        : this.config.oneTimeUsePaymasterAddress;

      // Estimate gas if not provided
      const gasLimit = params.gasLimit ?? await this.estimateGasForBatchMemberAddition(params);

      // Add members transaction
      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: paymasterType === 'gas-limited' ? GAS_LIMITED_PAYMASTER_ABI : ONE_TIME_USE_PAYMASTER_ABI,
        functionName: 'addMembers',
        args: [params.poolId, params.identityCommitments],
        gas: BigInt(gasLimit.toString()),
      });

      this.logger?.info('Members added successfully', { 
        txHash: hash, 
        poolId: params.poolId,
        memberCount: params.identityCommitments.length,
      });

      return {
        success: true,
        data: hash,
      };
    } catch (error) {
      this.logger?.error('Failed to add members', { error, params });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  // ===========================
  // Pool Query Methods
  // ===========================

  /**
   * Retrieves information about a specific pool
   * 
   * @param poolId - The pool ID to query
   * @returns Promise that resolves to pool information
   */
  async getPool(poolId: HexString): AsyncResult<PoolInfo> {
    try {
      this.logger?.debug('Fetching pool info', { poolId });

      // Determine which contract to use
      const paymasterType = await this.getPoolPaymasterType(poolId);
      const contract = paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      // Get pool information
      const poolInfo = await contract.read.getPool([poolId]);

      const result: PoolInfo = {
        joiningFee: poolInfo[0].toString(),
        totalDeposits: poolInfo[1].toString(),
        rootHistoryCurrentIndex: Number(poolInfo[2]),
        rootHistoryCount: Number(poolInfo[3]),
      };

      this.logger?.debug('Pool info retrieved', { poolId, poolInfo: result });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger?.error('Failed to get pool info', { error, poolId });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Gets the current Merkle root for a pool
   * 
   * @param poolId - The pool ID to query
   * @returns Promise that resolves to the current Merkle root info
   */
  async getCurrentRoot(poolId: HexString): AsyncResult<MerkleRootInfo> {
    try {
      this.logger?.debug('Fetching current root', { poolId });

      // Determine which contract to use
      const paymasterType = await this.getPoolPaymasterType(poolId);
      const contract = paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      // Get current root
      const rootInfo = await contract.read.getCurrentRoot([poolId]);

      const result: MerkleRootInfo = {
        latestRoot: rootInfo[0].toString(),
        rootIndex: Number(rootInfo[1]),
      };

      this.logger?.debug('Current root retrieved', { poolId, rootInfo: result });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger?.error('Failed to get current root', { error, poolId });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Checks if a nullifier has been used in a pool
   * 
   * @param poolId - The pool ID to check
   * @param nullifier - The nullifier to check
   * @returns Promise that resolves to whether the nullifier is used
   */
  async isNullifierUsed(poolId: HexString, nullifier: HexString): AsyncResult<boolean> {
    try {
      this.logger?.debug('Checking nullifier usage', { poolId, nullifier });

      // Determine which contract to use
      const paymasterType = await this.getPoolPaymasterType(poolId);
      const contract = paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      // Check nullifier usage
      const isUsed = await contract.read.isNullifierUsed([poolId, nullifier]);

      this.logger?.debug('Nullifier usage checked', { poolId, nullifier, isUsed });

      return {
        success: true,
        data: isUsed,
      };
    } catch (error) {
      this.logger?.error('Failed to check nullifier usage', { error, poolId, nullifier });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  // ===========================
  // User Operation Methods
  // ===========================

  /**
   * Validates a user operation with the paymaster
   * 
   * @param params - Validation parameters
   * @returns Promise that resolves to validation data
   */
  async validateUserOp(params: ValidateUserOpParams): AsyncResult<PaymasterValidationData> {
    try {
      this.logger?.debug('Validating user operation', { params });

      // Determine which contract to use
      const paymasterType = await this.getPoolPaymasterType(params.poolId);
      const contract = paymasterType === 'gas-limited' 
        ? this.gasLimitedContract 
        : this.oneTimeUseContract;

      // Encode paymaster data
      const paymasterData = this.encodePaymasterData({
        config: '0x' + '0'.repeat(64), // 32 bytes of zeros for validation
        poolId: params.poolId,
        proof: params.proof,
      });

      // Create user operation with paymaster data
      const userOpWithPaymaster = {
        ...params.userOp,
        paymasterAndData: paymasterData,
      };

      // Call validatePaymasterUserOp
      const validationResult = await contract.read.validatePaymasterUserOp([
        userOpWithPaymaster,
        '0x' + '0'.repeat(64), // userOpHash placeholder
        parseUnits('1', 'gwei'), // maxCost placeholder
      ]);

      const result: PaymasterValidationData = {
        context: validationResult[0],
        validationData: validationResult[1],
      };

      this.logger?.debug('User operation validated', { params, result });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger?.error('Failed to validate user operation', { error, params });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Estimates gas costs for a user operation
   * 
   * @param userOp - The user operation to estimate gas for
   * @param poolId - The pool ID for context
   * @returns Promise that resolves to gas estimation
   */
  async estimateUserOpGas(userOp: PackedUserOperation, poolId: HexString): AsyncResult<GasEstimationResult> {
    try {
      this.logger?.debug('Estimating user operation gas', { userOp, poolId });

      // This is a simplified gas estimation
      // In a real implementation, you would simulate the transaction
      const baseGas = BigInt(21000); // Base transaction cost
      const verificationGas = BigInt(150000); // Estimated verification cost
      const executionGas = BigInt(userOp.callData.length * 16); // Estimate based on calldata
      const postOpGas = BigInt(CONSTANTS.POST_OP_GAS_LIMIT);

      const totalGas = baseGas + verificationGas + executionGas + postOpGas;

      // Get current gas price
      const gasPrice = await this.publicClient.getGasPrice();
      const totalCost = totalGas * gasPrice;

      const result: GasEstimationResult = {
        gasLimit: totalGas.toString(),
        gasPrice: gasPrice.toString(),
        totalCost: totalCost.toString(),
        breakdown: {
          verification: verificationGas.toString(),
          execution: executionGas.toString(),
          postOp: postOpGas.toString(),
        },
      };

      this.logger?.debug('Gas estimation completed', { userOp, poolId, result });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger?.error('Failed to estimate gas', { error, userOp, poolId });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  // ===========================
  // Event Query Methods
  // ===========================

  /**
   * Gets pool creation events
   * 
   * @param options - Event filter options
   * @returns Promise that resolves to pool creation events
   */
  async getPoolCreatedEvents(options: EventFilterOptions = {}): AsyncResult<PoolCreatedEvent[]> {
    try {
      this.logger?.debug('Fetching pool created events', { options });

      const events: PoolCreatedEvent[] = [];

      // Get events from both contracts
      for (const { contract, type } of [
        { contract: this.gasLimitedContract, type: 'gas-limited' },
        { contract: this.oneTimeUseContract, type: 'one-time-use' }
      ]) {
        const contractEvents = await contract.getEvents.PoolCreated({
          fromBlock: options.fromBlock,
          toBlock: options.toBlock,
        });

        for (const event of contractEvents) {
          if (options.poolId && event.args.poolId !== options.poolId) {
            continue;
          }

          events.push({
            poolId: event.args.poolId!,
            joiningFee: event.args.joiningFee!.toString(),
          });
        }
      }

      this.logger?.debug('Pool created events fetched', { count: events.length });

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger?.error('Failed to get pool created events', { error, options });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Gets member added events for a pool
   * 
   * @param options - Event filter options
   * @returns Promise that resolves to member added events
   */
  async getMemberAddedEvents(options: EventFilterOptions = {}): AsyncResult<MemberAddedEvent[]> {
    try {
      this.logger?.debug('Fetching member added events', { options });

      const events: MemberAddedEvent[] = [];

      // Get events from both contracts
      for (const contract of [this.gasLimitedContract, this.oneTimeUseContract]) {
        const contractEvents = await contract.getEvents.MemberAdded({
          fromBlock: options.fromBlock,
          toBlock: options.toBlock,
        });

        for (const event of contractEvents) {
          if (options.poolId && event.args.poolId !== options.poolId) {
            continue;
          }

          events.push({
            poolId: event.args.poolId!,
            memberIndex: event.args.memberIndex!.toString(),
            identityCommitment: event.args.identityCommitment!.toString(),
            merkleTreeRoot: event.args.merkleTreeRoot!,
            merkleRootIndex: Number(event.args.merkleRootIndex!),
          });
        }
      }

      this.logger?.debug('Member added events fetched', { count: events.length });

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger?.error('Failed to get member added events', { error, options });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Gets user operation sponsored events
   * 
   * @param options - Event filter options
   * @returns Promise that resolves to user op sponsored events
   */
  async getUserOpSponsoredEvents(options: EventFilterOptions = {}): AsyncResult<UserOpSponsoredEvent[]> {
    try {
      this.logger?.debug('Fetching user op sponsored events', { options });

      const events: UserOpSponsoredEvent[] = [];

      // Get events from both contracts
      for (const contract of [this.gasLimitedContract, this.oneTimeUseContract]) {
        const contractEvents = await contract.getEvents.UserOpSponsored({
          fromBlock: options.fromBlock,
          toBlock: options.toBlock,
        });

        for (const event of contractEvents) {
          if (options.poolId && event.args.poolId !== options.poolId) {
            continue;
          }
          if (options.sender && event.args.sender !== options.sender) {
            continue;
          }

          events.push({
            userOpHash: event.args.userOpHash!,
            poolId: event.args.poolId!,
            sender: event.args.sender!,
            actualGasCost: event.args.actualGasCost!.toString(),
            nullifier: event.args.nullifier!,
          });
        }
      }

      this.logger?.debug('User op sponsored events fetched', { count: events.length });

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger?.error('Failed to get user op sponsored events', { error, options });
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  // ===========================
  // Utility Methods
  // ===========================

  /**
   * Encodes paymaster data for user operations
   * 
   * @param data - The paymaster data to encode
   * @returns Encoded paymaster data as hex string
   */
  private encodePaymasterData(data: PaymasterData): HexString {
    // This is a simplified implementation
    // In a real implementation, you would properly encode the data according to the contract specification
    const configBytes = data.config.slice(2).padEnd(64, '0');
    const poolIdBytes = data.poolId.slice(2).padEnd(64, '0');
    
    // Encode proof (simplified)
    const proofBytes = [
      data.proof.merkleTreeDepth.slice(2).padEnd(64, '0'),
      data.proof.merkleTreeRoot.slice(2).padEnd(64, '0'),
      data.proof.nullifier.slice(2).padEnd(64, '0'),
      data.proof.message.slice(2).padEnd(64, '0'),
      data.proof.scope.slice(2).padEnd(64, '0'),
      ...data.proof.points.map(p => p.slice(2).padEnd(64, '0'))
    ].join('');

    return `0x${configBytes}${poolIdBytes}${proofBytes}`;
  }

  /**
   * Determines which paymaster type a pool belongs to
   * 
   * @param poolId - The pool ID to check
   * @returns The paymaster type
   */
  private async getPoolPaymasterType(poolId: HexString): Promise<'gas-limited' | 'one-time-use'> {
    try {
      // Try gas-limited first
      await this.gasLimitedContract.read.getPool([poolId]);
      return 'gas-limited';
    } catch {
      // If that fails, it must be one-time-use
      return 'one-time-use';
    }
  }

  /**
   * Extracts pool ID from transaction receipt logs
   * 
   * @param receipt - Transaction receipt
   * @param paymasterType - Type of paymaster
   * @returns The extracted pool ID
   */
  private extractPoolIdFromLogs(receipt: TransactionReceipt, paymasterType: 'gas-limited' | 'one-time-use'): HexString {
    // This is a simplified implementation
    // In a real implementation, you would parse the logs to extract the pool ID
    
    // For now, we'll generate a deterministic pool ID based on transaction hash
    // This should be replaced with proper log parsing
    return receipt.transactionHash;
  }

  /**
   * Estimates gas for pool creation
   */
  private async estimateGasForPoolCreation(params: CreatePoolParams): Promise<BigNumberish> {
    // Simplified gas estimation
    return '200000';
  }

  /**
   * Estimates gas for member addition
   */
  private async estimateGasForMemberAddition(params: AddMemberParams): Promise<BigNumberish> {
    // Simplified gas estimation
    return '150000';
  }

  /**
   * Estimates gas for batch member addition
   */
  private async estimateGasForBatchMemberAddition(params: AddMembersParams): Promise<BigNumberish> {
    // Simplified gas estimation based on number of members
    const baseGas = 100000;
    const perMemberGas = 50000;
    return (baseGas + (perMemberGas * params.identityCommitments.length)).toString();
  }

  /**
   * Gets the current configuration of the client
   * 
   * @returns The client configuration
   */
  getConfig(): PrepaidGasPaymasterClientConfig {
    return { ...this.config };
  }

  /**
   * Gets the public client instance
   * 
   * @returns The public client
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Gets the wallet client instance (if available)
   * 
   * @returns The wallet client or undefined
   */
  getWalletClient(): WalletClient | undefined {
    return this.walletClient;
  }
}

/**
 * Creates a new PrepaidGasPaymaster client instance with the provided configuration
 * 
 * @param config - Configuration options for the client
 * @returns A new PrepaidGasPaymaster client instance
 */
export function createPrepaidGasPaymaster(config: PrepaidGasPaymasterClientConfig): PrepaidGasPaymaster {
  return new PrepaidGasPaymaster(config);
}

export type { 
  PrepaidGasPaymasterClientConfig,
  CreatePoolParams,
  AddMemberParams,
  AddMembersParams,
  ValidateUserOpParams,
  GasEstimationResult,
  EventFilterOptions,
};