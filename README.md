# Private Prepaid Gas Packages

A monorepo of NPM packages for building applications with the Private Prepaid Gas paymaster system. This system enables privacy-preserving gas payments using Account Abstraction (ERC-4337) and zero-knowledge proofs with the Semaphore protocol.

## 📦 Packages

### Core Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@private-prepaid-gas/contracts`](./packages/contracts) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/contracts) | Smart contract ABIs and deployment addresses |
| [`@private-prepaid-gas/types`](./packages/types) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/types) | TypeScript types and interfaces |
| [`@private-prepaid-gas/core`](./packages/core) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/core) | Main SDK for paymaster integration |

### Data & Network Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@private-prepaid-gas/data`](./packages/data) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/data) | Subgraph client and query builders |
| [`@private-prepaid-gas/networks`](./packages/networks) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/networks) | Network configurations and multi-chain support |
| [`@private-prepaid-gas/subgraph-types`](./packages/subgraph-types) | ![npm](https://img.shields.io/npm/v/@private-prepaid-gas/subgraph-types) | GraphQL schema and AssemblyScript types |

## 🚀 Quick Start

### Installation

```bash
# Install the core SDK
npm install @private-prepaid-gas/core

# For TypeScript projects, also install types
npm install @private-prepaid-gas/types

# For subgraph integration
npm install @private-prepaid-gas/data
```

### Basic Usage

```typescript
import { createSDK } from '@private-prepaid-gas/core';
import { BASE_SEPOLIA_ADDRESSES } from '@private-prepaid-gas/contracts';
import { http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Create SDK instance
const sdk = createSDK({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
  gasLimitedPaymasterAddress: BASE_SEPOLIA_ADDRESSES.GAS_LIMITED_PAYMASTER,
  oneTimeUsePaymasterAddress: BASE_SEPOLIA_ADDRESSES.ONE_TIME_USE_PAYMASTER,
});

// Create a new pool
const poolResult = await sdk.client.createPool({
  joiningFee: '1000000000000000', // 0.001 ETH
  paymasterType: 'gas-limited',
});

// Add a member to the pool
if (poolResult.success) {
  await sdk.client.addMember({
    poolId: poolResult.data.poolId,
    identityCommitment: '0x...',
  });
}
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
    A[@private-prepaid-gas/contracts] --> B[@private-prepaid-gas/types]
    B --> C[@private-prepaid-gas/core]
    B --> D[@private-prepaid-gas/data]
    A --> E[@private-prepaid-gas/networks]
    F[@private-prepaid-gas/subgraph-types]
```

## 🔧 Package Details

### [@private-prepaid-gas/contracts](./packages/contracts)

Contains smart contract ABIs, deployment addresses, and constants.

```typescript
import { 
  GAS_LIMITED_PAYMASTER_ABI,
  BASE_SEPOLIA_ADDRESSES,
  SUPPORTED_CHAIN_IDS 
} from '@private-prepaid-gas/contracts';
```

### [@private-prepaid-gas/types](./packages/types)

TypeScript types for the entire ecosystem.

```typescript
import type { 
  PoolInfo,
  PaymasterValidationData,
  NetworkConfig 
} from '@private-prepaid-gas/types';
```

### [@private-prepaid-gas/core](./packages/core)

Main SDK with paymaster client, encoding utilities, and validation.

```typescript
import { 
  PrepaidGasPaymaster,
  encodePaymasterData,
  validateUserOperation 
} from '@private-prepaid-gas/core';
```

## 🌐 Supported Networks

- **Ethereum Mainnet** (Chain ID: 1)
- **Base** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532) - Primary testnet
- **Optimism** (Chain ID: 10)
- **Sepolia** (Chain ID: 11155111)

## 📖 Documentation

- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [Integration Guide](./docs/integration.md)
- [Migration Guide](./docs/migration.md)

## 🧪 Examples

Check out the [`apps/playground`](./apps/playground) directory for interactive examples:

- Basic paymaster integration
- Pool creation and management
- User operation validation
- Multi-chain deployment

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

## 🔗 Related Projects

- [Prepaid Gas Smart Contracts](https://github.com/your-org/prepaid-gas-paymaster-contracts)
- [Prepaid Gas Subgraph](https://github.com/your-org/prepaid-gas-paymasters)
- [Prepaid Gas Website](https://github.com/your-org/prepaid-gas-website)

## 🙋‍♂️ Support

- [Documentation](https://docs.your-domain.com)
- [Discord Community](https://discord.gg/your-invite)
- [GitHub Issues](https://github.com/your-org/private-prepaid-gas-packages/issues)

---

**Built with ❤️ for the Account Abstraction ecosystem**