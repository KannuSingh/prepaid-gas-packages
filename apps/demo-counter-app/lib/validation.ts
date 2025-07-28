// file :demo-counter-app/lib/validation.ts
import { Identity } from '@semaphore-protocol/core';
import type { PaymasterConfig } from '@/types/paymaster';

// Validate PaymasterConfig data
export function validatePaymasterConfig(config: PaymasterConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.identity || typeof config.identity !== 'string') {
    errors.push('Valid identity string is required');
  }

  if (!config.paymasterContext || typeof config.paymasterContext !== 'string' || !config.paymasterContext.trim()) {
    errors.push('Valid paymaster context is required');
  }

  // Try to parse the identity to ensure it's valid
  try {
    if (config.identity) {
      Identity.import(config.identity);
    }
  } catch (error) {
    console.error(error);
    errors.push('Invalid identity format - must be a valid base64 encoded semaphore identity');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
