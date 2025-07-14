import {
  encodeAbiParameters,
  isHex,
  parseAbiParameters,
  toHex,
  concat,
  numberToHex,
  decodeAbiParameters,
} from "viem";
import type { Hex } from "viem";
import { POOL_ROOT_HISTORY_SIZE } from "../constants";
import { SemaphoreProof } from "@semaphore-protocol/proof";

/**
 * Prepaid Gas Paymaster operation modes
 */
export enum PrepaidGasPaymasterMode {
  /** Normal validation mode with real proofs */
  VALIDATION_MODE = 0,
  /** Gas estimation mode with dummy data */
  GAS_ESTIMATION_MODE = 1,
}


/**
 * Encode paymaster context with all required parameters for coupon/card system
 *
 * This creates the complete paymaster context that includes:
 * - Paymaster contract address
 * - Pool ID
 * - User's Semaphore identity (as bytes)
 *
 * @param paymasterAddress - Paymaster contract address
 * @param poolId - Pool ID (as string or bigint)
 * @param identity - Semaphore identity string (base64 encoded)
 * @returns Encoded paymaster context as hex string
 *
 * @example
 * ```typescript
 * const context = encodePaymasterContext(
 *   "0x123...abc",
 *   "1",
 *   "eyJrZXkiOiJ2YWx1ZSJ9"
 * );
 * ```
 */
export function encodePaymasterContext(
  paymasterAddress: Hex,
  poolId: string | bigint,
  identity: string,
): Hex {
  // Validate inputs
  if (!paymasterAddress || typeof paymasterAddress !== "string") {
    throw new Error(
      "Paymaster address is required and must be a valid hex string",
    );
  }

  if (!poolId || (typeof poolId === "string" && !poolId.trim())) {
    throw new Error("Pool ID is required");
  }

  if (!identity || typeof identity !== "string" || !identity.trim()) {
    throw new Error("Identity is required and must be a non-empty string");
  }

  // Convert poolId to bigint
  const poolIdBigInt = typeof poolId === "bigint" ? poolId : BigInt(poolId);

  // Convert identity string to bytes
  const identityBytes = toHex(identity);

  // Encode using the 3-parameter format that parseContext() expects:
  // (address paymasterAddress, uint256 poolId, bytes identity)
  return encodeAbiParameters(
    parseAbiParameters(
      "address paymasterAddress, uint256 poolId, bytes identity",
    ),
    [paymasterAddress, poolIdBigInt, identityBytes],
  );
}

/**
 * Encode paymaster configuration according to contract format
 * Packs: merkleRootIndex (bits 0-31) + mode (bit 32) + reserved (bits 33-255)
 *
 * @param merkleRootIndex - Index in the root history (0-63)
 * @param mode - Paymaster operation mode
 * @returns Encoded configuration as bigint
 *
 * @example
 * ```typescript
 * const config = encodeConfig(5, PrepaidGasPaymasterMode.VALIDATION_MODE);
 * ```
 */
export function encodeConfig(
  merkleRootIndex: number,
  mode: PrepaidGasPaymasterMode,
): bigint {
  if (merkleRootIndex >= POOL_ROOT_HISTORY_SIZE) {
    throw new Error(
      `Invalid merkleRootIndex: must be less than ${POOL_ROOT_HISTORY_SIZE}`,
    );
  }

  if (
    mode !== PrepaidGasPaymasterMode.VALIDATION_MODE &&
    mode !== PrepaidGasPaymasterMode.GAS_ESTIMATION_MODE
  ) {
    throw new Error("Invalid mode");
  }

  // Pack: merkleRootIndex (bits 0-31) + mode (bit 32) + reserved (bits 33-255)
  return BigInt(merkleRootIndex) | (BigInt(mode) << 32n);
}

/**
 * Decode paymaster configuration
 *
 * @param config - Encoded configuration as bigint
 * @returns Decoded merkle root index and mode
 *
 * @example
 * ```typescript
 * const { merkleRootIndex, mode } = decodeConfig(config);
 * ```
 */
export function decodeConfig(config: bigint): {
  merkleRootIndex: number;
  mode: PrepaidGasPaymasterMode;
} {
  // Validate unused bits are zero (bits 33-255)
  if (config >> 33n !== 0n) {
    throw new Error("Invalid config format: unused bits must be zero");
  }

  // Extract merkleRootIndex (bits 0-31)
  const merkleRootIndex = Number(config & BigInt(0xffffffff));

  // Extract mode (bit 32)
  const modeValue = Number((config >> 32n) & 1n);
  const mode = modeValue as PrepaidGasPaymasterMode;

  // Validate merkleRootIndex
  if (merkleRootIndex >= POOL_ROOT_HISTORY_SIZE) {
    throw new Error(
      `Invalid merkleRootIndex: must be less than ${POOL_ROOT_HISTORY_SIZE}`,
    );
  }

  return { merkleRootIndex, mode };
}

/**
 * Generate complete paymaster data for UserOperation
 *
 * @param mode - Operation mode (validation or estimation)
 * @param poolId - Pool ID to use for the operation
 * @param semaphoreProof - Semaphore zero-knowledge proof
 * @param merkleRootIndex - Index of the merkle root in pool history
 * @returns Encoded paymaster data as hex string
 *
 * @example
 * ```typescript
 * const paymasterData = await generatePaymasterData(
 *   PrepaidGasPaymasterMode.VALIDATION_MODE,
 *   123n,
 *   proof,
 *   5
 * );
 * ```
 */
export async function generatePaymasterData(
  mode: PrepaidGasPaymasterMode,
  poolId: bigint,
  semaphoreProof: SemaphoreProof,
  merkleRootIndex: number,
): Promise<Hex> {
  const proof = {
    merkleTreeDepth: BigInt(semaphoreProof.merkleTreeDepth),
    merkleTreeRoot: BigInt(semaphoreProof.merkleTreeRoot),
    nullifier: BigInt(semaphoreProof.nullifier),
    message: BigInt(semaphoreProof.message),
    scope: BigInt(semaphoreProof.scope),
    points: semaphoreProof.points as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ],
  };

  // Encode config (32 bytes) - matches the contract's encodeConfig
  const config = encodeConfig(merkleRootIndex, mode);
  const configBytes = numberToHex(config, { size: 32 });

  // Encode poolId (32 bytes)
  const poolIdBytes = numberToHex(poolId, { size: 32 });

  // Encode proof using abi.encode (416 bytes) - matches contract's abi.encode(data.proof)
  const encodedProof = encodeAbiParameters(
    [
      {
        name: "proof",
        type: "tuple",
        components: [
          { name: "merkleTreeDepth", type: "uint256" },
          { name: "merkleTreeRoot", type: "uint256" },
          { name: "nullifier", type: "uint256" },
          { name: "message", type: "uint256" },
          { name: "scope", type: "uint256" },
          { name: "points", type: "uint256[8]" },
        ],
      },
    ],
    [proof],
  );

  // Use concat to simulate abi.encodePacked: config + poolId + encodedProof
  // This matches the contract's: abi.encodePacked(config, data.poolId, encodedProof)
  return concat([configBytes, poolIdBytes, encodedProof]);
}

/**
 * Parsed context data from paymaster parameters
 */
export interface ParsedPaymasterContext {
  /** Paymaster contract address */
  paymasterAddress: `0x${string}`;
  /** Pool ID for the operation */
  poolId: bigint;
  /** Identity string for proof generation */
  identityHex: `0x${string}`;
}

/**
 * Parse paymaster context data
 *
 * Supports context format: (address paymasterAddress, uint256 poolId, bytes identity)
 *
 * @param context - Encoded context data as hex string
 * @returns Parsed context information
 *
 * @example
 * ```typescript
 * import { parsePaymasterContext } from "@workspace/core";
 *
 * const parsed = parsePaymasterContext("0x123...");
 * console.log(parsed.poolId); // bigint
 * console.log(parsed.paymasterAddress); // "0x..."
 * ```
 */
export function parsePaymasterContext(
  context: `0x${string}`,
): ParsedPaymasterContext {
  if (!context) {
    throw new Error("Context cannot be empty");
  }

  try {
    // Parse context with identity (3 parameters)
    const [paymasterAddress, poolId, identityHex] = decodeAbiParameters(
      parseAbiParameters(
        "address paymasterAddress, uint256 poolId, bytes identity",
      ),
      context,
    );

    return {
      paymasterAddress,
      poolId,
      identityHex,
    };
  } catch (error) {
    throw new Error(
      `Invalid context format: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
