import {
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType,
  GetPaymasterStubDataReturnType,
  UserOperation,
} from 'viem/account-abstraction';
import { createPublicClient, fromHex, http } from 'viem';
// import { getPackedUserOperation } from 'permissionless';

import { ChainId, SubgraphClient } from '@private-prepaid-gas/data';

import { generatePaymasterData, getChainById, parsePaymasterContext, PrepaidGasPaymasterMode } from '../utils';
import { POST_OP_GAS_LIMIT, GAS_LIMITED_PAYMASTER_ABI } from '../constants';
import { GetPaymasterStubDataV7Parameters, ProofGenerationParams, ProofGenerationResult, PaymasterOptions } from './';
import { getValidatedNetworkPreset, type NetworkPreset } from '@private-prepaid-gas/data';
import { generateProof, SemaphoreProof } from '@semaphore-protocol/proof';
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { getPackedUserOperation } from 'permissionless';

/**
 * Main client for interacting with the Prepaid Gas Paymaster system
 *
 * This class provides methods for:
 * - Generating paymaster stub data for gas estimation
 * - Creating paymaster data with zero-knowledge proofs
 * - Managing pool memberships and proof generation
 *
 * @example
 * ```typescript
 * const paymaster = new PrepaidGasPaymaster({
 *   subgraphUrl: "https://api.studio.thegraph.com/query/your-subgraph",
 *   network: {
 *     name: "Base",
 *     chainId: 84532,
 *     chainName: "Base Sepolia",
 *     networkName: "Sepolia",
 *     contracts: {
 *       paymaster: "0xAAdb7b165057fF59a1f2a93C83CE6a183891EAf6",
 *     },
 *   },
 * });
 *
 * // Get stub data for gas estimation
 * const stubData = await paymaster.getPaymasterStubData({
 *   sender: '0x...',
 *   callData: '0x...',
 *   context: encodeContext(poolId),
 *   chainId: 84532,
 *   entryPointAddress: '0x...'
 * });
 * ```
 */
export class PrepaidGasPaymaster {
  private subgraphClient: SubgraphClient;
  private chainId: ChainId;
  private options: PaymasterOptions;

  // Service instances

  constructor(
    chainId: ChainId,
    options: {
      /** Custom subgraph URL (optional, uses default if not provided) */
      subgraphUrl?: string;
      /** Enable debug logging */
      debug?: boolean;
      /** Custom RPC URL */
      rpcUrl?: string;
      /** Request timeout in milliseconds */
      timeout?: number;
    } = {}
  ) {
    const preset: NetworkPreset = getValidatedNetworkPreset(chainId);
    this.chainId = chainId;
    this.options = options;
    // Use provided subgraph URL or fall back to preset default
    const finalSubgraphUrl = options.subgraphUrl || preset.defaultSubgraphUrl;

    if (!finalSubgraphUrl) {
      throw new Error(
        `No subgraph URL available for network ${preset.network.name} (chainId: ${chainId}). Please provide one in options.subgraphUrl`
      );
    }

    // Initialize subgraph client with explicit configuration
    this.subgraphClient = new SubgraphClient(chainId, {
      subgraphUrl: options.subgraphUrl,
      timeout: options.timeout,
    });

    // Initialize services
    if (options.debug) {
      console.log('✅ PrepaidGasPaymaster initialized:', {
        subgraphUrl: options.subgraphUrl,
        chainId: chainId,
      });
    }
  }

  /**
   * Create a PrepaidGasPaymaster instance for any supported network by chain ID
   *
   * @param chainId - The chain ID to create paymaster for
   * @param options - Optional configuration overrides
   * @returns Configured PrepaidGasPaymaster instance
   *
   * @example
   * ```typescript
   * // Create for Base Sepolia using chain ID
   * const paymaster = PrepaidGasPaymaster.createForNetwork(84532);
   *
   * // Create for Base Mainnet with custom options
   * const paymaster = PrepaidGasPaymaster.createForNetwork(8453, {
   *   subgraphUrl: "https://custom-subgraph.com",
   *   debug: true
   * });
   * ```
   */
  static createForNetwork(
    chainId: ChainId,
    options: {
      /** Custom subgraph URL (optional, uses default if not provided) */
      subgraphUrl?: string;
      /** Enable debug logging */
      debug?: boolean;
      /** Custom RPC URL */
      rpcUrl?: string;
      /** Request timeout in milliseconds */
      timeout?: number;
    } = {}
  ): PrepaidGasPaymaster {
    return new PrepaidGasPaymaster(chainId, options);
  }

  /**
   * Generate stub paymaster data for gas estimation
   *
   * This method creates dummy paymaster data that can be used to estimate
   * gas costs without requiring a real zero-knowledge proof.
   *
   * @param parameters - Parameters for generating stub data
   * @returns Promise resolving to paymaster stub data
   */
  /**
   * Generate stub paymaster data for gas estimation
   *
   * @param parameters - Parameters for generating stub data
   * @returns Promise resolving to paymaster stub data
   */
  async getPaymasterStubData(parameters: GetPaymasterStubDataV7Parameters): Promise<GetPaymasterStubDataReturnType> {
    // Validate parameters
    this.validateStubDataParams(parameters);

    // Check for unsupported features
    if ('initCode' in parameters) {
      throw new Error('Gas estimation with initCode is not supported.');
    }

    // Parse context to get paymaster details
    const parsedContext = parsePaymasterContext(parameters.context as `0x${string}`);

    // Generate stub paymaster data
    const paymasterData = await this.generateStubData({
      poolId: parsedContext.poolId,
      merkleRootIndex: 0, // Default to 0 for gas estimation
    });

    return {
      isFinal: false,
      paymaster: parsedContext.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit: POST_OP_GAS_LIMIT,
      sponsor: {
        name: 'Prepaid Gas Pool',
        icon: undefined,
      },
    };
  }

  /**
   * Generate real paymaster data with zero-knowledge proof
   *
   * This method creates actual paymaster data that includes a valid
   * zero-knowledge proof of pool membership.
   *
   * @param parameters - Parameters for generating paymaster data
   * @returns Promise resolving to encoded paymaster data
   */
  async getPaymasterData(parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType> {
    if ('initCode' in parameters) {
      throw new Error('v6-style UserOperation with initCode is not supported.');
    }

    // Create UserOperation for processing
    const userOperation: UserOperation<'0.7'> = {
      ...parameters,
      sender: parameters.sender,
      nonce: parameters.nonce,
      callData: parameters.callData,
      callGasLimit: parameters.callGasLimit ?? 0n,
      verificationGasLimit: parameters.verificationGasLimit ?? 0n,
      preVerificationGas: parameters.preVerificationGas ?? 0n,
      maxFeePerGas: parameters.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: parameters.maxPriorityFeePerGas ?? 0n,
      signature: '0x',
    };

    // Get chain and create public client
    const chain = getChainById(this.chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${this.chainId}`);
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(this.options.rpcUrl),
    });

    // Parse context to get paymaster details
    const parsedContext = parsePaymasterContext(parameters.context as `0x${string}`);

    if (!parsedContext.identityHex) {
      throw new Error('Identity string is required for proof generation');
    }

    // Get message hash from contract
    const packedUserOpForHash = getPackedUserOperation(userOperation);
    const messageHash = await publicClient.readContract({
      abi: GAS_LIMITED_PAYMASTER_ABI,
      address: parsedContext.paymasterAddress,
      functionName: 'getMessageHash',
      args: [packedUserOpForHash],
    });

    // Get pool members from subgraph
    const members = await this.subgraphClient
      .query()
      .poolMembers()
      .byPaymaster(parsedContext.paymasterAddress)
      .byPool(parsedContext.poolId.toString())
      .orderBy('memberIndex', 'asc')
      .execute();
    const poolMembers = members.map((member) => BigInt(member.identityCommitment));

    // Find the best merkle root index
    const [merkleRootIndex] = await publicClient.readContract({
      abi: GAS_LIMITED_PAYMASTER_ABI,
      address: parsedContext.paymasterAddress,
      functionName: 'getPoolRootHistoryInfo',
      args: [parsedContext.poolId],
    });

    if (!merkleRootIndex) {
      throw new Error('Unable to get merkle root index required for proof generation');
    }
    // Generate zero-knowledge proof
    const proofResult = await this.generateProof({
      identityHex: parsedContext.identityHex,
      poolMembers,
      messageHash: BigInt(messageHash),
      poolId: parsedContext.poolId,
    });

    // Generate paymaster data
    const paymasterData = await this.generatePaymasterDataWithProof({
      mode: PrepaidGasPaymasterMode.VALIDATION_MODE,
      poolId: parsedContext.poolId,
      proof: proofResult.proof,
      merkleRootIndex: merkleRootIndex,
    });

    return {
      paymaster: parsedContext.paymasterAddress,
      paymasterData: paymasterData,
    };
  }

  /**
   * Get the subgraph client instance
   *
   * @returns The configured subgraph client
   */
  getSubgraphClient(): SubgraphClient {
    return this.subgraphClient;
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Generate stub paymaster data for gas estimation
   *
   * Creates dummy proof data that can be used to estimate gas costs
   * without requiring a real zero-knowledge proof.
   *
   * @param params - Parameters for stub data generation
   * @returns Promise resolving to encoded stub paymaster data
   *
   * @example
   * ```typescript
   * const service = new PaymasterDataService();
   * const stubData = await service.generateStubData({
   *   poolId: 1n,
   *   merkleRootIndex: 0
   * });
   * ```
   */
  async generateStubData(params: {
    /** Pool ID for the stub */
    poolId: bigint;
    /** Merkle root index (optional, defaults to 0) */
    merkleRootIndex?: number;
  }): Promise<`0x${string}`> {
    const { poolId, merkleRootIndex = 0 } = params;

    // Create dummy proof for gas estimation
    const dummyProof = {
      merkleTreeDepth: 1, // MIN_DEPTH
      merkleTreeRoot: '0x1234567890123456789012345678901234567890123456789012345678901234', // Dummy root
      nullifier: '0',
      message: '0',
      scope: poolId.toString(),
      points: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    };

    return generatePaymasterData(PrepaidGasPaymasterMode.GAS_ESTIMATION_MODE, poolId, dummyProof, merkleRootIndex);
  }

  /**
   * Generate real paymaster data with zero-knowledge proof
   * (Moved from PaymasterDataService)
   */
  private async generatePaymasterDataWithProof(params: {
    mode: PrepaidGasPaymasterMode;
    poolId: bigint;
    proof: SemaphoreProof;
    merkleRootIndex: number;
  }): Promise<`0x${string}`> {
    const { mode, poolId, proof, merkleRootIndex } = params;

    // Validate parameters
    this.validatePaymasterDataParams(params);

    return generatePaymasterData(mode, poolId, proof, merkleRootIndex);
  }

  /**
   * Generate a zero-knowledge proof of pool membership
   *
   * @param params - Proof generation parameters
   * @returns Promise resolving to proof and related objects
   *
   * @example
   * ```typescript
   * const service = new ProofGenerationService();
   * const result = await service.generateProof({
   *   identityString: "0x123...",
   *   poolMembers: [BigInt("0x456..."), BigInt("0x789...")],
   *   messageHash: BigInt("0xabc..."),
   *   poolId: 1n
   * });
   * ```
   */
  async generateProof(params: ProofGenerationParams): Promise<ProofGenerationResult> {
    const { identityHex, poolMembers, messageHash, poolId } = params;
    // Validate inputs
    this.validateProofParams(params);

    // Convert bytes identity back to string
    let identityBase64: string;
    try {
      // Try direct fromHex conversion first
      try {
        identityBase64 = fromHex(identityHex, 'string');
        console.log('🔍 Converted identity from hex bytes to string:', {
          hex: identityHex,
          string: identityBase64,
        });
      } catch (hexError) {
        // If that fails, the identityString might already be a string, not hex bytes
        console.log('🔍 Identity may already be a string, not hex bytes');
        if (typeof identityHex === 'string') {
          identityBase64 = identityHex;
          console.log('🔍 Using identity string directly:', identityBase64);
        } else {
          throw hexError;
        }
      }
    } catch (conversionError) {
      console.error('Identity conversion error:', conversionError);
      throw new Error(
        `Failed to decode identity from context: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`
      );
    }
    // Create Semaphore group from pool members
    const group = new Group(poolMembers);
    // Create user identity
    const identity = Identity.import(identityBase64);

    // Verify identity is in the group
    const memberIndex = group.indexOf(identity.commitment);
    if (memberIndex === -1) {
      throw new Error(`Identity commitment ${identity.commitment} is not a member of pool ${poolId}`);
    }

    // Generate the proof
    const proof = await generateProof(identity, group, messageHash, poolId);

    return {
      proof,
      group,
      identity,
    };
  }

  /**
   * Validate stub data parameters
   */
  private validateStubDataParams(params: GetPaymasterStubDataV7Parameters): void {
    if (!params.context) {
      throw new Error('context is required for paymaster operations');
    }

    if (!params.sender) {
      throw new Error('sender is required');
    }

    if (!params.entryPointAddress) {
      throw new Error('entryPointAddress is required');
    }
  }

  /**
   * Validate paymaster data parameters
   */
  private validatePaymasterDataParams(params: {
    mode: PrepaidGasPaymasterMode;
    poolId: bigint;
    proof: SemaphoreProof;
    merkleRootIndex: number;
  }): void {
    const { mode, poolId, proof, merkleRootIndex } = params;

    if (!Object.values(PrepaidGasPaymasterMode).includes(mode)) {
      throw new Error('Invalid paymaster mode');
    }

    if (poolId < 0n) {
      throw new Error('Pool ID must be non-negative');
    }

    if (!proof) {
      throw new Error('Proof is required');
    }

    if (merkleRootIndex < 0) {
      throw new Error('Merkle root index must be non-negative');
    }
  }

  /**
   * Validate proof generation parameters
   */
  private validateProofParams(params: {
    identityHex: `0x${string}`;
    poolMembers: bigint[];
    messageHash: bigint;
    poolId: bigint;
  }): void {
    const { identityHex, poolMembers, messageHash, poolId } = params;

    if (!identityHex || identityHex.length === 0) {
      throw new Error('Identity string cannot be empty');
    }

    if (!poolMembers || poolMembers.length === 0) {
      throw new Error('Pool members array cannot be empty');
    }

    if (messageHash <= 0n) {
      throw new Error('Message hash must be a positive BigInt');
    }

    if (poolId < 0n) {
      throw new Error('Pool ID must be a non-negative BigInt');
    }

    // Validate pool members are valid commitments
    for (const member of poolMembers) {
      if (member <= 0n) {
        throw new Error('All pool member commitments must be positive BigInt values');
      }
    }
  }
}
