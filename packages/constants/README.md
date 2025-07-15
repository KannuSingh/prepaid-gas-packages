# @prepaid-gas/constants

Shared constants, contract ABIs, and network configurations for the Prepaid Gas packages ecosystem.

## Installation

```bash
npm install @prepaid-gas/constants
# or
pnpm add @prepaid-gas/constants
# or
yarn add @prepaid-gas/constants
```

## Overview

This package provides essential constants, smart contract ABIs, and network configurations used across the Prepaid Gas paymaster system. It serves as the foundational layer that ensures consistency and type safety across all packages in the ecosystem.

## Features

- 🔧 **Contract Constants**: Gas limits, data sizes, and validation parameters
- 📋 **Smart Contract ABIs**: Complete ABI definitions for paymaster contracts
- 🌐 **Network Configurations**: Multi-chain support with preset configurations
- 🎯 **Type Safety**: Full TypeScript support with proper type definitions
- 📦 **Dual Output**: Both CommonJS and ESM support for maximum compatibility

## Usage

### Importing Constants

```typescript
import {
  POST_OP_GAS_LIMIT,
  POOL_ROOT_HISTORY_SIZE,
  CONFIG_SIZE,
  EXPECTED_PAYMASTER_DATA_SIZE
} from '@prepaid-gas/constants';

console.log('Post-op gas limit:', POST_OP_GAS_LIMIT); // 65000n
console.log('Pool root history size:', POOL_ROOT_HISTORY_SIZE); // 64
```

### Using Contract ABIs

```typescript
import { 
  GAS_LIMITED_PAYMASTER_ABI, 
  ONE_TIME_USE_PAYMASTER_ABI 
} from '@prepaid-gas/constants';
import { createPublicClient, http } from 'viem';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Read from GasLimitedPaymaster contract
const poolInfo = await client.readContract({
  abi: GAS_LIMITED_PAYMASTER_ABI,
  address: '0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf',
  functionName: 'getPoolInfo',
  args: [poolId]
});
```

### Network Configuration

```typescript
import { 
  getNetworkPreset, 
  getSupportedChainIds,
  isSupportedChainId 
} from '@prepaid-gas/constants';

// Get configuration for Base Sepolia
const config = getNetworkPreset(84532);
console.log(config?.name); // "base-sepolia"
console.log(config?.rpcUrl); // "https://sepolia.base.org"

// Check supported networks
const supportedChains = getSupportedChainIds();
console.log(supportedChains); // [84532]

// Validate chain support
if (isSupportedChainId(84532)) {
  console.log('Base Sepolia is supported!');
}
```

## Available Constants

### Gas and Validation Constants

| Constant | Type | Value | Description |
|----------|------|-------|-------------|
| `POST_OP_GAS_LIMIT` | `bigint` | `65000n` | Gas limit for post-operation processing |
| `PAYMASTER_VALIDATION_GAS_OFFSET` | `number` | `20` | Offset for validation gas calculations |
| `PAYMASTER_POSTOP_GAS_OFFSET` | `number` | `36` | Offset for post-op gas calculations |
| `PAYMASTER_DATA_OFFSET` | `number` | `52` | Starting offset for paymaster data |

### Data Structure Constants

| Constant | Type | Value | Description |
|----------|------|-------|-------------|
| `CONFIG_SIZE` | `number` | `32` | Size of configuration data in bytes |
| `POOL_ID_SIZE` | `number` | `32` | Size of pool ID in bytes |
| `PRIVACY_PROOF_SIZE` | `number` | `416` | Size of ZK proof data (5 uint256 + 8 uint256 array) |
| `EXPECTED_PAYMASTER_DATA_SIZE` | `number` | `532` | Total expected size of paymaster data |

### Merkle Tree Constants

| Constant | Type | Value | Description |
|----------|------|-------|-------------|
| `POOL_ROOT_HISTORY_SIZE` | `number` | `64` | Number of Merkle roots to maintain in history |
| `DEFAULT_MERKLE_TREE_DURATION` | `number` | `3600` | Default tree duration (1 hour) |
| `MIN_DEPTH` | `number` | `1` | Minimum Merkle tree depth |
| `MAX_DEPTH` | `number` | `32` | Maximum Merkle tree depth |

### Validation Constants

| Constant | Type | Value | Description |
|----------|------|-------|-------------|
| `VALIDATION_FAILED` | `number` | `1` | Constant for validation failure status |
| `POSTOP_GAS_COST` | `number` | `65000` | Standard post-operation gas cost |

## Contract ABIs

### GasLimitedPaymaster ABI

Complete ABI for the GasLimitedPaymaster contract including:

- **Pool Management**: `createPool`, `addMember`, `addMembers`
- **Paymaster Functions**: `validatePaymasterUserOp`, `postOp`
- **View Functions**: Pool queries, Merkle tree operations
- **Events**: `PoolCreated`, `MemberAdded`, `UserOpSponsored`

```typescript
import { GAS_LIMITED_PAYMASTER_ABI } from '@prepaid-gas/constants';

// Use with viem, ethers, or any contract interaction library
const contract = new Contract(address, GAS_LIMITED_PAYMASTER_ABI, provider);
```

### OneTimeUsePaymaster ABI

Similar to GasLimitedPaymaster but with additional nullifier tracking:

- **Nullifier Prevention**: Prevents replay attacks with `usedNullifiers` mapping
- **Enhanced Security**: Additional validation for one-time use patterns

```typescript
import { ONE_TIME_USE_PAYMASTER_ABI } from '@prepaid-gas/constants';
```

## Network Configurations

### Supported Networks

Currently supported networks with their configurations:

#### Base Sepolia (Chain ID: 84532)
```typescript
{
  chainId: 84532,
  name: "base-sepolia",
  rpcUrl: "https://sepolia.base.org",
  defaultSubgraphUrl: "https://api.studio.thegraph.com/query/...",
  contracts: {
    GasLimitedPaymaster: "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf",
    OneTimeUsePaymaster: "0x243A735115F34BD5c0F23a33a444a8d26e31E2E7"
  },
  isActive: true,
  isProduction: false
}
```

### Network Utility Functions

```typescript
import { 
  getNetworkPreset,
  getNetworkPresetByName,
  supportsPaymasterType,
  getSupportedChainIds
} from '@prepaid-gas/constants';

// Get preset by chain ID
const preset = getNetworkPreset(84532);

// Get preset by network name
const preset2 = getNetworkPresetByName('base-sepolia');

// Check paymaster type support
const hasGasLimited = supportsPaymasterType(84532, 'GasLimited');

// List all supported chains
const chains = getSupportedChainIds(); // [84532]
```

## Data Structure Reference

### Paymaster Data Layout (480 bytes total)

The paymaster data follows a specific layout:

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Config (32B)    │ Pool ID (32B)   │ ZK Proof (416B) │
├─────────────────┼─────────────────┼─────────────────┤
│ Offset: 52      │ Offset: 84      │ Offset: 116     │
└─────────────────┴─────────────────┴─────────────────┘
```

**Config Structure (32 bytes)**:
- Bits 0-31: Merkle root index (0-63)
- Bit 32: Operation mode (0=validation, 1=estimation)
- Bits 33-255: Reserved (must be zero)

**ZK Proof Structure (416 bytes)**:
- 5 × uint256: Core proof data (merkleTreeDepth, merkleTreeRoot, nullifier, message, scope)
- 8 × uint256: Proof points array

## Type Definitions

The package exports comprehensive TypeScript types:

```typescript
// Network types
type ChainId = 84532; // Currently supported chain IDs
type NetworkName = 'base-sepolia';
type PaymasterType = 'GasLimited' | 'OneTimeUse';

// Network configuration interface
interface NetworkPreset {
  chainId: ChainId;
  name: NetworkName;
  rpcUrl: string;
  defaultSubgraphUrl?: string;
  contracts: {
    GasLimitedPaymaster: `0x${string}`;
    OneTimeUsePaymaster: `0x${string}`;
  };
  isActive: boolean;
  isProduction: boolean;
}
```

## Development

### Building

```bash
pnpm build        # Build for production
pnpm dev          # Build with watch mode
```

### Type Checking

```bash
pnpm typecheck    # Type check without emitting files
```

### Linting

```bash
pnpm lint         # Run ESLint
```

## Package Structure

```
src/
├── abi/                    # Contract ABIs
│   ├── GasLimitedPaymaster.ts
│   ├── OneTimeUsePaymaster.ts
│   └── index.ts
├── contracts/              # Contract constants
│   └── constants.ts
├── network/                # Network configurations
│   ├── config.ts          # Type definitions
│   ├── presets.ts         # Network presets
│   └── index.ts
└── index.ts               # Main exports
```

## Contributing

This package is part of the Prepaid Gas packages monorepo. Please refer to the root README for contribution guidelines.

## License

MIT