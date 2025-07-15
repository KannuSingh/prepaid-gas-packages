// file :demo-counter-app/hooks/use-gas-data.ts
import { useState, useCallback } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { poseidon2 } from 'poseidon-lite/poseidon2';
import { createPublicClient, http, keccak256, toHex } from 'viem';
import { GAS_LIMITED_PAYMASTER_ABI, BASE_SEPOLIA_PRESET } from '@prepaid-gas/constants';
import { baseSepolia } from 'viem/chains';

interface GasData {
  gasUsed: bigint;
  joiningFee: string;
  remainingGas: bigint;
  nullifier: bigint;
}

interface PoolGasData {
  [poolId: string]: GasData | null;
}

/**
 * Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
 * @param message The message to be hashed.
 * @returns The message digest.
 */
export default function getScope(message: bigint): bigint {
  return BigInt(keccak256(toHex(message, { size: 32 }))) >> BigInt(8);
}

export function useGasData() {
  const [gasDataMap, setGasDataMap] = useState<PoolGasData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate nullifier for a given identity and pool
  const calculateNullifier = useCallback((identity: Identity, poolId: string): bigint => {
    const scope = getScope(BigInt(poolId));
    const secret = identity.secretScalar;

    return poseidon2([scope, secret]);
  }, []);

  // Fetch gas data for a specific pool
  const fetchGasDataForPool = useCallback(
    async (identity: Identity, poolId: string, joiningFee: string): Promise<GasData | null> => {
      try {
        // Calculate nullifier
        const nullifier = calculateNullifier(identity, poolId);
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });
        // Call userGasData on the contract
        const gasUsed = await publicClient.readContract({
          address: BASE_SEPOLIA_PRESET.paymasterAddress.GasLimitedPaymaster,
          abi: GAS_LIMITED_PAYMASTER_ABI,
          functionName: 'poolMembersGasData',
          args: [nullifier],
        });

        // Calculate remaining gas
        const joiningFeeBigInt = BigInt(joiningFee);
        const remainingGas = joiningFeeBigInt - gasUsed;

        return {
          gasUsed,
          joiningFee,
          remainingGas,
          nullifier,
        };
      } catch (error) {
        console.error(`❌ Error fetching gas data for pool ${poolId}:`, error);
        return null;
      }
    },
    [calculateNullifier]
  );

  // Fetch gas data for multiple pools
  const fetchGasData = useCallback(
    async (identity: Identity, pools: Array<{ poolId: string; joiningFee: string }>) => {
      if (pools.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch gas data for all pools in parallel
        const gasDataPromises = pools.map((pool) => fetchGasDataForPool(identity, pool.poolId, pool.joiningFee));

        const gasDataResults = await Promise.all(gasDataPromises);

        // Build the gas data map
        const newGasDataMap: PoolGasData = {};
        pools.forEach((pool, index) => {
          if (pool.poolId && gasDataResults[index]) {
            newGasDataMap[pool.poolId] = gasDataResults[index];
          }
        });

        setGasDataMap(newGasDataMap);
      } catch (error) {
        console.error('❌ Error fetching gas data:', error);
        setError('Failed to fetch gas usage data');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGasDataForPool]
  );

  // Clear gas data
  const clearGasData = useCallback(() => {
    setGasDataMap({});
    setError(null);
  }, []);

  return {
    gasDataMap,
    isLoading,
    error,
    fetchGasData,
    clearGasData,
  };
}
