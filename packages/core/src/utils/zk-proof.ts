/**
 * Zero-knowledge proof utilities using Semaphore protocol
 * Based on existing patterns from the website implementation
 */

import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';
import type { PoolMembershipProof } from '@private-prepaid-gas/types';

/**
 * Generates a Semaphore ZK proof for pool membership
 * Following the exact pattern from the working website implementation
 */
export async function generatePoolMembershipProof(
  identityHex: string,
  poolMembers: string[],
  messageHash: string,
  poolId: string
): Promise<PoolMembershipProof> {
  try {
    // Convert identity from hex bytes to base64 string format expected by Semaphore
    const identityBase64 = Buffer.from(identityHex.slice(2), 'hex').toString('base64');
    const identity = Identity.import(identityBase64);

    // Create Semaphore group from pool member commitments
    const group = new Group(poolMembers);

    // Generate the ZK proof
    const proof = await generateProof(identity, group, messageHash, poolId);

    // Convert to the format expected by our paymaster contracts
    return {
      merkleTreeDepth: proof.merkleTreeDepth.toString(),
      merkleTreeRoot: `0x${proof.merkleTreeRoot.toString(16).padStart(64, '0')}`,
      nullifier: `0x${proof.nullifier.toString(16).padStart(64, '0')}`,
      message: `0x${proof.message.toString(16).padStart(64, '0')}`,
      scope: `0x${proof.scope.toString(16).padStart(64, '0')}`,
      points: [
        proof.points[0].toString(),
        proof.points[1].toString(),
        proof.points[2].toString(),
        proof.points[3].toString(),
        proof.points[4].toString(),
        proof.points[5].toString(),
        proof.points[6].toString(),
        proof.points[7].toString(),
      ] as const,
    };
  } catch (error) {
    throw new Error(`Failed to generate ZK proof: ${error}`);
  }
}

/**
 * Validates that an identity is a member of the pool
 */
export function validatePoolMembership(identityCommitment: string, poolMembers: string[]): boolean {
  return poolMembers.includes(identityCommitment);
}

/**
 * Gets the identity commitment from hex identity for membership checking
 */
export function getIdentityCommitmentFromHex(identityHex: string): string {
  try {
    const identityBase64 = Buffer.from(identityHex.slice(2), 'hex').toString('base64');
    const identity = Identity.import(identityBase64);
    return identity.commitment.toString();
  } catch (error) {
    throw new Error(`Failed to get identity commitment: ${error}`);
  }
}