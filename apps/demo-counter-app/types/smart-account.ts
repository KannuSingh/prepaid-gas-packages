// file :demo-counter-app/types/smart-account.ts
import type { SmartAccount } from 'viem/account-abstraction';
import type { LocalAccount } from 'viem/accounts';
import type { Identity } from '@semaphore-protocol/core';
import type { PaymasterConfig } from './paymaster';

export interface SmartAccountState {
  smartAccount?: SmartAccount;
  error: string | null;
  isLoading: boolean;
}

export interface SmartAccountInfo {
  smartAccount: SmartAccount;
  burnerEOA: LocalAccount;
  identity: Identity;
  paymasterConfig: PaymasterConfig;
}
