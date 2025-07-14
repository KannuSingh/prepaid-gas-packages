/**
 * Subgraph entity types and GraphQL query types
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

// Pool entity from subgraph
export interface Pool extends BaseEntity {
  poolId: string;
  joiningFee: string;
  totalDeposits: string;
  memberCount: string;
  owner: string;
  merkleTreeDepth: string;
  currentMerkleRoot: string;
  rootHistoryCurrentIndex: string;
  rootHistoryCount: string;
  members: PoolMember[];
  memberAddedEvents: MemberAdded[];
  userOpsSponsored: UserOpSponsored[];
  createdAt: string;
  updatedAt: string;
}

// Pool member entity
export interface PoolMember extends BaseEntity {
  pool: Pool;
  memberIndex: string;
  identityCommitment: string;
  merkleTreeRoot: string;
  merkleRootIndex: string;
  joinedAt: string;
}

// Member added event entity
export interface MemberAdded extends BaseEntity {
  pool: Pool;
  member: PoolMember;
  memberIndex: string;
  identityCommitment: string;
  merkleTreeRoot: string;
  merkleRootIndex: string;
}

// Members added batch event entity
export interface MembersAdded extends BaseEntity {
  pool: Pool;
  startIndex: string;
  identityCommitments: string[];
  merkleTreeRoot: string;
  merkleRootIndex: string;
  memberCount: string;
}

// User operation sponsored event entity
export interface UserOpSponsored extends BaseEntity {
  pool: Pool;
  userOpHash: string;
  sender: string;
  actualGasCost: string;
  nullifier: string;
  gasPrice: string;
  gasUsed: string;
}

// Pool created event entity
export interface PoolCreated extends BaseEntity {
  pool: Pool;
  joiningFee: string;
  creator: string;
}

// Revenue withdrawn event entity
export interface RevenueWithdrawn extends BaseEntity {
  recipient: string;
  amount: string;
  withdrawer: string;
}

// Merkle root history entity
export interface MerkleRootHistory extends BaseEntity {
  pool: Pool;
  root: string;
  index: string;
  isValid: boolean;
  addedAt: string;
}

// Paymaster entity
export interface Paymaster extends BaseEntity {
  address: string;
  type: PaymasterType;
  owner: string;
  entryPoint: string;
  verifier: string;
  totalDeposit: string;
  totalRevenue: string;
  poolCount: string;
  totalUserOpsSponsored: string;
  isActive: boolean;
  pools: Pool[];
}

// Paymaster types
export enum PaymasterType {
  GAS_LIMITED = 'GAS_LIMITED',
  ONE_TIME_USE = 'ONE_TIME_USE',
}

// User entity for tracking user interactions
export interface User extends BaseEntity {
  address: string;
  poolMemberships: PoolMember[];
  userOpsSponsored: UserOpSponsored[];
  totalGasSponsored: string;
  firstInteraction: string;
  lastInteraction: string;
}

// Statistics and aggregations
export interface PoolStatistics {
  totalPools: string;
  totalMembers: string;
  totalDeposits: string;
  totalGasSponsored: string;
  totalUserOpsSponsored: string;
  averageJoiningFee: string;
  mostActivePool: Pool;
}

export interface DailyStatistics extends BaseEntity {
  date: string;
  poolsCreated: string;
  membersAdded: string;
  userOpsSponsored: string;
  gasSponsored: string;
  revenue: string;
}

// Query input types
export interface PoolQueryArgs {
  id?: string;
  poolId?: string;
  owner?: string;
  first?: number;
  skip?: number;
  orderBy?: PoolOrderBy;
  orderDirection?: OrderDirection;
  where?: PoolFilter;
}

export interface PoolMemberQueryArgs {
  pool?: string;
  identityCommitment?: string;
  first?: number;
  skip?: number;
  orderBy?: PoolMemberOrderBy;
  orderDirection?: OrderDirection;
  where?: PoolMemberFilter;
}

export interface UserOpSponsoredQueryArgs {
  pool?: string;
  sender?: string;
  userOpHash?: string;
  first?: number;
  skip?: number;
  orderBy?: UserOpSponsoredOrderBy;
  orderDirection?: OrderDirection;
  where?: UserOpSponsoredFilter;
}

// Filter types
export interface PoolFilter {
  poolId?: string;
  poolId_in?: string[];
  owner?: string;
  owner_in?: string[];
  joiningFee_gte?: string;
  joiningFee_lte?: string;
  memberCount_gte?: string;
  memberCount_lte?: string;
  createdAt_gte?: string;
  createdAt_lte?: string;
}

export interface PoolMemberFilter {
  pool?: string;
  pool_in?: string[];
  identityCommitment?: string;
  identityCommitment_in?: string[];
  joinedAt_gte?: string;
  joinedAt_lte?: string;
}

export interface UserOpSponsoredFilter {
  pool?: string;
  pool_in?: string[];
  sender?: string;
  sender_in?: string[];
  actualGasCost_gte?: string;
  actualGasCost_lte?: string;
  blockTimestamp_gte?: string;
  blockTimestamp_lte?: string;
}

// Order by enums
export enum PoolOrderBy {
  ID = 'id',
  POOL_ID = 'poolId',
  JOINING_FEE = 'joiningFee',
  TOTAL_DEPOSITS = 'totalDeposits',
  MEMBER_COUNT = 'memberCount',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  BLOCK_NUMBER = 'blockNumber',
  BLOCK_TIMESTAMP = 'blockTimestamp',
}

export enum PoolMemberOrderBy {
  ID = 'id',
  MEMBER_INDEX = 'memberIndex',
  JOINED_AT = 'joinedAt',
  BLOCK_NUMBER = 'blockNumber',
  BLOCK_TIMESTAMP = 'blockTimestamp',
}

export enum UserOpSponsoredOrderBy {
  ID = 'id',
  ACTUAL_GAS_COST = 'actualGasCost',
  BLOCK_NUMBER = 'blockNumber',
  BLOCK_TIMESTAMP = 'blockTimestamp',
}

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// Query response types
export interface PoolsQueryResponse {
  pools: Pool[];
}

export interface PoolMembersQueryResponse {
  poolMembers: PoolMember[];
}

export interface UserOpsSponsoredQueryResponse {
  userOpsSponsored: UserOpSponsored[];
}

export interface PoolStatisticsQueryResponse {
  poolStatistics: PoolStatistics[];
}

// Subscription types
export interface PoolSubscription {
  pool: Pool;
}

export interface UserOpSponsoredSubscription {
  userOpSponsored: UserOpSponsored;
}

export interface MemberAddedSubscription {
  memberAdded: MemberAdded;
}

// GraphQL variables and pagination
export interface GraphQLVariables {
  [key: string]: any;
}

export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: PaginationInfo;
  totalCount: number;
}

// Subgraph metadata
export interface SubgraphInfo {
  subgraphName: string;
  version: string;
  network: string;
  deploymentId: string;
  synced: boolean;
  health: 'healthy' | 'unhealthy' | 'failed';
  fatalError?: {
    message: string;
    block: {
      number: string;
      hash: string;
    };
  };
}

// Error types
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: {
    code?: string;
    [key: string]: any;
  };
}
