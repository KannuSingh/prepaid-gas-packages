import {
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType,
  GetPaymasterStubDataReturnType,
} from 'viem/account-abstraction';
import { parsePaymasterContext } from '../../utils';
import { GAS_LIMITED_POSTOP_GAS_LIMIT } from '@prepaid-gas/constants';
import { createPublicClient, http, PublicClient } from 'viem';
import { getChainById } from '../../utils';
import { GAS_LIMITED_PAYMASTER_ABI } from '@prepaid-gas/constants';
import { GetPaymasterStubDataV7Parameters } from '../index';
import { PaymasterHandler, PaymasterHandlerConfig } from './PaymasterHandler';
import { PaymasterHandlerUtils } from './PaymasterHandlerUtils';

/**
 * Handler for GasLimitedPaymaster contract
 *
 * Simple activation-only flow:
 * - Always requires ZK proof for real transactions
 * - Uses standard gas limits
 */
export class GasLimitedPaymasterHandler implements PaymasterHandler {
  private config: PaymasterHandlerConfig;
  private utils: PaymasterHandlerUtils;
  private publicClient: PublicClient;

  private joiningAmount: bigint;
  private scope: bigint;

  constructor(config: PaymasterHandlerConfig) {
    this.config = config;
    this.utils = new PaymasterHandlerUtils(config);

    const chain = getChainById(config.chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${config.chainId}`);
    }
    this.joiningAmount = this.config.preset.paymasters.GasLimitedPaymaster.joiningAmount;
    this.scope = this.config.preset.paymasters.GasLimitedPaymaster.scope;
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
  }

  getPaymasterAddress(): `0x${string}` {
    return this.config.preset?.paymasters.GasLimitedPaymaster.address;
  }

  getPaymasterType(): string {
    return 'GasLimitedPaymaster';
  }

  async getPaymasterStubData(parameters: GetPaymasterStubDataV7Parameters): Promise<GetPaymasterStubDataReturnType> {
    this.utils.validateStubDataParams(parameters);

    if ('initCode' in parameters) {
      throw new Error('v6-style UserOperation with initCode is not supported.');
    }

    const parsedContext = parsePaymasterContext(parameters.context as `0x${string}`);

    // Verify this handler handles the correct paymaster
    if (parsedContext.paymasterAddress !== this.getPaymasterAddress()) {
      throw new Error(
        `Handler mismatch: expected ${this.getPaymasterAddress()}, got ${parsedContext.paymasterAddress}`
      );
    }

    // Generate stub data for gas estimation
    const paymasterData = await this.utils.generateStubData();

    return {
      isFinal: false,
      paymaster: parsedContext.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit: GAS_LIMITED_POSTOP_GAS_LIMIT,
      sponsor: {
        name: 'Prepaid Gas Pool (Gas Limited)',
        icon: undefined,
      },
    };
  }

  async getPaymasterData(parameters: GetPaymasterDataParameters): Promise<GetPaymasterDataReturnType> {
    if ('initCode' in parameters) {
      throw new Error('v6-style UserOperation with initCode is not supported.');
    }

    const parsedContext = parsePaymasterContext(parameters.context as `0x${string}`);

    // Verify this handler handles the correct paymaster
    if (parsedContext.paymasterAddress !== this.getPaymasterAddress()) {
      throw new Error(
        `Handler mismatch: expected ${this.getPaymasterAddress()}, got ${parsedContext.paymasterAddress}`
      );
    }

    // Get live currentRootIndex
    const merkleRootIndex = await this.publicClient.readContract({
      abi: GAS_LIMITED_PAYMASTER_ABI,
      address: this.getPaymasterAddress(),
      functionName: 'currentRootIndex',
      args: [],
    });

    // Generate activation paymaster data with ZK proof
    const paymasterData = await this.utils.generateActivationPaymasterData(parameters, parsedContext, {
      merkleRootIndex,
      scope: this.scope,
    });

    return {
      paymaster: parsedContext.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit: GAS_LIMITED_POSTOP_GAS_LIMIT,
    };
  }
}
