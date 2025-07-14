/**
 * Contract interaction utilities
 * For getting message hash and other contract calls
 */

import { createPublicClient, http, type PublicClient, type Hex, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import type { PackedUserOperation } from '@private-prepaid-gas/types';

/**
 * Get default RPC URL for supported chains
 */
function getDefaultRpcUrl(chainId: number): string {
  switch (chainId) {
    case 8453: // Base
      return 'https://mainnet.base.org';
    case 84532: // Base Sepolia
      return 'https://sepolia.base.org';
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

/**
 * Creates a public client for the specified chain
 */
export function createRpcClient(chainId: number, rpcUrl?: string): PublicClient {
  return createPublicClient({
    transport: http(rpcUrl || getDefaultRpcUrl(chainId)),
  });
}

/**
 * Computes the message hash locally without RPC calls
 * This replicates the DataLib._getMessageHash logic from the contract
 * This hash is used as the message in the Semaphore proof
 */
export function getMessageHash(
  chainId: number,
  entryPointAddress: `0x${string}`,
  userOp: PackedUserOperation
): Hex {
  try {
    // PAYMASTER_DATA_OFFSET = 52 from Constants.sol (20 + 16 + 16 bytes)
    const PAYMASTER_DATA_OFFSET = 52;
    
    // Extract only the portion before custom paymaster data (first 52 bytes) from paymasterAndData
    const paymasterAndDataBytes = userOp.paymasterAndData.slice(2); // Remove 0x
    const paymasterOnlyData = '0x' + paymasterAndDataBytes.slice(0, PAYMASTER_DATA_OFFSET * 2);
    
    // Replicate the DataLib._getMessageHash logic:
    // keccak256(abi.encode(
    //   keccak256(abi.encode(
    //     sender, nonce, initCode_hash, callData_hash,
    //     accountGasLimits, preVerificationGas, gasFees,
    //     paymasterAndData_partial_hash
    //   )),
    //   entryPoint, chainId
    // ))
    
    // First encode the user operation fields
    const innerHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters([
          'address', // sender
          'uint256', // nonce  
          'bytes32', // keccak256(initCode)
          'bytes32', // keccak256(callData)
          'bytes32', // accountGasLimits
          'uint256', // preVerificationGas
          'bytes32', // gasFees
          'bytes32'  // keccak256(paymasterAndData[:52]) - excludes custom paymaster data
        ]),
        [
          userOp.sender as `0x${string}`,
          BigInt(userOp.nonce),
          keccak256(userOp.initCode as Hex),
          keccak256(userOp.callData as Hex),
          userOp.accountGasLimits as Hex,
          BigInt(userOp.preVerificationGas),
          userOp.gasFees as Hex,
          keccak256(paymasterOnlyData as Hex)
        ]
      )
    );

    // Then encode with entryPoint and chainId
    const finalHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters(['bytes32', 'address', 'uint256']),
        [innerHash, entryPointAddress, BigInt(chainId)]
      )
    );

    return finalHash;
  } catch (error) {
    throw new Error(`Failed to compute message hash locally: ${error}`);
  }
}

/**
 * Gets the latest merkle root index for a pool
 */
export async function getLatestMerkleRootIndex(
  client: PublicClient,
  paymasterAddress: `0x${string}`,
  poolId: string
): Promise<number> {
  try {
    // Call the pool info function to get the current root index
    const rootIndex = await client.readContract({
      address: paymasterAddress,
      abi: [
        {
          inputs: [{ name: 'poolId', type: 'uint256' }],
          name: 'getPoolRootHistoryInfo',
          outputs: [
            { name: 'currentIndex', type: 'uint256' },
            { name: 'historyCount', type: 'uint256' },
            { name: 'validCount', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getPoolRootHistoryInfo',
      args: [BigInt(poolId)],
    });

    return Number(rootIndex[0]); // currentIndex
  } catch (error) {
    throw new Error(`Failed to get merkle root index: ${error}`);
  }
}