/**
 * Paymaster operation types and interfaces
 */

// ERC-4337 User Operation structure
export interface PackedUserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: string;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
}

// Pool membership proof structure from the paymaster contracts
export interface PoolMembershipProof {
  merkleTreeDepth: string;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: readonly [string, string, string, string, string, string, string, string];
}

// Paymaster validation and context types
export interface PaymasterValidationData {
  context: string;
  validationData: string;
}

export interface PaymasterContext {
  poolId: string;
  nullifier: string;
  actualGasCost: string;
  proof: PoolMembershipProof;
}

// Pool configuration and management
export interface PoolInfo {
  joiningFee: string;
  totalDeposits: string;
  rootHistoryCurrentIndex: number;
  rootHistoryCount: number;
}

export interface PoolRootHistoryInfo {
  currentIndex: number;
  historyCount: number;
  validCount: number;
}

export interface MerkleRootInfo {
  latestRoot: string;
  rootIndex: number;
}

// Paymaster operation modes
export enum PaymasterMode {
  VALIDATION = 0,
  GAS_ESTIMATION = 1,
}

export enum PostOpMode {
  OP_SUCCEEDED = 0,
  OP_REVERTED = 1,
  OP_POSTOP_REVERTED = 2,
}

// Event types from paymaster contracts
export interface MemberAddedEvent {
  poolId: string;
  memberIndex: string;
  identityCommitment: string;
  merkleTreeRoot: string;
  merkleRootIndex: number;
}

export interface MembersAddedEvent {
  poolId: string;
  startIndex: string;
  identityCommitments: string[];
  merkleTreeRoot: string;
  merkleRootIndex: number;
}

export interface PoolCreatedEvent {
  poolId: string;
  joiningFee: string;
}

export interface UserOpSponsoredEvent {
  userOpHash: string;
  poolId: string;
  sender: string;
  actualGasCost: string;
  nullifier: string;
}

export interface RevenueWithdrawnEvent {
  recipient: string;
  amount: string;
}

// Paymaster configuration
export interface PaymasterConfig {
  entryPoint: string;
  verifier: string;
  owner: string;
}

// Gas and fee related types
export interface GasLimits {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
}

export interface GasFees {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

// Paymaster data structure
export interface PaymasterData {
  config: string; // 32 bytes
  poolId: string; // 32 bytes
  proof: PoolMembershipProof; // 416 bytes
}

// Error types from paymaster contracts
export type PaymasterError =
  | 'IncorrectJoiningFee'
  | 'InsufficientDeposits'
  | 'InsufficientPaymasterFund'
  | 'InvalidConfigFormat'
  | 'InvalidDataLength'
  | 'InvalidEntryPoint'
  | 'InvalidJoiningFee'
  | 'InvalidMerkleRootIndex'
  | 'InvalidMerkleTreeRoot'
  | 'InvalidMode'
  | 'InvalidPaymasterData'
  | 'InvalidProofMessage'
  | 'InvalidProofScope'
  | 'InvalidStubContextLength'
  | 'InvalidVerifierAddress'
  | 'LeafAlreadyExists'
  | 'LeafCannotBeZero'
  | 'LeafDoesNotExist'
  | 'LeafGreaterThanSnarkScalarField'
  | 'MerkleRootNotInHistory'
  | 'MerkleTreeDepthUnsupported'
  | 'NullifierAlreadyUsed'
  | 'PoolAlreadyExists'
  | 'PoolDoesNotExist'
  | 'PoolHasNoMembers'
  | 'ProofVerificationFailed'
  | 'UnauthorizedCaller'
  | 'UserExceededGasFund'
  | 'WithdrawalNotAllowed';