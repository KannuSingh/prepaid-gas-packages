# @prepaid-gas/data

Type-safe GraphQL client and query builders for the Prepaid Gas subgraph.

## Installation

```bash
npm install @prepaid-gas/data
```

## Quick Start

### Basic Usage

```typescript
import { SubgraphClient } from '@prepaid-gas/data';

// Create client for Base Sepolia
const client = SubgraphClient.createForNetwork(84532);

// Query deposit activities
const activities = await client
  .query()
  .depositActivities()
  .byPaymasterAddress('0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .execute();

console.log('Found activities:', activities.length);
```

### Advanced Querying

```typescript
// Query user operations with filtering
const userOps = await client
  .query()
  .userOperations()
  .byPaymasterAddress('0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf')
  .successful()
  .orderBy('timestamp', 'desc')
  .limit(25)
  .executeAndSerialize(); // Returns serialized data (BigInt → string)
```

## Core API

### SubgraphClient

```typescript
// Factory method (recommended)
SubgraphClient.createForNetwork(chainId: number)

// Constructor
new SubgraphClient(chainId: number, options?: {
  subgraphUrl?: string;
  timeout?: number;
})
```

### Query Builders

#### Deposit Activities

```typescript
const activities = await client
  .query()
  .depositActivities()
  .byPaymasterAddress('0x...')
  .byCommitment('123...')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .execute();
```

#### User Operations

```typescript
const userOps = await client
  .query()
  .userOperations()
  .byPaymasterAddress('0x...')
  .bySender('0x...')
  .successful() // or .failed()
  .orderBy('timestamp', 'desc')
  .execute();
```

#### Paymaster Contracts

```typescript
const paymasters = await client.query().paymasterContracts().byAddress('0x...').isActive().execute();
```

### Execution Methods

```typescript
.execute()               // Returns entities with BigInt values
.executeAndSerialize()   // BigInt values converted to strings
.first()                 // Get first result
.count()                 // Count results
```

## Data Types

### DepositActivity

```typescript
interface DepositActivity {
  id: string;
  transactionHash: string;
  paymaster: string;
  commitment: string;
  amount: bigint;
  timestamp: bigint;
}
```

### UserOperation

```typescript
interface UserOperation {
  id: string;
  userOpHash: string;
  paymaster: string;
  sender: string;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  success: boolean;
  timestamp: bigint;
}
```

## BigInt Serialization

```typescript
import { convertBigIntsToStrings, convertStringsToBigInts } from '@prepaid-gas/data';

// Convert any object for JSON compatibility
const serialized = convertBigIntsToStrings(data);
const deserialized = convertStringsToBigInts(serialized);
```

## Supported Networks

| Network      | Chain ID | Status    |
| ------------ | -------- | --------- |
| Base Sepolia | 84532    | ✅ Active |

## License

MIT
