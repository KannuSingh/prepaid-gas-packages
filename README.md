# Prepaid Gas Packages

A monorepo of packages for building applications with the Prepaid Gas paymaster system. This system enables privacy-preserving gas payments using Account Abstraction (ERC-4337) and zero-knowledge proofs with the Semaphore protocol.

## 📦 Packages

### Core Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@prepaid-gas/constants`](./packages/constants) | ![npm](https://img.shields.io/npm/v/@prepaid-gas/constants) | Shared constants, ABIs, and network configurations |
| [`@prepaid-gas/core`](./packages/core) | ![npm](https://img.shields.io/npm/v/@prepaid-gas/core) | Main SDK for privacy-preserving paymaster integration |
| [`@prepaid-gas/data`](./packages/data) | ![npm](https://img.shields.io/npm/v/@prepaid-gas/data) | Subgraph client with fluent query builders |

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

## 🏗️ Development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Turbo CLI

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/private-prepaid-gas-packages.git
cd private-prepaid-gas-packages

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm dev            # Start development mode
pnpm test           # Run tests across packages
pnpm lint           # Lint all packages
pnpm typecheck      # Type check all packages
pnpm clean          # Clean build artifacts
pnpm format         # Format code
pnpm changeset      # Create a changeset for releases
```

## 📚 Package Dependency Graph

```mermaid
graph TD
    A[@prepaid-gas/constants] --> B[@prepaid-gas/core]
    A --> C[@prepaid-gas/data]
    C --> B
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


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Release Process

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management:

1. Create changes and commit them
2. Run `pnpm changeset` to document changes
3. Create a PR with your changes and changeset
4. On merge, Changesets will create a release PR
5. Merge the release PR to publish packages

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for the Account Abstraction ecosystem**
