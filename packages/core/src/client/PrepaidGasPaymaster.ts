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
  async getPaymasterData(_parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType> {
    // TODO: Implement paymaster data generation with ZK proof
    throw new Error('getPaymasterData not yet implemented');
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
