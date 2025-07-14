/**
 * @private-prepaid-gas/types
 *
 * Comprehensive TypeScript types and interfaces for the Private Prepaid Gas paymaster system.
 * This package provides type definitions for paymaster operations, network configurations,
 * subgraph entities, and common utilities.
 */

// Re-export all types from each module
export * from './common';
export * from './network';
export * from './paymaster';
export * from './subgraph';

// Contract types will be re-exported when contracts package is properly set up
// For now, we'll define the basic contract types here
export type GasLimitedPaymaster = readonly any[];
export type OneTimeUsePaymaster = readonly any[];
export type BaseSepoliaAddresses = {
  readonly GAS_LIMITED_PAYMASTER: string;
  readonly ONE_TIME_USE_PAYMASTER: string;
  readonly POSEIDON_T3: string;
};

// Version information
export const VERSION = '1.0.0';

// Type registry for runtime type checking and validation
export const TYPE_REGISTRY = {
  common: [
    'Address',
    'HexString',
    'BigNumberish',
    'Hash',
    'TransactionHash',
    'BlockHash',
    'Result',
    'AsyncResult',
    'Optional',
    'Nullable',
    'EventListener',
    'EventEmitter',
    'Logger',
    'ConfigBase',
    'Timestamp',
    'Duration',
    'RetryConfig',
    'Cache',
    'Serializable',
    'JsonValue',
    'ApiResponse',
    'PaginationParams',
    'PaginationMeta',
    'PaginatedData',
    'SortOption',
    'FilterCondition',
    'ValidationResult',
  ],
  network: [
    'SupportedChainId',
    'NetworkAddresses',
    'NetworkConfig',
    'NetworkRegistry',
    'RpcConfig',
    'BlockInfo',
    'TransactionInfo',
    'NetworkStatus',
    'GasEstimate',
    'ChainMetadata',
    'NetworkProvider',
    'NetworkEventMap',
  ],
  paymaster: [
    'PackedUserOperation',
    'PoolMembershipProof',
    'PaymasterValidationData',
    'PaymasterContext',
    'PoolInfo',
    'PoolRootHistoryInfo',
    'MerkleRootInfo',
    'PaymasterMode',
    'PostOpMode',
    'MemberAddedEvent',
    'PoolCreatedEvent',
    'UserOpSponsoredEvent',
    'PaymasterConfig',
    'GasLimits',
    'GasFees',
    'PaymasterData',
    'PaymasterError',
  ],
  subgraph: [
    'BaseEntity',
    'Pool',
    'PoolMember',
    'MemberAdded',
    'UserOpSponsored',
    'PoolCreated',
    'RevenueWithdrawn',
    'Paymaster',
    'PaymasterType',
    'User',
    'PoolStatistics',
    'DailyStatistics',
    'PoolQueryArgs',
    'PoolFilter',
    'PoolOrderBy',
    'OrderDirection',
    'GraphQLError',
    'SubgraphInfo',
  ],
} as const;

// Type utility for extracting all type names
export type AllTypeNames = (typeof TYPE_REGISTRY)[keyof typeof TYPE_REGISTRY][number];

// Module information
export const MODULES = {
  common: 'Common utility types and shared interfaces',
  network: 'Network configuration types and chain definitions',
  paymaster: 'Paymaster operation types and interfaces',
  subgraph: 'Subgraph entity types and GraphQL query types',
} as const;

export type ModuleName = keyof typeof MODULES;
