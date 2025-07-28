import {
  GetPaymasterDataParameters,
  GetPaymasterDataReturnType,
  GetPaymasterStubDataReturnType,
} from 'viem/account-abstraction';
import {
  createPublicClient,
  encodeAbiParameters,
  encodePacked,
  http,
  keccak256,
  parseAbiParameters,
  PublicClient,
} from 'viem';
import { parsePaymasterContext } from '../../utils';
import {
  CACHE_ACTIVATION_POSTOP_GAS_LIMIT,
  CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI,
  CACHED_POSTOP_GAS_LIMIT,
} from '@prepaid-gas/constants';
import { GetPaymasterStubDataV7Parameters } from '../index';
import { PaymasterHandler, PaymasterHandlerConfig } from './PaymasterHandler';
import { PaymasterHandlerUtils } from './PaymasterHandlerUtils';
import { getChainById } from '../../utils';

// Gas cost constants - measured from actual usage
const AVERAGE_CACHED_FLOW_GAS_COST = 150_000n;

/**
 * Cache vs Activation flow decision result
 */
interface FlowDecision {
  useCachedFlow: boolean;
  totalAvailableGas: bigint;
  gasThreshold: bigint;
  hasActivatedNullifiers: boolean;
}

/**
 * Handler for CacheEnabledGasLimitedPaymaster contract
 *
 * Advanced dual-flow system:
 * - Cached flow: Fast, low gas for users with activated nullifiers
 * - Activation flow: Full ZK proof for new users or when cache is insufficient
 * - Dynamic flow selection based on user state and gas availability
 */
export class CacheEnabledGasLimitedPaymasterHandler implements PaymasterHandler {
  private config: PaymasterHandlerConfig;
  private publicClient: PublicClient;
  private utils: PaymasterHandlerUtils;

  // Permanent contract data fetched once during initialization
  private joiningAmount: bigint;
  private scope: bigint;

  constructor(config: PaymasterHandlerConfig) {
    this.config = config;
    this.utils = new PaymasterHandlerUtils(config);

    const chain = getChainById(config.chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${config.chainId}`);
    }
    this.joiningAmount = this.config.preset.paymasters.CacheEnabledGasLimitedPaymaster.joiningAmount;
    this.scope = this.config.preset.paymasters.CacheEnabledGasLimitedPaymaster.scope;
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
  }

  getPaymasterAddress(): `0x${string}` {
    return this.config.preset?.paymasters.CacheEnabledGasLimitedPaymaster.address;
  }

  getPaymasterType(): string {
    return 'CacheEnabledGasLimitedPaymaster';
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

    // Determine flow type
    const flowDecision = await this.determineFlow(
      parsedContext.paymasterAddress,
      parameters.sender,
      parameters.maxFeePerGas,
      parameters.maxPriorityFeePerGas
    );

    let paymasterData: `0x${string}`;
    let paymasterPostOpGasLimit: bigint;

    if (flowDecision.useCachedFlow) {
      // Generate cached stub data with mode 1 (ESTIMATION)
      paymasterData = this.generateCachedPaymasterData(1); // 1 = ESTIMATION
      paymasterPostOpGasLimit = CACHED_POSTOP_GAS_LIMIT;
    } else {
      // Generate activation stub data
      paymasterData = await this.utils.generateStubData();
      paymasterPostOpGasLimit = CACHE_ACTIVATION_POSTOP_GAS_LIMIT;
    }

    return {
      isFinal: false,
      paymaster: parsedContext.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit,
      sponsor: {
        name: 'Prepaid Gas Pool (Cache Enabled)',
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

    // Determine flow type
    const flowDecision = await this.determineFlow(
      parsedContext.paymasterAddress,
      parameters.sender,
      parameters.maxFeePerGas,
      parameters.maxPriorityFeePerGas
    );

    let paymasterData: `0x${string}`;
    let paymasterPostOpGasLimit: bigint;

    if (flowDecision.useCachedFlow) {
      // Generate cached data with mode 0 (VALIDATION)
      paymasterData = this.generateCachedPaymasterData(0); // 0 = VALIDATION
      paymasterPostOpGasLimit = CACHED_POSTOP_GAS_LIMIT;
    } else {
      // Get live currentRootIndex for activation flow
      const merkleRootIndex = await this.publicClient.readContract({
        abi: CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI,
        address: this.getPaymasterAddress(),
        functionName: 'currentRootIndex',
        args: [],
      });

      // Generate activation data with ZK proof
      paymasterData = await this.utils.generateActivationPaymasterData(
        parameters,
        {
          paymasterAddress: parsedContext.paymasterAddress,
          identityHex: parsedContext.identityHex,
        },
        { merkleRootIndex, scope: this.scope }
      );
      paymasterPostOpGasLimit = CACHE_ACTIVATION_POSTOP_GAS_LIMIT;
    }

    return {
      paymaster: parsedContext.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit,
    };
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Determine whether to use cached or activation flow
   */
  private async determineFlow(
    paymasterAddress: `0x${string}`,
    sender: `0x${string}`,
    maxFeePerGas?: bigint,
    maxPriorityFeePerGas?: bigint
  ): Promise<FlowDecision> {
    // Get user state
    const userNullifiersState = await this.publicClient.readContract({
      abi: CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI,
      address: paymasterAddress,
      functionName: 'userNullifiersStates',
      args: [sender],
    });

    const decodedState = this.decodeNullifierState(userNullifiersState);
    const hasActivatedNullifiers = decodedState.activatedNullifierCount > 0;

    if (!hasActivatedNullifiers) {
      return {
        useCachedFlow: false,
        totalAvailableGas: 0n,
        gasThreshold: 0n,
        hasActivatedNullifiers: false,
      };
    }

    // Prepare all nullifier keys and parallel contract reads
    const nullifierKeys = Array.from({ length: 2 }, (_, j) =>
      keccak256(encodeAbiParameters(parseAbiParameters('address, uint8'), [sender, j]))
    );

    // Parallel fetch all nullifiers
    const nullifiers = await Promise.all(
      nullifierKeys.map((nullifierKey) =>
        this.publicClient.readContract({
          abi: CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI,
          address: paymasterAddress,
          functionName: 'userNullifiers',
          args: [nullifierKey],
        })
      )
    );

    // Parallel fetch gas usage for non-zero nullifiers
    const gasUsagePromises = nullifiers.map((nullifier) =>
      nullifier > 0n
        ? this.publicClient.readContract({
            abi: CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI,
            address: paymasterAddress,
            functionName: 'nullifierGasUsage',
            args: [nullifier],
          })
        : Promise.resolve(0n)
    );

    const gasUsages = await Promise.all(gasUsagePromises);

    // Calculate total available gas
    let totalAvailable = 0n;
    for (let j = 0; j < nullifiers.length; j++) {
      if (nullifiers[j] > 0n) {
        const used = gasUsages[j];
        const available = this.joiningAmount > used ? this.joiningAmount - used : 0n;
        totalAvailable += available;
      }
    }

    // Calculate gas threshold with parallel block/fee fetching if needed
    let effectiveGasPrice = 0n;
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      const [block, fee] = await Promise.all([this.publicClient.getBlock(), this.publicClient.estimateFeesPerGas()]);

      const baseFeePerGas = block.baseFeePerGas!;
      effectiveGasPrice =
        fee.maxFeePerGas < baseFeePerGas + fee.maxPriorityFeePerGas
          ? fee.maxFeePerGas
          : baseFeePerGas + fee.maxPriorityFeePerGas;
    } else {
      const block = await this.publicClient.getBlock();
      const baseFeePerGas = block.baseFeePerGas!;
      effectiveGasPrice =
        maxFeePerGas < baseFeePerGas + maxPriorityFeePerGas ? maxFeePerGas : baseFeePerGas + maxPriorityFeePerGas;
    }

    const gasThreshold = AVERAGE_CACHED_FLOW_GAS_COST * effectiveGasPrice * 2n;
    const hasEnoughGas = totalAvailable > gasThreshold;

    return {
      useCachedFlow: hasEnoughGas,
      totalAvailableGas: totalAvailable,
      gasThreshold,
      hasActivatedNullifiers: true,
    };
  }

  /**
   * Generate cached paymaster data (1 byte mode only)
   * The contract expects just the mode byte for cached flow
   */
  private generateCachedPaymasterData(mode: number): `0x${string}` {
    return encodePacked(['uint8'], [mode]);
  }

  /**
   * Decode nullifier state from packed uint256
   */
  private decodeNullifierState(flags: bigint) {
    return {
      activatedNullifierCount: Number(flags & 0xffn),
      exhaustedSlotIndex: Number((flags >> 8n) & 0xffn),
      hasAvailableExhaustedSlot: ((flags >> 16n) & 1n) !== 0n,
    };
  }
}
