# Prepaid Gas Packages

A monorepo of packages for building applications with the Prepaid Gas paymaster system. This system enables privacy-preserving gas payments using Account Abstraction (ERC-4337) and zero-knowledge proofs with the Semaphore protocol.

## 📦 Packages

### Core Packages

| Package | Description |
|---------|-------------|
| [`@prepaid-gas/constants`](./packages/constants) | Shared constants, ABIs, and network configurations |
| [`@prepaid-gas/core`](./packages/core) | Main SDK for privacy-preserving paymaster integration |
| [`@prepaid-gas/data`](./packages/data) | Subgraph client with fluent query builders |

## 🚀 Quick Start

### Installation

```bash
# Install the core SDK
npm install @prepaid-gas/core

# For subgraph integration
npm install @prepaid-gas/data

# For shared constants and ABIs
npm install @prepaid-gas/constants
```

## 🔧 Package Details

### [@prepaid-gas/constants](./packages/constants)

Shared constants, smart contract ABIs, and network configurations.

**Key Features:**
- Contract ABIs for GasLimitedPaymaster and OneTimeUsePaymaster
- Gas limits, data sizes, and validation constants
- Multi-network support with preset configurations
- Type-safe network utility functions

```typescript
import { 
  GAS_LIMITED_PAYMASTER_ABI, 
  POST_OP_GAS_LIMIT,
  getNetworkPreset,
  getSupportedChainIds 
} from '@prepaid-gas/constants';
```

### [@prepaid-gas/core](./packages/core)

Main SDK with privacy-preserving paymaster client and zero-knowledge proof generation.

**Key Features:**
- Two-phase operation pattern (gas estimation + real ZK proofs)
- Semaphore protocol integration for privacy
- Network-aware configuration with automatic presets
- Context encoding/decoding utilities
- Comprehensive validation and error handling

```typescript
import { 
  PrepaidGasPaymaster, 
  encodePaymasterContext, 
  validatePoolId 
} from '@prepaid-gas/core';
```

### [@prepaid-gas/data](./packages/data)

Subgraph client with fluent query builders and BigInt serialization.

**Key Features:**
- Type-safe GraphQL query builders
- Multi-network support with composite IDs
- Automatic BigInt ↔ string serialization
- Request deduplication and caching
- Relationship loading and pagination

```typescript
import { 
  SubgraphClient, 
  convertBigIntsToStrings 
} from '@prepaid-gas/data';
```

## 🌐 Supported Networks

Currently supported networks:

| Network | Chain ID | Status | Paymaster Contracts |
|---------|----------|--------|-------------------|
| **Base Sepolia** | 84532 | ✅ Active (Testnet) | GasLimited: `0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf`<br>OneTimeUse: `0x243A735115F34BD5c0F23a33a444a8d26e31E2E7` |


## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for the Account Abstraction ecosystem**
