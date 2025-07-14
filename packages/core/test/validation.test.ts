/**
 * Basic validation tests for PrepaidGasPaymaster SDK
 * These tests verify core functionality without requiring live networks
 */

import { describe, test, expect } from 'vitest';
import { 
  PrepaidGasPaymaster, 
  PaymasterContextError, 
  PoolMembershipError,
  ValidationError,
  encodePaymasterContext,
  getMessageHash 
} from '../src';
import type { PackedUserOperation } from '@private-prepaid-gas/types';

describe('PrepaidGasPaymaster SDK Validation', () => {
  describe('Factory Methods', () => {
    test('should create paymaster client for supported networks', () => {
      const client84532 = PrepaidGasPaymaster.createForNetwork(84532);
      expect(client84532.getChainId()).toBe(84532);

      const client8453 = PrepaidGasPaymaster.createForNetwork(8453);
      expect(client8453.getChainId()).toBe(8453);
    });

    test('should accept options in factory method', () => {
      const options = { 
        subgraphUrl: 'https://test.example.com',
        debug: true,
        timeout: 5000 
      };
      
      const client = PrepaidGasPaymaster.createForNetwork(84532, options);
      const retrievedOptions = client.getOptions();
      
      expect(retrievedOptions.subgraphUrl).toBe(options.subgraphUrl);
      expect(retrievedOptions.debug).toBe(options.debug);
      expect(retrievedOptions.timeout).toBe(options.timeout);
    });
  });

  describe('Error Handling', () => {
    test('should throw PaymasterContextError for invalid context', async () => {
      const client = PrepaidGasPaymaster.createForNetwork(84532);
      
      const userOp: PackedUserOperation = {
        sender: '0x1234567890123456789012345678901234567890',
        nonce: '1',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x0000000000000000000000000000000000000000000000000000000000000000',
        preVerificationGas: '21000',
        gasFees: '0x0000000000000000000000000000000000000000000000000000000000000000',
        paymasterAndData: '0x', // Invalid - empty
        signature: '0x'
      };

      await expect(client.getPaymasterStubData({ userOperation: userOp }))
        .rejects
        .toThrow(PaymasterContextError);
    });

    test('should throw ValidationError for invalid inputs', async () => {
      const client = PrepaidGasPaymaster.createForNetwork(84532);
      
      // @ts-expect-error - Testing invalid input
      await expect(client.getPaymasterStubData({}))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Context Encoding', () => {
    test('should encode and parse paymaster context correctly', () => {
      const paymasterAddress = '0x1234567890123456789012345678901234567890';
      const poolId = '12345';
      const identity = '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';

      const encoded = encodePaymasterContext(
        paymasterAddress as `0x${string}`,
        poolId,
        identity as `0x${string}`
      );

      expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(encoded.length).toBeGreaterThan(42); // More than just an address
    });
  });

  describe('Message Hash Computation', () => {
    test('should compute message hash locally', () => {
      const userOp: PackedUserOperation = {
        sender: '0x1234567890123456789012345678901234567890',
        nonce: '1',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x0000000000000000000000000000000000000000000000000000000000000000',
        preVerificationGas: '21000',
        gasFees: '0x0000000000000000000000000000000000000000000000000000000000000000',
        paymasterAndData: '0x1234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000000000000',
        signature: '0x'
      };

      const entryPoint = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
      const chainId = 84532;

      const hash = getMessageHash(chainId, entryPoint as `0x${string}`, userOp);
      
      expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(hash.length).toBe(66); // 0x + 64 hex characters
    });

    test('should validate message hash inputs', () => {
      const userOp: PackedUserOperation = {
        sender: '0x1234567890123456789012345678901234567890',
        nonce: '1',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x0000000000000000000000000000000000000000000000000000000000000000',
        preVerificationGas: '21000',
        gasFees: '0x0000000000000000000000000000000000000000000000000000000000000000',
        paymasterAndData: '0x1234567890123456789012345678901234567890',
        signature: '0x'
      };

      // Invalid chain ID
      expect(() => getMessageHash(0, '0x0000000071727De22E5E9d8BAf0edAc6f37da032', userOp))
        .toThrow('Invalid chain ID provided');

      // Invalid entry point
      expect(() => getMessageHash(84532, 'invalid-address' as `0x${string}`, userOp))
        .toThrow('Invalid EntryPoint address provided');

      // Invalid user operation
      // @ts-expect-error - Testing invalid input
      expect(() => getMessageHash(84532, '0x0000000071727De22E5E9d8BAf0edAc6f37da032', null))
        .toThrow('Invalid user operation provided');
    });
  });

  describe('Data Layer Integration', () => {
    test('should support dynamic import of data queries', async () => {
      // Test that the dynamic import pattern works
      const { getPoolMembers } = await import('@private-prepaid-gas/data/queries/pool-members');
      expect(typeof getPoolMembers).toBe('function');
    });
  });
});