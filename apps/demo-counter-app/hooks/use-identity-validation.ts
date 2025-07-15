// file :demo-counter-app/hooks/use-identity-validation.ts
import { useState, useCallback, useRef } from 'react';
import { Identity } from '@semaphore-protocol/core';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { bytesToHex } from 'viem';

type IdentityInputType = 'base64' | 'mnemonic';

export function useIdentityValidation() {
  const [error, setError] = useState<string | null>(null);
  const isValidatingRef = useRef(false);

  /**
   * Convert mnemonic words to Semaphore Identity
   * Flow: Mnemonic → Seed → Private Key → Semaphore Identity
   */
  const mnemonicToIdentity = useCallback((mnemonic: string): Identity => {
    // Normalize and validate mnemonic
    const normalizedMnemonic = mnemonic.trim().toLowerCase();

    if (!validateMnemonic(normalizedMnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase. Please check your words and try again.');
    }

    // Convert mnemonic to seed
    const seed = mnemonicToSeedSync(normalizedMnemonic);

    // Derive private key using BIP32 HD wallet derivation
    // Using path m/44'/60'/0'/0/0 (Ethereum standard)
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive("m/44'/60'/0'/0/0");

    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key from mnemonic');
    }

    // Use the derived private key directly (standard approach)
    const privateKeyHex = bytesToHex(derivedKey.privateKey);

    // Create Semaphore Identity from the derived private key
    return new Identity(privateKeyHex);
  }, []);

  /**
   * Validate and create Semaphore Identity from user input
   */
  const validateIdentity = useCallback(
    async (value: string, inputType: IdentityInputType): Promise<Identity | null> => {
      // Prevent concurrent validations that could cause infinite loops
      if (isValidatingRef.current) {
        return null;
      }

      isValidatingRef.current = true;

      try {
        setError(null);

        if (inputType === 'base64') {
          if (!value.trim()) {
            setError('Base64 identity is required');
            return null;
          }

          // Validate base64 format
          try {
            // Test if it's valid base64 and can be imported
            return Identity.import(value.trim());
          } catch (importError) {
            throw new Error('Invalid base64 identity format');
          }
        } else if (inputType === 'mnemonic') {
          if (!value.trim()) {
            setError('Mnemonic phrase is required');
            return null;
          }

          // Basic word count validation
          const words = value.trim().split(/\s+/);
          if (words.length !== 12) {
            setError('Mnemonic must be exactly 12 words');
            return null;
          }

          // Check for common issues
          const hasEmptyWords = words.some((word) => word.length === 0);
          if (hasEmptyWords) {
            setError('Mnemonic contains empty words. Please check your phrase.');
            return null;
          }

          // Convert mnemonic to Semaphore Identity
          return mnemonicToIdentity(value);
        }

        throw new Error('Invalid input type');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid identity format';
        setError(message);
        return null;
      } finally {
        // Always reset the validation flag
        isValidatingRef.current = false;
      }
    },
    [mnemonicToIdentity]
  );

  /**
   * Validate individual mnemonic words against BIP39 wordlist
   */
  const validateMnemonicWords = useCallback(
    (
      mnemonic: string
    ): {
      isValid: boolean;
      invalidWords: string[];
      suggestions: string[];
    } => {
      const words = mnemonic.trim().toLowerCase().split(/\s+/);
      const invalidWords: string[] = [];
      const suggestions: string[] = [];

      words.forEach((word) => {
        if (word && !wordlist.includes(word)) {
          invalidWords.push(word);

          // Find similar words (simple Levenshtein-like matching)
          const similarWords = wordlist
            .filter((dictWord) => {
              if (Math.abs(dictWord.length - word.length) > 2) return false;

              // Simple prefix matching for suggestions
              if (dictWord.startsWith(word.slice(0, 3)) && word.length >= 3) {
                return true;
              }

              return false;
            })
            .slice(0, 3); // Limit to 3 suggestions

          suggestions.push(...similarWords);
        }
      });

      return {
        isValid: invalidWords.length === 0,
        invalidWords,
        suggestions: [...new Set(suggestions)], // Remove duplicates
      };
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    validateIdentity,
    validateMnemonicWords,
    error,
    clearError,
  };
}
