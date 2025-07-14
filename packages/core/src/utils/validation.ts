import * as ViemChains from "viem/chains";
import {
  EXPECTED_PAYMASTER_DATA_SIZE,
  CONFIG_OFFSET,
  CONFIG_SIZE,
  POOL_ID_OFFSET,
  POOL_ID_SIZE,
  POOL_ROOT_HISTORY_SIZE,
} from "../constants";

/**
 * Get chain configuration by chain ID
 *
 * @param chainId - The chain ID to look up
 * @returns Chain configuration or undefined if not found
 *
 * @example
 * ```typescript
 * const chain = getChainById(84532); // Base Sepolia
 * if (chain) {
 *   console.log(chain.name); // "Base Sepolia"
 * }
 * ```
 */
export function getChainById(chainId: number): ViemChains.Chain | undefined {
  const chains: ViemChains.Chain[] = Object.values(ViemChains).filter(
    (c) => typeof c === "object" && c !== null && "id" in c,
  );
  return chains.find((chain) => chain.id === chainId);
}

/**
 * Validate the structure of paymaster data without throwing errors
 *
 * This function performs comprehensive validation of paymaster data structure
 * to ensure it conforms to the expected format before attempting to decode it.
 *
 * @param paymasterAndData - The paymasterAndData field from UserOperation
 * @returns True if data structure is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateDataStructure(userOp.paymasterAndData);
 * if (!isValid) {
 *   throw new Error('Invalid paymaster data structure');
 * }
 * ```
 */
export function validatePaymasterAndData(
  paymasterAndData: Uint8Array | string,
): boolean {
  try {
    // Convert to Uint8Array if string
    const data =
      typeof paymasterAndData === "string"
        ? new Uint8Array(Buffer.from(paymasterAndData.replace("0x", ""), "hex"))
        : paymasterAndData;

    // Basic length check
    if (data.length !== EXPECTED_PAYMASTER_DATA_SIZE) {
      return false;
    }

    // Check if we can extract config without issues
    if (data.length < CONFIG_OFFSET + CONFIG_SIZE) {
      return false;
    }

    // Extract and validate config manually
    const configBytes = data.slice(CONFIG_OFFSET, CONFIG_OFFSET + CONFIG_SIZE);
    const configData = bytesToBigInt(configBytes);

    // Check unused bits are zero (bits 33-255)
    if (configData >> 33n !== 0n) {
      return false;
    }

    // Check merkleRootIndex is valid (bits 0-31)
    const merkleRootIndex = Number(configData & BigInt(0xffffffff));
    if (merkleRootIndex >= POOL_ROOT_HISTORY_SIZE) {
      return false;
    }

    // Check mode is valid (bit 32) - should be 0 or 1
    const modeValue = Number((configData >> 32n) & 1n);
    if (modeValue > 1) {
      return false;
    }

    // Basic poolId check (should be extractable)
    if (data.length < POOL_ID_OFFSET + POOL_ID_SIZE) {
      return false;
    }

    return true;
  } catch (error) {
    // If any parsing fails, the data is invalid
    return false;
  }
}

/**
 * Convert bytes to BigInt (big-endian)
 *
 * @private
 * @param bytes - Byte array to convert
 * @returns BigInt representation
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}

/**
 * Validate that a pool ID is within acceptable range
 *
 * @param poolId - Pool ID to validate
 * @returns True if valid pool ID
 *
 * @example
 * ```typescript
 * const isValid = validatePoolId(123n);
 * ```
 */
export function validatePoolId(poolId: bigint): boolean {
  return poolId >= 0n && poolId <= BigInt(Number.MAX_SAFE_INTEGER);
}

/**
 * Validate merkle root index is within the valid range
 *
 * @param index - Root index to validate
 * @returns True if valid index
 *
 * @example
 * ```typescript
 * const isValid = validateMerkleRootIndex(5);
 * ```
 */
export function validateMerkleRootIndex(index: number): boolean {
  return (
    Number.isInteger(index) && index >= 0 && index < POOL_ROOT_HISTORY_SIZE
  );
}
