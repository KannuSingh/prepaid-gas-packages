/**
 * Custom error classes for PrepaidGasPaymaster operations
 */

export class PrepaidGasPaymasterError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PrepaidGasPaymasterError';
  }
}

export class PaymasterContextError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'CONTEXT_ERROR');
    this.name = 'PaymasterContextError';
  }
}

export class PoolMembershipError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'MEMBERSHIP_ERROR');
    this.name = 'PoolMembershipError';
  }
}

export class SubgraphError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'SUBGRAPH_ERROR');
    this.name = 'SubgraphError';
  }
}

export class ProofGenerationError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'PROOF_ERROR');
    this.name = 'ProofGenerationError';
  }
}

export class NetworkError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends PrepaidGasPaymasterError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}