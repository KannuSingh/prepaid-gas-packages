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

interface PaymasterGasData {
  [paymasterAddress: string]: GasData | null;
}

/**
 * Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
 * Now used with paymaster addresses as each paymaster is its own pool.
 * @param message The message to be hashed (paymaster address as bigint).
 * @returns The message digest.
 */
export default function getScope(message: bigint): bigint {
  return BigInt(keccak256(toHex(message, { size: 32 }))) >> BigInt(8);
}

export function useGasData() {
  const [gasDataMap, setGasDataMap] = useState<PaymasterGasData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate nullifier for a given identity and paymaster (each paymaster is a pool)
  const calculateNullifier = useCallback((identity: Identity, paymasterAddress: string): bigint => {
    // Convert paymaster address to a numeric value for scope calculation
    const scope = getScope(BigInt(paymasterAddress));
    const secret = identity.secretScalar;

    return poseidon2([scope, secret]);
  }, []);

  // Fetch gas data for a specific paymaster
  const fetchGasDataForPaymaster = useCallback(
    async (identity: Identity, paymasterAddress: string, joiningFee: string): Promise<GasData | null> => {
      try {
        // Calculate nullifier
        const nullifier = calculateNullifier(identity, paymasterAddress);
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });
        // Call nullifierGasUsage on the contract
        const gasUsed = await publicClient.readContract({
          address: BASE_SEPOLIA_PRESET.paymasters.GasLimitedPaymaster.address,
          abi: GAS_LIMITED_PAYMASTER_ABI,
          functionName: 'nullifierGasUsage',
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
        console.error(`❌ Error fetching gas data for paymaster ${paymasterAddress}:`, error);
        return null;
      }
    },
    [calculateNullifier]
  );

  // Fetch gas data for multiple paymasters
  const fetchGasData = useCallback(
    async (identity: Identity, paymasters: Array<{ paymasterAddress: string; joiningFee: string }>) => {
      if (paymasters.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch gas data for all paymasters in parallel
        const gasDataPromises = paymasters.map((paymaster) => 
          fetchGasDataForPaymaster(identity, paymaster.paymasterAddress, paymaster.joiningFee)
        );

        const gasDataResults = await Promise.all(gasDataPromises);

        // Build the gas data map
        const newGasDataMap: PaymasterGasData = {};
        paymasters.forEach((paymaster, index) => {
          if (paymaster.paymasterAddress && gasDataResults[index]) {
            newGasDataMap[paymaster.paymasterAddress] = gasDataResults[index];
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
    [fetchGasDataForPaymaster]
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
