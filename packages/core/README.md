# @prepaid-gas/core

Privacy-preserving paymaster client SDK for Account Abstraction (ERC-4337) with zero-knowledge proofs.

## Installation

```bash
npm install @prepaid-gas/core
# or
pnpm add @prepaid-gas/core
# or
yarn add @prepaid-gas/core
```

## Overview

The `@prepaid-gas/core` package provides a TypeScript SDK for integrating privacy-preserving gas payments into Account Abstraction applications. It uses zero-knowledge proofs via the Semaphore protocol to enable anonymous gas payments through privacy pools.

## ⚠️ Privacy Notice

**Important**: Transactions within the same pool are linkable via nullifiers. For unlinkable transactions across different operations, users must use different Semaphore identities for each pool.

## Features

- 🔐 **Zero-Knowledge Privacy**: Anonymous gas payments using Semaphore protocol
- ⚡ **Two-Phase Operations**: Fast gas estimation + real ZK proof generation
- 🌐 **Multi-Network Support**: Built-in support for multiple EVM networks
- 🎯 **Type Safety**: Comprehensive TypeScript support with runtime validation
- 🔗 **Account Abstraction**: Native ERC-4337 UserOperation support
- 📊 **Pool Management**: Integration with subgraph for pool data access

## Quick Start

### Basic Setup

```typescript
import { PrepaidGasPaymaster } from '@prepaid-gas/core';

// Create client for Base Sepolia
const paymaster = PrepaidGasPaymaster.createForNetwork(84532);

// Or with custom configuration
const paymaster = new PrepaidGasPaymaster(84532, {
  subgraphUrl: "https://custom-subgraph.com",
  rpcUrl: "https://your-rpc-endpoint.com"
});
```

### Gas Estimation (Fast)

```typescript
import { encodePaymasterContext } from '@prepaid-gas/core';

// Create context for gas estimation
const context = encodePaymasterContext(
  '0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf', // paymaster address
  '123',                                          // pool ID
  'eyJpZGVudGl0eSI6ImRhdGEifQ=='               // identity (base64)
);

// Get stub data for gas estimation (no ZK proof required)
const stubData = await paymaster.getPaymasterStubData({
  sender: '0x...',
  callData: '0x...',
  context,
  chainId: 84532,
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
});

console.log('Gas estimation:', stubData);
// {
//   isFinal: false,
//   paymaster: '0x3BEe...',
//   paymasterData: '0x...',
//   paymasterPostOpGasLimit: 65000n,
//   sponsor: { name: 'Prepaid Gas Pool' }
// }
```

### Real Transaction (With ZK Proof)

```typescript
// Generate real paymaster data with ZK proof
const paymasterData = await paymaster.getPaymasterData({
  sender: '0x...',
  nonce: 123n,
  callData: '0x...',
  callGasLimit: 100000n,
  verificationGasLimit: 200000n,
  preVerificationGas: 50000n,
  maxFeePerGas: 1000000000n,
  maxPriorityFeePerGas: 1000000000n,
  context
});

console.log('Paymaster data:', paymasterData);
// {
//   paymaster: '0x3BEe...',
//   paymasterData: '0x...' // 480 bytes with ZK proof
// }
```

## Architecture

### Two-Phase Operation Pattern

The SDK uses a sophisticated two-phase approach for optimal performance:

1. **Gas Estimation Phase** (`GAS_ESTIMATION_MODE`):
   - Uses dummy proof data for fast gas estimation
   - No ZK proof generation required
   - Returns `isFinal: false` to indicate estimation mode

2. **Validation Phase** (`VALIDATION_MODE`):
   - Generates real ZK proof of pool membership
   - Full Semaphore protocol validation
   - Returns final paymaster data for transaction

### Privacy Architecture

#### Zero-Knowledge Proof System

```typescript
// Pool-based anonymity with Semaphore protocol
const proof = await paymaster.generateProof({
  identityHex: '0x...',           // Your Semaphore identity
  poolMembers: [commitment1, ...], // All pool member commitments
  messageHash: messageHash,        // UserOperation hash
  poolId: 123n                    // Pool identifier
});
```

**Privacy Model**:
- Users join pools by adding identity commitments to Merkle trees
- Gas payments prove membership without revealing which member
- Nullifiers prevent double-spending but are linkable within pools
- Cross-pool privacy requires different identities

#### Context Encoding System

The paymaster data follows a specific 480-byte structure:

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Config (32B)    │ Pool ID (32B)   │ ZK Proof (416B) │
├─────────────────┼─────────────────┼─────────────────┤
│ merkleRootIndex │ Pool identifier │ Semaphore proof │
│ + mode + bits   │                 │ (5+8 uint256s)  │
└─────────────────┴─────────────────┴─────────────────┘
```

## API Reference

### PrepaidGasPaymaster

Main client class for paymaster operations.

#### Constructor

```typescript
new PrepaidGasPaymaster(chainId: ChainId, options?: {
  subgraphUrl?: string;
  rpcUrl?: string;
})
```

#### Static Methods

```typescript
// Factory method for network presets
PrepaidGasPaymaster.createForNetwork(chainId: ChainId, options?: {
  subgraphUrl?: string;
  rpcUrl?: string;
}): PrepaidGasPaymaster
```

#### Instance Methods

```typescript
// Gas estimation with dummy proofs
async getPaymasterStubData(
  parameters: GetPaymasterStubDataV7Parameters
): Promise<GetPaymasterStubDataReturnType>

// Real transactions with ZK proofs
async getPaymasterData(
  parameters: GetPaymasterDataParameters
): Promise<GetPaymasterDataReturnType>

// Access to subgraph client
getSubgraphClient(): SubgraphClient
```

### Utility Functions

#### Context Encoding

```typescript
// Create paymaster context
function encodePaymasterContext(
  paymasterAddress: `0x${string}`,
  poolId: string | bigint,
  identity: string
): `0x${string}`

// Parse paymaster context
function parsePaymasterContext(
  context: `0x${string}`
): {
  paymasterAddress: `0x${string}`;
  poolId: bigint;
  identityHex: `0x${string}`;
}
```

#### Validation Functions

```typescript
// Validate pool ID range
function validatePoolId(poolId: bigint): boolean

// Validate merkle root index (0-63)
function validateMerkleRootIndex(index: number): boolean

// Validate paymaster data structure
function validatePaymasterAndData(
  paymasterAndData: Uint8Array | string
): boolean
```

#### Operation Modes

```typescript
enum PrepaidGasPaymasterMode {
  VALIDATION_MODE = 0,      // Real operations with ZK proofs
  GAS_ESTIMATION_MODE = 1   // Gas estimation with dummy data
}
```

## Advanced Usage

### Custom Network Configuration

```typescript
const paymaster = new PrepaidGasPaymaster(84532, {
  subgraphUrl: "https://your-custom-subgraph.com",
  rpcUrl: "https://your-rpc-provider.com"
});
```

### Manual Proof Generation

```typescript
// Generate ZK proof manually
const proofResult = await paymaster.generateProof({
  identityHex: '0x...',
  poolMembers: [commitment1, commitment2, ...],
  messageHash: BigInt('0x...'),
  poolId: 123n
});

console.log('Proof:', proofResult.proof);
console.log('Group size:', proofResult.group.size);
console.log('Identity commitment:', proofResult.identity.commitment);
```

### Working with Pool Data

```typescript
// Access subgraph client
const subgraphClient = paymaster.getSubgraphClient();

// Query pool information
const pools = await subgraphClient
  .query()
  .pools()
  .byNetwork("base-sepolia")
  .withMembers(50)
  .execute();

console.log('Available pools:', pools);
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
try {
  const result = await paymaster.getPaymasterData(params);
} catch (error) {
  if (error.message.includes('Identity commitment')) {
    console.error('Identity not found in pool');
  } else if (error.message.includes('Invalid pool ID')) {
    console.error('Pool ID validation failed');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Supported Networks

Currently supported networks:

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Active (Testnet) |

## Configuration

### Environment Variables

While the SDK doesn't require environment variables, you may want to configure:

```bash
# Optional: Custom subgraph URL
SUBGRAPH_URL=https://your-subgraph.com

# Optional: Custom RPC URL
RPC_URL=https://your-rpc-provider.com
```

### Network Presets

The SDK automatically uses network presets from `@prepaid-gas/constants`:

```typescript
import { getNetworkPreset } from '@prepaid-gas/constants';

const preset = getNetworkPreset(84532);
console.log(preset?.contracts.GasLimitedPaymaster);
// "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf"
```

## Performance Considerations

### Gas Estimation vs Real Transactions

- **Use `getPaymasterStubData()`** for gas estimation (fast, no ZK proof)
- **Use `getPaymasterData()`** for real transactions (slower, generates ZK proof)

### Caching and Optimization

```typescript
// Cache subgraph client instances
const client = paymaster.getSubgraphClient();

// Pre-fetch pool data for faster proof generation
const poolMembers = await client
  .query()
  .poolMembers()
  .byPool(poolId.toString())
  .execute();
```

## Security Considerations

### Privacy Guidelines

1. **Different identities for different pools** to maintain cross-pool privacy
2. **Secure identity storage** using appropriate encryption
3. **Nullifier management** to understand transaction linkability

### Validation

The SDK performs comprehensive validation:

- Pool ID range validation
- Merkle root index bounds checking (0-63)
- Paymaster data structure validation
- Network configuration validation

## TypeScript Support

The package provides comprehensive TypeScript support:

```typescript
import type {
  PaymasterOptions,
  GetPaymasterStubDataV7Parameters,
  ParsedPaymasterContext,
  ProofGenerationParams,
  ProofGenerationResult
} from '@prepaid-gas/core';
```

## Development

### Building

```bash
pnpm build        # Build for production
pnpm dev          # Build with watch mode
```

### Testing

```bash
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

### Type Checking

```bash
pnpm typecheck    # Type check without emitting files
```

## Dependencies

### Runtime Dependencies

- `@prepaid-gas/data`: Subgraph client for pool data
- `@prepaid-gas/constants`: Shared constants and network configs
- `@semaphore-protocol/*`: Zero-knowledge proof generation
- `permissionless`: Account Abstraction utilities
- `viem`: Ethereum interaction and typing
- `poseidon-lite`: Hash function for ZK proofs

### Peer Dependencies

Make sure you have compatible versions of:

- `typescript` (^5.0.0)
- Account Abstraction libraries compatible with ERC-4337

## Contributing

This package is part of the Prepaid Gas packages monorepo. Please refer to the root README for contribution guidelines.

## License

MIT

## Related Packages

- [`@prepaid-gas/data`](../data/README.md) - Subgraph client and query builders
- [`@prepaid-gas/constants`](../constants/README.md) - Shared constants and configurations