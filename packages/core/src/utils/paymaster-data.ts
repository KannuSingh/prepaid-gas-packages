/**
 * Paymaster data utilities - focused on actual usage patterns
 */

import { encodeAbiParameters, parseAbiParameters, concat, type Hex } from 'viem';
import type { PaymasterData, PoolMembershipProof } from '@private-prepaid-gas/types';

/**
 * Paymaster modes (matches contract constants)
 */
export const PaymasterMode = {
  VALIDATION_MODE: 0,
  GAS_ESTIMATION_MODE: 1,
} as const;

/**
 * Gas constants (from contract)
 */
export const GAS_CONSTANTS = {
  POST_OP_GAS_LIMIT: 65000,
  VERIFICATION_GAS_LIMIT: 100000,
} as const;

/**
 * Encodes paymaster config (mode + merkleRootIndex packed into 32 bytes)
 * Following the exact pattern from the working website implementation
 */
export function encodePaymasterConfig(mode: number, merkleRootIndex: number = 0): Hex {
  // Pack merkleRootIndex and mode: BigInt(merkleRootIndex) | (BigInt(mode) << 32n)
  const config = BigInt(merkleRootIndex) | (BigInt(mode) << 32n);
  
  const encoded = encodeAbiParameters(
    parseAbiParameters(['uint256 config']),
    [config]
  );
  return encoded;
}

/**
 * Creates a dummy proof for gas estimation (all zeros)
 */
export function createDummyProof(): PoolMembershipProof {
  return {
    merkleTreeDepth: "20",
    merkleTreeRoot: `0x${"0".repeat(64)}`,
    nullifier: `0x${"0".repeat(64)}`,
    message: `0x${"0".repeat(64)}`,
    scope: `0x${"0".repeat(64)}`,
    points: ["0", "0", "0", "0", "0", "0", "0", "0"] as const,
  };
}

/**
 * Encodes paymaster data structure (config + poolId + proof)
 */
export function encodePaymasterData(data: PaymasterData): Hex {
  // Structure: config (32 bytes) + poolId (32 bytes) + proof (416 bytes)
  const proofEncoded = encodeAbiParameters(
    parseAbiParameters([
      'uint256 merkleTreeDepth',
      'bytes32 merkleTreeRoot', 
      'bytes32 nullifier',
      'bytes32 message',
      'bytes32 scope',
      'uint256[8] points'
    ]),
    [
      BigInt(data.proof.merkleTreeDepth),
      data.proof.merkleTreeRoot as Hex,
      data.proof.nullifier as Hex,
      data.proof.message as Hex,
      data.proof.scope as Hex,
      data.proof.points.map(p => BigInt(p)) as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    ]
  );

  // Concatenate: config + poolId + proof
  return concat([
    data.config as Hex,
    data.poolId as Hex,
    proofEncoded
  ]);
}

/**
 * Creates paymaster and data field: paymaster_address + encoded_data
 */
export function createPaymasterAndData(paymasterAddress: `0x${string}`, encodedData: Hex): `0x${string}` {
  return concat([paymasterAddress as Hex, encodedData]) as `0x${string}`;
}