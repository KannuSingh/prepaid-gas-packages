# @prepaid-gas/constants

## 0.0.6

### Patch Changes

- ## Performance and Type Safety Improvements

  ### @prepaid-gas/constants
  - Implement proper ABI type inference with viem for better TypeScript support
  - Add shared ABI utilities and base patterns for reduced bundle size
  - Optimize paymaster ABIs with shared base pattern
  - Add viem Chain support and getChainById utility
  - Add bundle analysis tooling for package optimization

  ### @prepaid-gas/core
  - Update viem dependency for improved compatibility
  - Remove permissionless dependency and optimize peer dependencies
  - Add Rollup bundle analyzer for package size monitoring
  - Improve TypeScript types and API consistency

  ### @prepaid-gas/data
  - Clean up unused imports for better tree-shaking
  - Add Rollup bundle analyzer
  - Improve query builder performance

  ### General Improvements
  - Standardize package scripts across all packages
  - Add comprehensive bundle analysis configuration
  - Improve code formatting and linting consistency

## 0.0.5

### Patch Changes

- fix paymaster type

## 0.0.4

### Patch Changes

- updated packages to new contract implementation for better gas efficiency and include new paymaster type cache-enabled-gas-limited-paymaster

## 0.0.3

### Patch Changes

- fix: Add 'dom' lib to data package tsconfig for console type

## 0.0.2

### Patch Changes

- 367d1b8: This release introduces the official SDK for the PrepaidGas Paymaster, designed to streamline anonymous gas sponsorship in dApps.
  Key Features:
  - Simplified Paymaster Integration: Provides developer-friendly methods for configuring UserOperations with PrepaidGas.
  - ERC-7677 Support: Implements standard ERC-7677 paymaster methods for seamless compatibility.
  - Abstracted ZKP Handling: Simplifies the process of generating and submitting zero-knowledge proofs for private gas payments.
  - Enhanced UX for DApps: Enables dApps to offer privacy-preserving, gas-abstracted transactions.

- fix:update the git repo url
