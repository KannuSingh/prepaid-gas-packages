# @prepaid-gas/core

Privacy-preserving paymaster client SDK for Account Abstraction (ERC-4337) with zero-knowledge proofs.

## Installation

```bash
npm install @prepaid-gas/core
```

## Quick Start

### Basic Setup

```typescript
import { PrepaidGasPaymaster, encodePaymasterContext } from '@prepaid-gas/core';

// Create client for Base Sepolia
const paymaster = PrepaidGasPaymaster.createForNetwork(84532);

// Create context
const context = encodePaymasterContext(
  '0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf', // paymaster address
  'eyJpZGVudGl0eSI6ImRhdGEifQ=='               // identity (base64)
);
```

### Gas Estimation (Fast)

```typescript
// Get stub data for gas estimation (no ZK proof required)
const stubData = await paymaster.getPaymasterStubData({
  sender: '0x...',
  callData: '0x...',
  context,
  chainId: 84532,
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
});
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
```

## Smart Account Integration

```typescript
import { createSmartAccountClient } from 'permissionless';

// Configure smart account with paymaster
const smartAccountClient = createSmartAccountClient({
  client: publicClient,
  account: smartAccount,
  bundlerTransport: http(bundlerUrl),
  paymaster: {
    getPaymasterStubData: paymaster.getPaymasterStubData.bind(paymaster),
    getPaymasterData: paymaster.getPaymasterData.bind(paymaster),
  },
  paymasterContext: context,
});
```

## Core API

### PrepaidGasPaymaster

```typescript
// Factory method (recommended)
PrepaidGasPaymaster.createForNetwork(chainId: number)

// Constructor
new PrepaidGasPaymaster(chainId: number, options?: {
  subgraphUrl?: string;
  rpcUrl?: string;
})

// Methods
paymaster.getPaymasterStubData(params)  // Gas estimation
paymaster.getPaymasterData(params)      // Real transaction
paymaster.getSubgraphClient()           // Subgraph access
```

### Utility Functions

```typescript
import { 
  encodePaymasterContext, 
  parsePaymasterContext,
  PrepaidGasPaymasterMode 
} from '@prepaid-gas/core';

// Context encoding/decoding  
const context = encodePaymasterContext(paymasterAddress, identity);
const { paymasterAddress, identityHex } = parsePaymasterContext(context);

// Operation modes
PrepaidGasPaymasterMode.VALIDATION_MODE      // Real operations
PrepaidGasPaymasterMode.GAS_ESTIMATION_MODE  // Gas estimation
```

## Privacy Notice

⚠️ **Important**: Transactions within the same paymaster are linkable via nullifiers. For unlinkable transactions across different operations, users must use different Semaphore identities for different paymasters.

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Active (Testnet) |

## License

MIT