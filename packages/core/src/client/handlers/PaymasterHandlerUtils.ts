import { GetPaymasterDataParameters, UserOperation, entryPoint07Address, toPackedUserOperation } from 'viem/account-abstraction';
import { fromHex } from 'viem';
import { generateProof, SemaphoreProof } from '@semaphore-protocol/proof';
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generatePaymasterData, PrepaidGasPaymasterMode } from '../../utils';
import { getChainById } from '@prepaid-gas/constants';
import { getMessageHash } from '../../utils/getMessageHash';
import { GetPaymasterStubDataV7Parameters, ProofGenerationParams, ProofGenerationResult } from '../index';
import type { Activity } from '@prepaid-gas/data';
import type { PaymasterHandlerConfig } from './PaymasterHandler';

/**
 * Shared utilities for paymaster handlers
 *
 * Contains common functionality used across all paymaster handler implementations:
 * - ZK proof generation
 * - Stub data generation
 * - Activation data generation
 * - Validation methods
 */
export class PaymasterHandlerUtils {
  private config: PaymasterHandlerConfig;

  constructor(config: PaymasterHandlerConfig) {
    this.config = config;

    const chain = getChainById(config.chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${config.chainId}`);
    }
  }

  /**
   * Generate stub paymaster data for gas estimation
   */
  async generateStubData(): Promise<`0x${string}`> {
    const merkleRootIndex = 0;

    // Create dummy proof for gas estimation
    const dummyProof = {
      merkleTreeDepth: 1, // MIN_DEPTH
      merkleTreeRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
      nullifier: '0',
      message: '0',
      scope: 0,
      points: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    };
    const mode = PrepaidGasPaymasterMode.GAS_ESTIMATION_MODE;

    return generatePaymasterData(mode, dummyProof, merkleRootIndex);
  }

  /**
   * Generate activation paymaster data with ZK proof
   */
  async generateActivationPaymasterData(
    parameters: GetPaymasterDataParameters,
    context: { paymasterAddress: `0x${string}`; identityHex: string },
    contractData: { merkleRootIndex: number; scope: bigint }
  ): Promise<`0x${string}`> {
    const chain = getChainById(this.config.chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${this.config.chainId}`);
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

    if (!context.identityHex) {
      throw new Error('Identity string is required for proof generation');
    }

    // Get message hash
    const packedUserOpForHash = toPackedUserOperation(userOperation);
    const messageHash = getMessageHash(packedUserOpForHash, BigInt(chain.id), entryPoint07Address);

    // Get pool members from subgraph
    const depositActivities = await this.config.subgraphClient
      .query()
      .depositActivities()
      .byPaymasterAddress(context.paymasterAddress)
      .orderBy('timestamp', 'asc')
      .execute();
    const poolMembers = depositActivities.map((deposit: Activity) => {
      if (!deposit.commitment) {
        throw new Error('Deposit activity missing commitment');
      }
      return BigInt(deposit.commitment);
    });

    // Use provided contract data
    const { merkleRootIndex, scope: SCOPE } = contractData;

    if (!merkleRootIndex) {
      throw new Error('Unable to get merkle root index required for proof generation');
    }

    // Generate zero-knowledge proof
    const proofResult = await this.generateProof({
      identityHex: context.identityHex as `0x${string}`,
      poolMembers,
      messageHash: BigInt(messageHash),
      scope: typeof SCOPE === 'bigint' ? SCOPE : BigInt(SCOPE),
    });

    // Generate paymaster data
    return this.generatePaymasterDataWithProof({
      mode: PrepaidGasPaymasterMode.VALIDATION_MODE,
      proof: proofResult.proof,
      merkleRootIndex: Number(merkleRootIndex),
    });
  }

  /**
   * Generate a zero-knowledge proof of pool membership
   */
  async generateProof(params: ProofGenerationParams): Promise<ProofGenerationResult> {
    const { identityHex, poolMembers, messageHash, scope } = params;

    // Validate inputs
    this.validateProofParams(params);

    // Convert bytes identity back to string
    let identityBase64: string;
    try {
      try {
        identityBase64 = fromHex(identityHex, 'string');
      } catch (hexError) {
        if (typeof identityHex === 'string') {
          identityBase64 = identityHex;
        } else {
          throw hexError;
        }
      }
    } catch (conversionError) {
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
      throw new Error(`Identity commitment ${identity.commitment} is not a member of pool`);
    }

    // Generate the proof
    const proof = await generateProof(identity, group, messageHash, scope);

    return {
      proof,
      group,
      identity,
    };
  }

  /**
   * Generate real paymaster data with zero-knowledge proof
   */
  async generatePaymasterDataWithProof(params: {
    mode: PrepaidGasPaymasterMode;
    proof: SemaphoreProof;
    merkleRootIndex: number;
  }): Promise<`0x${string}`> {
    const { mode, proof, merkleRootIndex } = params;

    // Validate parameters
    this.validatePaymasterDataParams(params);

    return generatePaymasterData(mode, proof, merkleRootIndex);
  }

  // ========================================
  // VALIDATION METHODS
  // ========================================

  validateProofParams(params: {
    identityHex: `0x${string}`;
    poolMembers: bigint[];
    messageHash: bigint;
    scope: bigint;
  }): void {
    const { identityHex, poolMembers, messageHash, scope } = params;

    if (!identityHex || identityHex.length === 0) {
      throw new Error('Identity string cannot be empty');
    }

    if (!poolMembers || poolMembers.length === 0) {
      throw new Error('Pool members array cannot be empty');
    }

    for (const member of poolMembers) {
      if (member <= 0n) {
        throw new Error('All pool member commitments must be positive BigInt values');
      }
    }

    if (messageHash <= 0n) {
      throw new Error('Message hash must be a positive BigInt');
    }

    if (scope < 0n) {
      throw new Error('Scope must be non-negative');
    }
  }

  validatePaymasterDataParams(params: {
    mode: PrepaidGasPaymasterMode;
    proof: SemaphoreProof;
    merkleRootIndex: number;
  }): void {
    const { mode, proof, merkleRootIndex } = params;

    if (!Object.values(PrepaidGasPaymasterMode).includes(mode)) {
      throw new Error('Invalid paymaster mode');
    }

    if (!proof) {
      throw new Error('Proof is required');
    }

    if (merkleRootIndex < 0) {
      throw new Error('Merkle root index must be non-negative');
    }
  }

  validateStubDataParams(params: GetPaymasterStubDataV7Parameters): void {
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
}
