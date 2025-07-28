import * as ViemChains from 'viem/chains';

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
    (c) => typeof c === 'object' && c !== null && 'id' in c
  );
  return chains.find((chain) => chain.id === chainId);
}
