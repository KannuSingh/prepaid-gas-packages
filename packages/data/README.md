# @prepaid-gas/data

Type-safe GraphQL client and query builders for the Prepaid Gas subgraph with multi-network support.

## Installation

```bash
npm install @prepaid-gas/data
# or
pnpm add @prepaid-gas/data
# or
yarn add @prepaid-gas/data
```

## Overview

The `@prepaid-gas/data` package provides a powerful, type-safe interface for querying blockchain data from The Graph subgraph. It features fluent query builders, automatic BigInt serialization, request deduplication, and comprehensive multi-network support.

## Features

- 🔍 **Fluent Query Builders**: Intuitive, chainable query construction
- 🌐 **Multi-Network Support**: Built-in support for multiple blockchain networks
- 🛡️ **Type Safety**: Comprehensive TypeScript support with generated types
- 📊 **BigInt Serialization**: Automatic handling of blockchain's large numbers
- ⚡ **Request Optimization**: Deduplication and caching for improved performance
- 🔗 **Relationship Loading**: Efficient loading of entity relationships
- 📄 **Pagination**: Built-in pagination with safety limits

## Quick Start

### Basic Usage

```typescript
import { SubgraphClient } from '@prepaid-gas/data';

// Create client for Base Sepolia
const client = SubgraphClient.createForNetwork(84532);

// Query pools with fluent interface
const pools = await client.query()
  .pools()
  .byNetwork("base-sepolia")
  .withMembers(50)
  .orderByPopularity()
  .limit(10)
  .execute();

console.log('Found pools:', pools.length);
```

### Advanced Querying

```typescript
// Complex query with multiple filters and relationships
const pools = await client.query()
  .pools()
  .byNetwork("base-sepolia")
  .byPaymaster("0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf")
  .withMinMembers(10)
  .withMembers(25)           // Include up to 25 members
  .withTransactions(10)      // Include recent transactions
  .orderBy('createdAt', 'desc')
  .limit(20)
  .executeAndSerialize();    // Returns serialized data (BigInt → string)

console.log('Pools with members and transactions:', pools);
```

## API Reference

### SubgraphClient

Main client class for interacting with the subgraph.

#### Factory Methods

```typescript
// Create for specific network with automatic configuration
SubgraphClient.createForNetwork(
  chainId: ChainId,
  options?: { subgraphUrl?: string; timeout?: number }
): SubgraphClient

// Create with custom configuration
new SubgraphClient(
  chainId: ChainId,
  options: { subgraphUrl: string; timeout?: number }
)
```

#### Query Interface

```typescript
client.query(): QueryBuilder
```

### Query Builders

#### Pools Query Builder

Query paymaster pools with comprehensive filtering:

```typescript
const pools = await client.query()
  .pools()
  // Filtering
  .byNetwork("base-sepolia")
  .byPaymaster("0x...")
  .byId("base-sepolia-123")
  .withMinMembers(5)
  .withMaxMembers(100)
  .isActive()
  // Relationships
  .withMembers(50)          // Include members
  .withTransactions(20)     // Include transactions
  // Sorting
  .orderByPopularity()      // Sort by member count
  .orderByActivity()        // Sort by transaction count
  .orderBy('createdAt', 'desc')
  // Pagination
  .limit(25)
  .skip(50)
  // Execution
  .execute();               // Returns Pool[]
```

#### Pool Members Query Builder

Query individual pool memberships:

```typescript
const members = await client.query()
  .poolMembers()
  .byNetwork("base-sepolia")
  .byPaymaster("0x...")
  .byPool("123")
  .byMember("0x...")
  .orderBy('memberIndex', 'asc')
  .limit(100)
  .execute();
```

#### Transactions Query Builder

Query paymaster transactions:

```typescript
const transactions = await client.query()
  .transactions()
  .byNetwork("base-sepolia")
  .byPaymaster("0x...")
  .byPool("123")
  .byUser("0x...")
  .byTransactionHash("0x...")
  .successful()             // Only successful transactions
  .failed()                 // Only failed transactions
  .orderBy('timestamp', 'desc')
  .limit(50)
  .execute();
```

#### Paymaster Contracts Query Builder

Query paymaster contract information:

```typescript
const paymasters = await client.query()
  .paymasters()
  .byNetwork("base-sepolia")
  .byAddress("0x...")
  .isActive()
  .withPools(10)           // Include pools
  .orderBy('totalRevenue', 'desc')
  .execute();
```

#### Network Info Query Builder

Query network and protocol information:

```typescript
const networkInfo = await client.query()
  .networkInfo()
  .byNetwork("base-sepolia")
  .first();
```

### Execution Methods

Each query builder supports multiple execution methods:

```typescript
// Standard execution (returns entities with BigInt values)
.execute(): Promise<Entity[]>

// Serialized execution (BigInt values converted to strings)
.executeAndSerialize(): Promise<SerializedEntity[]>

// Get first result
.first(): Promise<Entity | null>
.firstSerialized(): Promise<SerializedEntity | null>

// Check existence
.exists(): Promise<boolean>

// Count results
.count(): Promise<number>
```

## Data Types and Serialization

### BigInt Handling

The package automatically handles BigInt serialization for JSON compatibility:

```typescript
// Raw entity (internal use)
interface Pool {
  poolId: bigint;           // Native BigInt
  memberCount: bigint;
  totalDeposits: bigint;
  // ...
}

// Serialized entity (API responses)
interface SerializedPool {
  poolId: string;           // String representation
  memberCount: string;
  totalDeposits: string;
  // ...
}
```

### Manual Serialization

```typescript
import { 
  convertBigIntsToStrings, 
  convertStringsToBigInts,
  serializePool,
  deserializePool
} from '@prepaid-gas/data';

// Convert any object
const serialized = convertBigIntsToStrings(poolData);
const deserialized = convertStringsToBigInts(serialized);

// Entity-specific conversion
const serializedPool = serializePool(pool);
const deserializedPool = deserializePool(serializedPool);
```

## Entity Types

### Pool

Represents a paymaster pool for gas payments:

```typescript
interface Pool {
  id: string;                    // "base-sepolia-123"
  poolId: bigint;               // 123
  network: string;              // "base-sepolia"
  chainId: bigint;              // 84532
  paymaster: PaymasterContract; // Related paymaster
  memberCount: bigint;          // Number of members
  isActive: boolean;            // Pool status
  joiningFee: bigint;           // Fee to join pool
  totalDeposits: bigint;        // Total deposits
  createdAt: bigint;            // Creation timestamp
  members?: PoolMember[];       // Pool members (if loaded)
  transactions?: Transaction[]; // Recent transactions (if loaded)
}
```

### PoolMember

Represents membership in a paymaster pool:

```typescript
interface PoolMember {
  id: string;                   // "base-sepolia-123-0x..."
  network: string;              // "base-sepolia"
  chainId: bigint;              // 84532
  pool: Pool;                   // Related pool
  memberAddress: string;        // Member's address
  memberIndex: bigint;          // Index in pool
  identityCommitment: string;   // Semaphore commitment
  joinedAt: bigint;            // Join timestamp
}
```

### Transaction

Represents a paymaster transaction:

```typescript
interface Transaction {
  id: string;                   // "base-sepolia-0x..."
  network: string;              // "base-sepolia"
  chainId: bigint;              // 84532
  transactionHash: string;      // Transaction hash
  pool?: Pool;                  // Related pool (if applicable)
  paymaster: PaymasterContract; // Related paymaster
  userOpHash: string;          // UserOperation hash
  sender: string;              // Transaction sender
  actualGasCost: bigint;       // Gas cost paid
  actualGasUsed: bigint;       // Gas actually used
  success: boolean;            // Transaction success
  timestamp: bigint;           // Block timestamp
}
```

### PaymasterContract

Represents a deployed paymaster contract:

```typescript
interface PaymasterContract {
  id: string;                   // "base-sepolia-0x..."
  address: string;              // Contract address
  network: string;              // "base-sepolia"
  chainId: bigint;              // 84532
  paymasterType: string;        // "GasLimited" | "OneTimeUse"
  isActive: boolean;            // Contract status
  totalRevenue: bigint;         // Total revenue earned
  totalUsersDeposit: bigint;    // Total user deposits
  currentDeposit: bigint;       // Current deposit balance
  createdAt: bigint;            // Deployment timestamp
  pools?: Pool[];               // Related pools (if loaded)
}
```

## Advanced Features

### Request Deduplication

The client automatically deduplicates identical requests:

```typescript
// These will result in only one actual GraphQL request
const promise1 = client.query().pools().byNetwork("base-sepolia").execute();
const promise2 = client.query().pools().byNetwork("base-sepolia").execute();

const [result1, result2] = await Promise.all([promise1, promise2]);
// result1 and result2 contain the same data
```

### Field Selection

Optimize queries by selecting only needed fields:

```typescript
const pools = await client.query()
  .pools()
  .select(['id', 'poolId', 'memberCount'])
  .execute();
```

### Pagination Patterns

#### Cursor-based Pagination

```typescript
let hasMore = true;
let lastId = '';

while (hasMore) {
  const pools = await client.query()
    .pools()
    .where({ id_gt: lastId })
    .orderBy('id', 'asc')
    .limit(50)
    .execute();
    
  if (pools.length < 50) {
    hasMore = false;
  } else {
    lastId = pools[pools.length - 1].id;
  }
  
  // Process pools...
}
```

#### Offset-based Pagination

```typescript
const pageSize = 25;
let page = 0;

const pools = await client.query()
  .pools()
  .limit(pageSize)
  .skip(page * pageSize)
  .execute();
```

### Complex Filtering

```typescript
// Multiple filter conditions
const pools = await client.query()
  .pools()
  .byNetwork("base-sepolia")
  .where({
    memberCount_gte: '10',
    totalDeposits_gt: '1000000000000000000', // > 1 ETH
    isActive: true
  })
  .execute();
```

### Relationship Loading Strategies

```typescript
// Lazy loading - load relationships separately
const pools = await client.query().pools().execute();
for (const pool of pools) {
  const members = await client.query()
    .poolMembers()
    .byPool(pool.poolId.toString())
    .execute();
}

// Eager loading - load relationships together
const pools = await client.query()
  .pools()
  .withMembers(50)
  .withTransactions(20)
  .execute();
```

## Network Support

### Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Active |

### Multi-Network Queries

```typescript
// Network-specific client
const baseSepoliaClient = SubgraphClient.createForNetwork(84532);

// Always filter by network in queries
const pools = await baseSepoliaClient.query()
  .pools()
  .byNetwork("base-sepolia") // Recommended for clarity
  .execute();
```

## Error Handling

```typescript
try {
  const pools = await client.query().pools().execute();
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Subgraph request timed out');
  } else if (error.message.includes('network')) {
    console.error('Network error:', error);
  } else {
    console.error('Query error:', error);
  }
}
```

## Performance Optimization

### Best Practices

1. **Use pagination** to avoid loading too much data:
   ```typescript
   .limit(50) // Reasonable page size
   ```

2. **Load relationships selectively**:
   ```typescript
   .withMembers(25) // Only load needed relationships
   ```

3. **Use field selection** for large datasets:
   ```typescript
   .select(['id', 'poolId', 'memberCount'])
   ```

4. **Leverage request deduplication**:
   ```typescript
   // These share the same cache
   const promise1 = client.query().pools().execute();
   const promise2 = client.query().pools().execute();
   ```

5. **Use serialized execution** for API responses:
   ```typescript
   .executeAndSerialize() // Better for JSON APIs
   ```

## Configuration

### Custom Subgraph URL

```typescript
const client = new SubgraphClient(84532, {
  subgraphUrl: "https://your-custom-subgraph.com",
  timeout: 30000 // 30 seconds
});
```

### Request Timeout

```typescript
const client = SubgraphClient.createForNetwork(84532, {
  timeout: 60000 // 60 seconds
});
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

### Testing

```bash
pnpm test         # Run tests (when available)
```

## Dependencies

### Runtime Dependencies

- `@prepaid-gas/constants`: Network configurations and constants
- `graphql-request`: GraphQL client for The Graph

### Peer Dependencies

- TypeScript (^5.0.0) for type safety

## Contributing

This package is part of the Prepaid Gas packages monorepo. Please refer to the root README for contribution guidelines.

## License

MIT

## Related Packages

- [`@prepaid-gas/core`](../core/README.md) - Main SDK with paymaster client
- [`@prepaid-gas/constants`](../constants/README.md) - Shared constants and configurations