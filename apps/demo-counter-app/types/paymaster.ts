// file :demo-counter-app/types/paymaster.ts
export interface PaymasterConfig {
  identity: string;
  address: string;
  paymasterContext: string; // bytes data for smartAccountClient configuration
  amount?: string;
  network?: {
    name: string;
    chainId: number;
  };
  transactionHash?: string;
  purchasedAt?: number;
}

// Form input data (keep existing structure)
export interface PaymasterFormData {
  poolId: string; // was couponId
  identity: string;
}

// Validation errors
export interface ValidationErrors {
  poolId?: string; // was couponId
  identity?: string;
  general?: string;
}

// Semaphore proof structure
export interface SemaphoreProof {
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

// Pool configuration from blockchain
export interface PoolConfig {
  poolId: bigint;
  joiningFee: bigint;
  merkleTreeDuration: bigint;
  totalDeposits: bigint;
  merkleTreeRoot: bigint;
  merkleTreeSize: bigint;
  merkleTreeDepth: bigint;
}
