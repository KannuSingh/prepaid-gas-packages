/**
 * @fileoverview Encoding Utilities
 *
 * Comprehensive utilities for encoding and decoding paymaster data structures,
 * user operations, proofs, and other contract-related data.
 */

import { encodeAbiParameters, decodeAbiParameters, parseAbiParameters, keccak256, toHex, fromHex, size, slice, concat, pad, type Hex } from "viem";

import {
    type HexString,
    type BigNumberish,
    type Address,
    type PackedUserOperation,
    type PoolMembershipProof,
    type PaymasterData,
    type PaymasterContext,
    CONSTANTS,
} from "@private-prepaid-gas/types";

/**
 * ABI parameter types for encoding/decoding
 */
const PAYMASTER_DATA_TYPES = parseAbiParameters([
    "bytes32 config", // 32 bytes
    "bytes32 poolId", // 32 bytes
    "uint256 merkleTreeDepth", // 32 bytes
    "bytes32 merkleTreeRoot", // 32 bytes
    "bytes32 nullifier", // 32 bytes
    "bytes32 message", // 32 bytes
    "bytes32 scope", // 32 bytes
    "uint256[8] points", // 256 bytes (8 * 32)
]);

const USER_OP_TYPES = parseAbiParameters([
    "address sender",
    "uint256 nonce",
    "bytes initCode",
    "bytes callData",
    "bytes32 accountGasLimits",
    "uint256 preVerificationGas",
    "bytes32 gasFees",
    "bytes paymasterAndData",
    "bytes signature",
]);

const PROOF_TYPES = parseAbiParameters([
    "uint256 merkleTreeDepth",
    "bytes32 merkleTreeRoot",
    "bytes32 nullifier",
    "bytes32 message",
    "bytes32 scope",
    "uint256[8] points",
]);

/**
 * Encoding result with metadata
 */
export interface EncodingResult {
    /** The encoded data as hex string */
    readonly encoded: HexString;
    /** Size of the encoded data in bytes */
    readonly size: number;
    /** Breakdown of the encoding */
    readonly breakdown: {
        readonly config?: number;
        readonly poolId?: number;
        readonly proof?: number;
        readonly total: number;
    };
}

/**
 * Decoding result with validation
 */
export interface DecodingResult<T> {
    /** The decoded data */
    readonly decoded: T;
    /** Whether the decoding was successful */
    readonly isValid: boolean;
    /** Any validation errors encountered */
    readonly errors: readonly string[];
}

/**
 * Paymaster data encoder/decoder utilities
 */
export class PaymasterDataEncoder {
    /**
     * Encodes paymaster data into the format expected by the paymaster contract
     *
     * @param data - The paymaster data to encode
     * @returns Encoding result with encoded data and metadata
     *
     * @example
     * ```typescript
     * const data: PaymasterData = {
     *   config: '0x1234...',
     *   poolId: '0x5678...',
     *   proof: { ... }
     * };
     *
     * const result = PaymasterDataEncoder.encode(data);
     * console.log(result.encoded); // '0x1234567890abcdef...'
     * console.log(result.size);    // 480
     * ```
     */
    static encode(data: PaymasterData): EncodingResult {
        try {
            // Ensure config is exactly 32 bytes
            const config = pad(data.config as Hex, { size: 32 });

            // Ensure pool ID is exactly 32 bytes
            const poolId = pad(data.poolId as Hex, { size: 32 });

            // Encode the proof structure
            const encodedProof = this.encodeProof(data.proof);

            // Concatenate all parts
            const encoded = concat([config, poolId, encodedProof.encoded as Hex]);

            const breakdown = {
                config: 32,
                poolId: 32,
                proof: encodedProof.size,
                total: size(encoded),
            };

            return {
                encoded: encoded as HexString,
                size: breakdown.total,
                breakdown,
            };
        } catch (error) {
            throw new Error(`Failed to encode paymaster data: ${error}`);
        }
    }

    /**
     * Decodes paymaster data from the contract format
     *
     * @param encoded - The encoded paymaster data
     * @returns Decoding result with decoded data and validation info
     *
     * @example
     * ```typescript
     * const encoded = '0x1234567890abcdef...';
     * const result = PaymasterDataEncoder.decode(encoded);
     *
     * if (result.isValid) {
     *   console.log(result.decoded.poolId);
     *   console.log(result.decoded.proof.nullifier);
     * }
     * ```
     */
    static decode(encoded: HexString): DecodingResult<PaymasterData> {
        const errors: string[] = [];

        try {
            const data = encoded as Hex;
            const dataSize = size(data);

            // Validate total size
            if (dataSize !== CONSTANTS.PAYMASTER_DATA_SIZE) {
                errors.push(`Invalid data size: expected ${CONSTANTS.PAYMASTER_DATA_SIZE} bytes, got ${dataSize}`);
            }

            // Extract components
            const config = slice(data, 0, 32);
            const poolId = slice(data, 32, 64);
            const proofData = slice(data, 64);

            // Decode proof
            const proofResult = this.decodeProof(proofData as HexString);
            if (!proofResult.isValid) {
                errors.push(...proofResult.errors);
            }

            const decoded: PaymasterData = {
                config: config as HexString,
                poolId: poolId as HexString,
                proof: proofResult.decoded,
            };

            return {
                decoded,
                isValid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push(`Decoding failed: ${error}`);

            return {
                decoded: {} as PaymasterData,
                isValid: false,
                errors,
            };
        }
    }

    /**
     * Encodes a pool membership proof
     *
     * @param proof - The proof to encode
     * @returns Encoding result
     */
    static encodeProof(proof: PoolMembershipProof): EncodingResult {
        try {
            const encoded = encodeAbiParameters(PROOF_TYPES, [
                BigInt(proof.merkleTreeDepth),
                proof.merkleTreeRoot as Hex,
                proof.nullifier as Hex,
                proof.message as Hex,
                proof.scope as Hex,
                proof.points.map((p) => BigInt(p)) as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
            ]);

            return {
                encoded: encoded as HexString,
                size: size(encoded),
                breakdown: { total: size(encoded) },
            };
        } catch (error) {
            throw new Error(`Failed to encode proof: ${error}`);
        }
    }

    /**
     * Decodes a pool membership proof
     *
     * @param encoded - The encoded proof data
     * @returns Decoding result
     */
    static decodeProof(encoded: HexString): DecodingResult<PoolMembershipProof> {
        const errors: string[] = [];

        try {
            const decoded = decodeAbiParameters(PROOF_TYPES, encoded as Hex);

            const proof: PoolMembershipProof = {
                merkleTreeDepth: decoded[0].toString(),
                merkleTreeRoot: decoded[1] as HexString,
                nullifier: decoded[2] as HexString,
                message: decoded[3] as HexString,
                scope: decoded[4] as HexString,
                points: decoded[5].map((p) => p.toString()) as readonly [string, string, string, string, string, string, string, string],
            };

            // Validate proof structure
            if (proof.points.length !== 8) {
                errors.push(`Invalid points array length: expected 8, got ${proof.points.length}`);
            }

            return {
                decoded: proof,
                isValid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push(`Failed to decode proof: ${error}`);

            return {
                decoded: {} as PoolMembershipProof,
                isValid: false,
                errors,
            };
        }
    }

    /**
     * Validates the structure and size of encoded paymaster data
     *
     * @param encoded - The encoded data to validate
     * @returns Validation result
     */
    static validate(encoded: HexString): { isValid: boolean; errors: readonly string[] } {
        const errors: string[] = [];

        try {
            const data = encoded as Hex;
            const dataSize = size(data);

            // Check total size
            if (dataSize !== CONSTANTS.PAYMASTER_DATA_SIZE) {
                errors.push(`Invalid paymaster data size: expected ${CONSTANTS.PAYMASTER_DATA_SIZE} bytes, got ${dataSize}`);
            }

            // Check if it starts with 0x
            if (!encoded.startsWith("0x")) {
                errors.push("Encoded data must be a valid hex string starting with 0x");
            }

            // Validate proof portion
            if (dataSize >= 64) {
                const proofData = slice(data, 64);
                const proofResult = this.decodeProof(proofData as HexString);
                if (!proofResult.isValid) {
                    errors.push(...proofResult.errors.map((e) => `Proof validation: ${e}`));
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push(`Validation failed: ${error}`);
            return { isValid: false, errors };
        }
    }
}

/**
 * User operation encoder/decoder utilities
 */
export class UserOperationEncoder {
    /**
     * Encodes a packed user operation for contract calls
     *
     * @param userOp - The user operation to encode
     * @returns Encoding result
     */
    static encode(userOp: PackedUserOperation): EncodingResult {
        try {
            const encoded = encodeAbiParameters(USER_OP_TYPES, [
                userOp.sender as Address,
                BigInt(userOp.nonce),
                userOp.initCode as Hex,
                userOp.callData as Hex,
                userOp.accountGasLimits as Hex,
                BigInt(userOp.preVerificationGas),
                userOp.gasFees as Hex,
                userOp.paymasterAndData as Hex,
                userOp.signature as Hex,
            ]);

            return {
                encoded: encoded as HexString,
                size: size(encoded),
                breakdown: { total: size(encoded) },
            };
        } catch (error) {
            throw new Error(`Failed to encode user operation: ${error}`);
        }
    }

    /**
     * Decodes a packed user operation from contract format
     *
     * @param encoded - The encoded user operation
     * @returns Decoding result
     */
    static decode(encoded: HexString): DecodingResult<PackedUserOperation> {
        const errors: string[] = [];

        try {
            const decoded = decodeAbiParameters(USER_OP_TYPES, encoded as Hex);

            const userOp: PackedUserOperation = {
                sender: decoded[0] as string,
                nonce: decoded[1].toString(),
                initCode: decoded[2] as HexString,
                callData: decoded[3] as HexString,
                accountGasLimits: decoded[4] as HexString,
                preVerificationGas: decoded[5].toString(),
                gasFees: decoded[6] as HexString,
                paymasterAndData: decoded[7] as HexString,
                signature: decoded[8] as HexString,
            };

            return {
                decoded: userOp,
                isValid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push(`Failed to decode user operation: ${error}`);

            return {
                decoded: {} as PackedUserOperation,
                isValid: false,
                errors,
            };
        }
    }

    /**
     * Calculates the hash of a user operation
     *
     * @param userOp - The user operation to hash
     * @param entryPoint - The entry point address
     * @param chainId - The chain ID
     * @returns The user operation hash
     */
    static hash(userOp: PackedUserOperation, entryPoint: Address, chainId: number): HexString {
        try {
            // Encode user operation for hashing
            const encodedUserOp = this.encode(userOp);

            // Create hash input with entry point and chain ID
            const hashInput = encodeAbiParameters(parseAbiParameters(["bytes userOp", "address entryPoint", "uint256 chainId"]), [
                encodedUserOp.encoded as Hex,
                entryPoint as Address,
                BigInt(chainId),
            ]);

            return keccak256(hashInput) as HexString;
        } catch (error) {
            throw new Error(`Failed to hash user operation: ${error}`);
        }
    }

    /**
     * Validates a user operation structure
     *
     * @param userOp - The user operation to validate
     * @returns Validation result
     */
    static validate(userOp: PackedUserOperation): { isValid: boolean; errors: readonly string[] } {
        const errors: string[] = [];

        // Validate sender address
        if (!userOp.sender || !/^0x[a-fA-F0-9]{40}$/.test(userOp.sender)) {
            errors.push("Invalid sender address");
        }

        // Validate nonce
        if (!userOp.nonce || isNaN(Number(userOp.nonce))) {
            errors.push("Invalid nonce");
        }

        // Validate hex strings
        const hexFields = ["initCode", "callData", "accountGasLimits", "gasFees", "paymasterAndData", "signature"] as const;

        for (const field of hexFields) {
            if (!userOp[field] || !userOp[field].startsWith("0x")) {
                errors.push(`Invalid ${field}: must be a hex string starting with 0x`);
            }
        }

        // Validate preVerificationGas
        if (!userOp.preVerificationGas || isNaN(Number(userOp.preVerificationGas))) {
            errors.push("Invalid preVerificationGas");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * General encoding utilities for various data types
 */
export class EncodingUtils {
    /**
     * Encodes a BigNumberish value to a 32-byte hex string
     *
     * @param value - The value to encode
     * @returns 32-byte hex string
     */
    static encodeBigNumberish(value: BigNumberish): HexString {
        try {
            return pad(toHex(BigInt(value.toString())), { size: 32 }) as HexString;
        } catch (error) {
            throw new Error(`Failed to encode BigNumberish: ${error}`);
        }
    }

    /**
     * Decodes a 32-byte hex string to a BigNumberish
     *
     * @param encoded - The encoded value
     * @returns BigNumberish value
     */
    static decodeBigNumberish(encoded: HexString): BigNumberish {
        try {
            return BigInt(encoded).toString();
        } catch (error) {
            throw new Error(`Failed to decode BigNumberish: ${error}`);
        }
    }

    /**
     * Encodes an address to a 32-byte hex string (left-padded)
     *
     * @param address - The address to encode
     * @returns 32-byte hex string
     */
    static encodeAddress(address: Address): HexString {
        try {
            return pad(address as Hex, { size: 32 }) as HexString;
        } catch (error) {
            throw new Error(`Failed to encode address: ${error}`);
        }
    }

    /**
     * Decodes a 32-byte hex string to an address
     *
     * @param encoded - The encoded address
     * @returns Address
     */
    static decodeAddress(encoded: HexString): Address {
        try {
            // Take the last 20 bytes (40 hex characters + 0x)
            return slice(encoded as Hex, 12, 32) as Address;
        } catch (error) {
            throw new Error(`Failed to decode address: ${error}`);
        }
    }

    /**
     * Encodes an array of bytes32 values
     *
     * @param values - Array of hex strings to encode
     * @returns Encoded array
     */
    static encodeBytes32Array(values: readonly HexString[]): HexString {
        try {
            const encoded = encodeAbiParameters(parseAbiParameters(["bytes32[]"]), [values as readonly Hex[]]);
            return encoded as HexString;
        } catch (error) {
            throw new Error(`Failed to encode bytes32 array: ${error}`);
        }
    }

    /**
     * Decodes an array of bytes32 values
     *
     * @param encoded - The encoded array
     * @returns Array of hex strings
     */
    static decodeBytes32Array(encoded: HexString): readonly HexString[] {
        try {
            const decoded = decodeAbiParameters(parseAbiParameters(["bytes32[]"]), encoded as Hex);
            return decoded[0] as readonly HexString[];
        } catch (error) {
            throw new Error(`Failed to decode bytes32 array: ${error}`);
        }
    }

    /**
     * Concatenates multiple hex strings
     *
     * @param values - Array of hex strings to concatenate
     * @returns Concatenated hex string
     */
    static concatHex(values: readonly HexString[]): HexString {
        try {
            return concat(values as readonly Hex[]) as HexString;
        } catch (error) {
            throw new Error(`Failed to concatenate hex strings: ${error}`);
        }
    }

    /**
     * Splits a hex string into chunks of specified size
     *
     * @param data - The hex string to split
     * @param chunkSize - Size of each chunk in bytes
     * @returns Array of hex string chunks
     */
    static splitHex(data: HexString, chunkSize: number): readonly HexString[] {
        try {
            const chunks: HexString[] = [];
            const totalSize = size(data as Hex);

            for (let i = 0; i < totalSize; i += chunkSize) {
                const chunk = slice(data as Hex, i, i + chunkSize);
                chunks.push(chunk as HexString);
            }

            return chunks;
        } catch (error) {
            throw new Error(`Failed to split hex string: ${error}`);
        }
    }

    /**
     * Validates that a string is a valid hex string
     *
     * @param value - The string to validate
     * @param expectedSize - Expected size in bytes (optional)
     * @returns Validation result
     */
    static validateHex(value: string, expectedSize?: number): { isValid: boolean; errors: readonly string[] } {
        const errors: string[] = [];

        if (!value.startsWith("0x")) {
            errors.push("Hex string must start with 0x");
        }

        if (!/^0x[a-fA-F0-9]*$/.test(value)) {
            errors.push("Invalid hex string format");
        }

        if (expectedSize !== undefined) {
            const actualSize = (value.length - 2) / 2; // Remove 0x and divide by 2
            if (actualSize !== expectedSize) {
                errors.push(`Expected ${expectedSize} bytes, got ${actualSize} bytes`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Creates a paymaster data encoder instance with configuration
 *
 * @param config - Optional configuration for the encoder
 * @returns PaymasterDataEncoder class
 */
export function createPaymasterDataEncoder(config?: { validateOnEncode?: boolean }): typeof PaymasterDataEncoder {
    // In the future, this could return a configured instance
    // For now, we just return the class
    return PaymasterDataEncoder;
}

/**
 * Creates a user operation encoder instance with configuration
 *
 * @param config - Optional configuration for the encoder
 * @returns UserOperationEncoder class
 */
export function createUserOperationEncoder(config?: { validateOnEncode?: boolean }): typeof UserOperationEncoder {
    // In the future, this could return a configured instance
    // For now, we just return the class
    return UserOperationEncoder;
}
