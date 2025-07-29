# @prepaid-gas/core

## 0.0.5

### Patch Changes

- fix paymaster type
- Updated dependencies
  - @prepaid-gas/constants@0.0.5
  - @prepaid-gas/data@0.0.5

## 0.0.4

### Patch Changes

- updated packages to new contract implementation for better gas efficiency and include new paymaster type cache-enabled-gas-limited-paymaster
- Updated dependencies
  - @prepaid-gas/constants@0.0.4
  - @prepaid-gas/data@0.0.4

## 0.0.3

### Patch Changes

- fix: Add 'dom' lib to data package tsconfig for console type
- Updated dependencies
  - @prepaid-gas/constants@0.0.3
  - @prepaid-gas/data@0.0.3

## 0.0.2

### Patch Changes

- 367d1b8: This release introduces the official SDK for the PrepaidGas Paymaster, designed to streamline anonymous gas sponsorship in dApps.
  Key Features:
  - Simplified Paymaster Integration: Provides developer-friendly methods for configuring UserOperations with PrepaidGas.
  - ERC-7677 Support: Implements standard ERC-7677 paymaster methods for seamless compatibility.
  - Abstracted ZKP Handling: Simplifies the process of generating and submitting zero-knowledge proofs for private gas payments.
  - Enhanced UX for DApps: Enables dApps to offer privacy-preserving, gas-abstracted transactions.

- fix:update the git repo url
- Updated dependencies [367d1b8]
- Updated dependencies
  - @prepaid-gas/constants@0.0.2
  - @prepaid-gas/data@0.0.2
