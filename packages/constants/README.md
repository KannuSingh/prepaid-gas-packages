# @prepaid-gas/constants

Shared constants, contract ABIs, and network configurations for the Prepaid Gas packages.

## Installation

```bash
npm install @prepaid-gas/constants
```

## Quick Start

### Using Contract ABIs

```typescript
import { 
  GAS_LIMITED_PAYMASTER_ABI, 
  ONE_TIME_USE_PAYMASTER_ABI,
  CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI
} from '@prepaid-gas/constants';
import { createPublicClient, http } from 'viem';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Read from paymaster contract
const scope = await client.readContract({
  abi: GAS_LIMITED_PAYMASTER_ABI,
  address: '0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf',
  functionName: 'SCOPE'
});
```

### Network Configuration

```typescript
import { 
  getNetworkPreset, 
  getSupportedChainIds,
  BASE_SEPOLIA_PRESET
} from '@prepaid-gas/constants';

// Get configuration for Base Sepolia
const config = getNetworkPreset(84532);
console.log(config?.paymasterAddress.GasLimitedPaymaster);

// Use preset directly
console.log(BASE_SEPOLIA_PRESET.paymasterAddress.GasLimitedPaymaster);
// "0xA1c868aD7fae4159f07493df22E5004aaDb5467D"
```

### Constants

```typescript
import {
  POST_OP_GAS_LIMIT,
  POOL_ROOT_HISTORY_SIZE,
  EXPECTED_PAYMASTER_DATA_SIZE
} from '@prepaid-gas/constants';

console.log('Post-op gas limit:', POST_OP_GAS_LIMIT); // 65000n
console.log('Pool root history size:', POOL_ROOT_HISTORY_SIZE); // 64
console.log('Paymaster data size:', EXPECTED_PAYMASTER_DATA_SIZE); // 448
```

## Available Exports

### Contract ABIs
- `GAS_LIMITED_PAYMASTER_ABI` - Multi-use gas credits with limits
- `ONE_TIME_USE_PAYMASTER_ABI` - Single-use credits with nullifier tracking
- `CACHE_ENABLED_GAS_LIMITED_PAYMASTER_ABI` - Optimized multi-use with caching

### Network Presets
- `BASE_SEPOLIA_PRESET` - Base Sepolia network configuration
- `getNetworkPreset(chainId)` - Get preset by chain ID
- `getSupportedChainIds()` - List supported chain IDs

### Constants
- `POST_OP_GAS_LIMIT` - Gas limit for post-operation processing (65000n)
- `POOL_ROOT_HISTORY_SIZE` - Number of Merkle roots to maintain (64)
- `EXPECTED_PAYMASTER_DATA_SIZE` - Size of paymaster data in bytes (448)
- `CONFIG_SIZE`, `PRIVACY_PROOF_SIZE` - Data structure sizes

### Network Types
```typescript
import type { ChainId, NetworkPreset, PaymasterType } from '@prepaid-gas/constants';
```

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Active |

## License

MIT