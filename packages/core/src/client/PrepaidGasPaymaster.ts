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
        throw new Error('Paymaster context required for gas estimation');
      }

      // Parse the context to get paymaster address and pool ID
      const context = parsePaymasterContext(paymasterAndData as `0x${string}`);

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
      throw new Error(`Failed to generate paymaster stub data: ${error}`);
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
        throw new Error('Paymaster context required for transaction');
      }

      // Parse the context to get paymaster address, pool ID, and identity
      const context = parsePaymasterContext(paymasterAndData as `0x${string}`);

      // Create RPC client for contract interactions
      const rpcClient = createRpcClient(this.chainId, this.options.rpcUrl);

      // Get pool members from subgraph for ZK proof generation
      const subgraphClient = this.getSubgraphClient();
      const poolMembersResult = await subgraphClient.getPoolMembers(context.poolId);
      
      if (poolMembersResult.error || !poolMembersResult.data.poolMembers) {
        throw new Error(`Failed to fetch pool members: ${poolMembersResult.error || 'No members found'}`);
      }

      const poolMembers = poolMembersResult.data.poolMembers.map(m => m.identityCommitment);

      // Validate that the identity is a member of the pool
      const identityCommitment = getIdentityCommitmentFromHex(context.identityHex);
      if (!validatePoolMembership(identityCommitment, poolMembers)) {
        throw new Error('Identity is not a member of the specified pool');
      }

      // Get message hash from contract
      const messageHash = await getMessageHash(
        rpcClient,
        context.paymasterAddress,
        parameters.userOperation
      );

      // Get the latest merkle root index for the pool
      const merkleRootIndex = await getLatestMerkleRootIndex(
        rpcClient,
        context.paymasterAddress,
        context.poolId
      );

      // Generate ZK proof using Semaphore protocol
      const proof = await generatePoolMembershipProof(
        context.identityHex,
        poolMembers,
        messageHash,
        context.poolId
      );

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
      throw new Error(`Failed to generate paymaster data: ${error}`);
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
