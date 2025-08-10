// file :demo-counter-app/types/paymaster.ts
export interface PaymasterConfig {
  paymasterAddress: string; // Paymaster contract address
  identity: string;
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
  paymasterAddress: string; // was poolId
  identity: string;
}

// Validation errors
export interface ValidationErrors {
  paymasterAddress?: string; // was poolId
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
