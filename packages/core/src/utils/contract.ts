/**
 * Contract interaction utilities
 * For getting message hash and other contract calls
 */

import { createPublicClient, http, type PublicClient, type Hex } from 'viem';
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
 * Gets the message hash from the paymaster contract for ZK proof generation
 * This hash is used as the message in the Semaphore proof
 */
export async function getMessageHash(
  client: PublicClient,
  paymasterAddress: `0x${string}`,
  userOp: PackedUserOperation
): Promise<Hex> {
  try {
    // Call the getMessageHash function on the paymaster contract
    // This function takes a packed user operation and returns the hash
    const messageHash = await client.readContract({
      address: paymasterAddress,
      abi: [
        {
          inputs: [
            {
              components: [
                { name: 'sender', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'initCode', type: 'bytes' },
                { name: 'callData', type: 'bytes' },
                { name: 'accountGasLimits', type: 'bytes32' },
                { name: 'preVerificationGas', type: 'uint256' },
                { name: 'gasFees', type: 'bytes32' },
                { name: 'paymasterAndData', type: 'bytes' },
                { name: 'signature', type: 'bytes' },
              ],
              name: 'userOp',
              type: 'tuple',
            },
          ],
          name: 'getMessageHash',
          outputs: [{ name: '', type: 'bytes32' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getMessageHash',
      args: [
        {
          sender: userOp.sender as `0x${string}`,
          nonce: BigInt(userOp.nonce),
          initCode: userOp.initCode as Hex,
          callData: userOp.callData as Hex,
          accountGasLimits: userOp.accountGasLimits as Hex,
          preVerificationGas: BigInt(userOp.preVerificationGas),
          gasFees: userOp.gasFees as Hex,
          paymasterAndData: userOp.paymasterAndData as Hex,
          signature: userOp.signature as Hex,
        },
      ],
    });

    return messageHash as Hex;
  } catch (error) {
    throw new Error(`Failed to get message hash from contract: ${error}`);
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