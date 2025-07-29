# Prepaid Gas Packages

NPM packages for privacy-preserving gas payments using Account Abstraction (ERC-4337) and zero-knowledge proofs.

## Packages

| Package | Description |
|---------|-------------|
| [`@prepaid-gas/core`](./packages/core) | Main SDK for privacy-preserving paymaster integration |
| [`@prepaid-gas/data`](./packages/data) | Subgraph client with fluent query builders |
| [`@prepaid-gas/constants`](./packages/constants) | Shared constants, ABIs, and network configurations |

## Quick Start

```bash
# Install the core SDK
npm install @prepaid-gas/core
```

### Basic Usage

```typescript
import { PrepaidGasPaymaster, encodePaymasterContext } from '@prepaid-gas/core';

// Create client
const paymaster = PrepaidGasPaymaster.createForNetwork(84532);

// Create context  
const context = encodePaymasterContext(paymasterAddress, identity);

// Get paymaster data for transactions
const paymasterData = await paymaster.getPaymasterData({
  sender: '0x...',
  callData: '0x...',
  context,
  // ... other UserOperation fields
});
```

### Subgraph Integration

```typescript
import { SubgraphClient } from '@prepaid-gas/data';

const client = SubgraphClient.createForNetwork(84532);

// Query deposit activities
const activities = await client.query()
  .depositActivities()
  .byPaymasterAddress(paymasterAddress)
  .execute();
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Active |

## License

MIT
