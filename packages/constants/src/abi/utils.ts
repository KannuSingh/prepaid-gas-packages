/**
 * ABI utilities for combining and managing contract ABIs
 */

import type { Abi, AbiItem } from 'viem';

/**
 * Combines multiple ABI arrays into a single ABI
 * Removes duplicate entries based on function/event names and types
 */
export function combineAbis(...abis: readonly (readonly unknown[])[]): Abi {
  const combined = new Map<string, AbiItem>();

  for (const abi of abis) {
    for (const item of abi) {
      if (typeof item === 'object' && item !== null && 'type' in item) {
        const abiItem = item as AbiItem;
        // Create a unique key for deduplication
        const key = `${abiItem.type}:${'name' in abiItem ? abiItem.name : 'unnamed'}`;

        // Only add if not already present (first occurrence wins)
        if (!combined.has(key)) {
          combined.set(key, abiItem);
        }
      }
    }
  }

  return Array.from(combined.values()) as Abi;
}

/**
 * Filters ABI items by type
 */
export function filterAbiByType<T extends AbiItem['type']>(
  abi: readonly unknown[],
  type: T
): Array<Extract<AbiItem, { type: T }>> {
  return abi.filter(
    (item): item is Extract<AbiItem, { type: T }> =>
      typeof item === 'object' && item !== null && 'type' in item && (item as AbiItem).type === type
  );
}
