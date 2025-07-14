import type { 
  GetPaymasterStubDataV7Parameters, 
  GetPaymasterStubDataReturnType,
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType 
} from '@private-prepaid-gas/types';
import { parsePaymasterContext } from '../utils/context';
import { 
  PaymasterMode, 
  GAS_CONSTANTS,
  encodePaymasterConfig,
  createDummyProof,
  encodePaymasterData,
  createPaymasterAndData 
} from '../utils/paymaster-data';
import { SubgraphClient } from './SubgraphClient';
import { generatePoolMembershipProof, getIdentityCommitmentFromHex, validatePoolMembership } from '../utils/zk-proof';
import { createRpcClient, getMessageHash, getLatestMerkleRootIndex } from '../utils/contract';
import { 
  PaymasterContextError, 
  PoolMembershipError, 
  SubgraphError, 
  ProofGenerationError, 
  NetworkError,
  ValidationError 
} from '../errors/PaymasterErrors';

/**
 * Configuration options for PrepaidGasPaymaster
 */
export interface PrepaidGasPaymasterOptions {
  subgraphUrl?: string;
  debug?: boolean;
  rpcUrl?: string;
  timeout?: number;
}

/**
 * Simple PrepaidGasPaymaster client focused on actual usage patterns
 */
export class PrepaidGasPaymaster {
  private readonly chainId: number;
  private readonly options: PrepaidGasPaymasterOptions;
  private subgraphClient?: SubgraphClient;

  constructor(chainId: number, options: PrepaidGasPaymasterOptions = {}) {
    this.chainId = chainId;
    this.options = options;
  }

  /**
   * Factory method to create paymaster client for specific network
   * This is the primary entry point used by applications
   */
  static createForNetwork(chainId: number, options: PrepaidGasPaymasterOptions = {}): PrepaidGasPaymaster {
    return new PrepaidGasPaymaster(chainId, options);
  }

  /**
   * Get paymaster stub data for gas estimation (without ZK proof)
   * Used by permissionless SDK for gas estimation
   */
  async getPaymasterStubData(parameters: GetPaymasterStubDataV7Parameters): Promise<GetPaymasterStubDataReturnType> {
    try {
      // Extract paymaster context from the user operation
      // The context should be in userOp.paymasterAndData or passed separately
      // For now, we'll expect it in the paymasterAndData field
      const paymasterAndData = parameters.userOperation.paymasterAndData;
      
      if (!paymasterAndData || paymasterAndData === '0x') {
        throw new PaymasterContextError('Paymaster context required for gas estimation');
      }

      if (typeof paymasterAndData !== 'string' || !paymasterAndData.startsWith('0x')) {
        throw new PaymasterContextError('Invalid paymaster context format');
      }

      // Parse the context to get paymaster address and pool ID
      let context;
      try {
        context = parsePaymasterContext(paymasterAndData as `0x${string}`);
      } catch (error) {
        throw new PaymasterContextError(`Failed to parse paymaster context: ${error}`);
      }

      // Validate context fields
      if (!context.paymasterAddress || !context.poolId) {
        throw new PaymasterContextError('Invalid context: missing paymaster address or pool ID');
      }

      // Create dummy paymaster data for gas estimation
      // Use merkleRootIndex = 0 for gas estimation (no real root needed)
      const config = encodePaymasterConfig(PaymasterMode.GAS_ESTIMATION_MODE, 0);
      const dummyProof = createDummyProof();
      
      const paymasterData = {
        config: config,
        poolId: context.poolId,
        proof: dummyProof,
      };

      // Encode the paymaster data
      const encodedData = encodePaymasterData(paymasterData);
      
      // Create the final paymasterAndData: paymaster_address + encoded_data
      const finalPaymasterAndData = createPaymasterAndData(context.paymasterAddress, encodedData);

      return {
        paymasterAndData: finalPaymasterAndData,
        paymasterPostOpGasLimit: GAS_CONSTANTS.POST_OP_GAS_LIMIT.toString(),
        paymasterVerificationGasLimit: GAS_CONSTANTS.VERIFICATION_GAS_LIMIT.toString(),
      };
    } catch (error) {
      if (error instanceof PaymasterContextError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Failed to generate paymaster stub data: ${error}`);
    }
  }

  /**
   * Get paymaster data for real transactions (with ZK proof)
   * Used by permissionless SDK for actual transactions
   */
  async getPaymasterData(parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType> {
    try {
      // Extract paymaster context from the user operation
      const paymasterAndData = parameters.userOperation.paymasterAndData;
      
      if (!paymasterAndData || paymasterAndData === '0x') {
        throw new PaymasterContextError('Paymaster context required for transaction');
      }

      if (typeof paymasterAndData !== 'string' || !paymasterAndData.startsWith('0x')) {
        throw new PaymasterContextError('Invalid paymaster context format');
      }

      // Parse the context to get paymaster address, pool ID, and identity
      let context;
      try {
        context = parsePaymasterContext(paymasterAndData as `0x${string}`);
      } catch (error) {
        throw new PaymasterContextError(`Failed to parse paymaster context: ${error}`);
      }

      // Validate context fields
      if (!context.paymasterAddress || !context.poolId || !context.identityHex) {
        throw new PaymasterContextError('Invalid context: missing required fields');
      }

      // Create RPC client for contract interactions
      let rpcClient;
      try {
        rpcClient = createRpcClient(this.chainId, this.options.rpcUrl);
      } catch (error) {
        throw new NetworkError(`Failed to create RPC client: ${error}`);
      }

      // Get pool members from subgraph for ZK proof generation
      const subgraphClient = this.getSubgraphClient();
      const poolMembersResult = await subgraphClient.getPoolMembers(context.poolId);
      
      if (poolMembersResult.error) {
        throw new SubgraphError(`Failed to fetch pool members: ${poolMembersResult.error}`);
      }
      
      if (!poolMembersResult.data.poolMembers || poolMembersResult.data.poolMembers.length === 0) {
        throw new PoolMembershipError('Pool has no members or pool does not exist');
      }

      const poolMembers = poolMembersResult.data.poolMembers.map(m => m.identityCommitment);

      // Validate that the identity is a member of the pool
      let identityCommitment;
      try {
        identityCommitment = getIdentityCommitmentFromHex(context.identityHex);
      } catch (error) {
        throw new ValidationError(`Invalid identity hex format: ${error}`);
      }
      
      if (!validatePoolMembership(identityCommitment, poolMembers)) {
        throw new PoolMembershipError('Identity is not a member of the specified pool');
      }

      // Get message hash locally (no RPC call needed)
      // EntryPoint V7 address is standardized across networks
      const ENTRYPOINT_V7 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const;
      const messageHash = getMessageHash(
        this.chainId,
        ENTRYPOINT_V7,
        parameters.userOperation
      );

      // Get the latest merkle root index for the pool
      let merkleRootIndex;
      try {
        merkleRootIndex = await getLatestMerkleRootIndex(
          rpcClient,
          context.paymasterAddress,
          context.poolId
        );
      } catch (error) {
        throw new NetworkError(`Failed to get merkle root index: ${error}`);
      }

      // Generate ZK proof using Semaphore protocol
      let proof;
      try {
        proof = await generatePoolMembershipProof(
          context.identityHex,
          poolMembers,
          messageHash,
          context.poolId
        );
      } catch (error) {
        throw new ProofGenerationError(`Failed to generate ZK proof: ${error}`);
      }

      // Create paymaster data with real ZK proof
      const config = encodePaymasterConfig(PaymasterMode.VALIDATION_MODE, merkleRootIndex);
      
      const paymasterData = {
        config: config,
        poolId: context.poolId,
        proof: proof,
      };

      // Encode the paymaster data
      const encodedData = encodePaymasterData(paymasterData);
      
      // Create the final paymasterAndData: paymaster_address + encoded_data
      const finalPaymasterAndData = createPaymasterAndData(context.paymasterAddress, encodedData);

      return {
        paymasterAndData: finalPaymasterAndData,
        paymasterPostOpGasLimit: GAS_CONSTANTS.POST_OP_GAS_LIMIT.toString(),
        paymasterVerificationGasLimit: GAS_CONSTANTS.VERIFICATION_GAS_LIMIT.toString(),
      };
    } catch (error) {
      if (error instanceof PaymasterContextError || 
          error instanceof SubgraphError || 
          error instanceof PoolMembershipError || 
          error instanceof ProofGenerationError || 
          error instanceof NetworkError || 
          error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Failed to generate paymaster data: ${error}`);
    }
  }

  /**
   * Get the subgraph client for data layer access
   */
  getSubgraphClient(): SubgraphClient {
    if (!this.subgraphClient) {
      this.subgraphClient = SubgraphClient.createForNetwork(this.chainId, {
        url: this.options.subgraphUrl,
        timeout: this.options.timeout,
        debug: this.options.debug,
      });
    }
    return this.subgraphClient;
  }

  /**
   * Get the chain ID this client is configured for
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Get the current options
   */
  getOptions(): PrepaidGasPaymasterOptions {
    return { ...this.options };
  }
}
