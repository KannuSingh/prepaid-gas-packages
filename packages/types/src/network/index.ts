/**
 * Network configuration types and chain definitions
 */

// Supported chain IDs from the contracts constants
export const SUPPORTED_CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  SEPOLIA: 11155111,
  BASE: 8453,
  BASE_SEPOLIA: 84532,
  OPTIMISM: 10,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];

// Contract addresses by network
export interface NetworkAddresses {
  GAS_LIMITED_PAYMASTER: string;
  ONE_TIME_USE_PAYMASTER: string;
  POSEIDON_T3: string;
}

// Base Sepolia specific addresses
export const BASE_SEPOLIA_ADDRESSES: NetworkAddresses = {
  GAS_LIMITED_PAYMASTER: "0x3BEeC075aC5A77fFE0F9ee4bbb3DCBd07fA93fbf",
  ONE_TIME_USE_PAYMASTER: "0x243A735115F34BD5c0F23a33a444a8d26e31E2E7",
  POSEIDON_T3: "0xB43122Ecb241DD50062641f089876679fd06599a"
} as const;

// Network configuration interface
export interface NetworkConfig {
  chainId: SupportedChainId;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  addresses: NetworkAddresses;
  subgraphUrl?: string;
}

// Network registry type
export type NetworkRegistry = Record<SupportedChainId, NetworkConfig>;

// RPC provider types
export interface RpcConfig {
  url: string;
  timeout?: number;
  retries?: number;
}

export interface MultiRpcConfig {
  primary: RpcConfig;
  fallbacks?: RpcConfig[];
}

// Block and transaction types
export interface BlockInfo {
  number: string;
  hash: string;
  timestamp: string;
  gasLimit: string;
  gasUsed: string;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  status: '0x1' | '0x0';
}

// Network status and health
export interface NetworkStatus {
  chainId: SupportedChainId;
  isConnected: boolean;
  latestBlock: string;
  gasPrice: string;
  lastUpdated: number;
}

// Gas estimation types
export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

// Chain metadata
export interface ChainMetadata {
  chainId: SupportedChainId;
  name: string;
  shortName: string;
  networkId: number;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Network provider interface
export interface NetworkProvider {
  getChainId(): Promise<SupportedChainId>;
  getBlockNumber(): Promise<string>;
  getBalance(address: string): Promise<string>;
  estimateGas(transaction: any): Promise<GasEstimate>;
  sendTransaction(transaction: any): Promise<string>;
  getTransaction(hash: string): Promise<TransactionInfo>;
  waitForTransaction(hash: string): Promise<TransactionInfo>;
}

// Network events
export interface NetworkEventMap {
  'chainChanged': { chainId: SupportedChainId };
  'accountsChanged': { accounts: string[] };
  'connect': { chainId: SupportedChainId };
  'disconnect': { error: Error };
  'blockUpdate': { blockNumber: string };
}

export type NetworkEventType = keyof NetworkEventMap;
export type NetworkEventData<T extends NetworkEventType> = NetworkEventMap[T];