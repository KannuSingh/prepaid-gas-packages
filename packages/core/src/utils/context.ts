/**
 * Simple paymaster context utilities based on actual usage patterns
 */

import { encodeAbiParameters, decodeAbiParameters, parseAbiParameters, type Hex } from 'viem';

/**
 * Parsed paymaster context result
 */
export interface ParsedPaymasterContext {
  paymasterAddress: `0x${string}`;
  poolId: string;
  identityHex: string;
}

/**
 * Encodes paymaster context for use in applications
 * Format: (address paymasterAddress, uint256 poolId, bytes identity)
 * 
 * This is the primary context encoding used by applications
 */
export function encodePaymasterContext(
  paymasterAddress: `0x${string}`,
  poolId: string | bigint,
  identity: string
): `0x${string}` {
  try {
    const encoded = encodeAbiParameters(
      parseAbiParameters(['address paymasterAddress', 'uint256 poolId', 'bytes identity']),
      [
        paymasterAddress,
        typeof poolId === 'string' ? BigInt(poolId) : poolId,
        identity as Hex,
      ]
    );
    return encoded as `0x${string}`;
  } catch (error) {
    throw new Error(`Failed to encode paymaster context: ${error}`);
  }
}

/**
 * Parses paymaster context back to components
 */
export function parsePaymasterContext(context: `0x${string}`): ParsedPaymasterContext {
  try {
    const [paymasterAddress, poolId, identityHex] = decodeAbiParameters(
      parseAbiParameters(['address paymasterAddress', 'uint256 poolId', 'bytes identity']),
      context
    );

    return {
      paymasterAddress: paymasterAddress as `0x${string}`,
      poolId: poolId.toString(),
      identityHex: identityHex as string,
    };
  } catch (error) {
    throw new Error(`Failed to parse paymaster context: ${error}`);
  }
}

/**
 * Paymaster operation modes used by applications
 */
export const PrepaidGasPaymasterMode = {
  VALIDATION_MODE: 0,
  GAS_ESTIMATION_MODE: 1,
} as const;

export type PrepaidGasPaymasterModeType = typeof PrepaidGasPaymasterMode[keyof typeof PrepaidGasPaymasterMode];