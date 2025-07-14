/**
 * Common utility types and shared interfaces
 */

// Address type for Ethereum addresses
export type Address = string;

// Hex string type for bytes data
export type HexString = string;

// BigInt-like string for large numbers
export type BigNumberish = string | number;

// Hash types
export type Hash = HexString;
export type TransactionHash = Hash;
export type BlockHash = Hash;

// Constants from contracts
export const CONSTANTS = {
  // Pool and root history constants
  POOL_ROOT_HISTORY_SIZE: 64,
  
  // Gas limits and calculations
  POST_OP_GAS_LIMIT: 65000,
  
  // Data structure sizes (in bytes)
  PAYMASTER_DATA_SIZE: 480, // config (32) + poolId (32) + proof (416)
  PROOF_SIZE: 416, // 5 uint256 + 8 uint256 array
  CONFIG_SIZE: 32,
  POOL_ID_SIZE: 32,
  
  // Validation modes
  VALIDATION_MODE: 0,
  GAS_ESTIMATION_MODE: 1,
} as const;

// Result type for operations that can succeed or fail
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Async result type
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Optional type utility
export type Optional<T> = T | undefined;

// Nullable type utility
export type Nullable<T> = T | null;

// Partial deep type utility
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

// Required deep type utility
export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object ? RequiredDeep<T[P]> : T[P];
};

// Pick by value type utility
export type PickByValue<T, V> = Pick<T, {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T]>;

// Omit by value type utility
export type OmitByValue<T, V> = Omit<T, {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T]>;

// Event listener types
export type EventListener<T = any> = (event: T) => void;
export type EventMap = Record<string, any>;

// Generic event emitter interface
export interface EventEmitter<TEventMap extends EventMap = EventMap> {
  on<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: EventListener<TEventMap[TEventName]>
  ): void;
  
  off<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: EventListener<TEventMap[TEventName]>
  ): void;
  
  emit<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    event: TEventMap[TEventName]
  ): void;
}

// Logger interface
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Configuration base interface
export interface ConfigBase {
  readonly name: string;
  readonly version: string;
  readonly environment: 'development' | 'staging' | 'production';
}

// Time utilities
export interface Timestamp {
  readonly seconds: number;
  readonly milliseconds: number;
  readonly iso: string;
}

export interface Duration {
  readonly milliseconds: number;
  readonly seconds: number;
  readonly minutes: number;
  readonly hours: number;
  readonly days: number;
}

// Retry configuration
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffFactor: number;
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}

// Cache interface
export interface Cache<TKey, TValue> {
  get(key: TKey): Optional<TValue>;
  set(key: TKey, value: TValue, ttl?: number): void;
  delete(key: TKey): boolean;
  clear(): void;
  has(key: TKey): boolean;
  size(): number;
}

// Serializable types
export type Serializable = 
  | string
  | number
  | boolean
  | null
  | SerializableObject
  | SerializableArray;

export interface SerializableObject {
  [key: string]: Serializable;
}

export interface SerializableArray extends Array<Serializable> {}

// JSON types
export type JsonValue = Serializable;
export type JsonObject = SerializableObject;
export type JsonArray = SerializableArray;

// HTTP status codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// API response wrapper
export interface ApiResponse<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: any;
  };
  readonly meta?: {
    readonly timestamp: string;
    readonly version: string;
    readonly requestId?: string;
  };
}

// Pagination types
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
}

export interface PaginationMeta {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationMeta;
}

// Sorting types
export type SortDirection = 'asc' | 'desc';

export interface SortOption<T> {
  readonly field: keyof T;
  readonly direction: SortDirection;
}

// Filter types
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';

export interface FilterCondition<T> {
  readonly field: keyof T;
  readonly operator: FilterOperator;
  readonly value: any;
}

export interface FilterGroup<T> {
  readonly conditions: readonly FilterCondition<T>[];
  readonly operator: 'and' | 'or';
}

// Validation types
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

// Environment variables type
export interface EnvironmentVariables {
  readonly NODE_ENV: 'development' | 'staging' | 'production';
  readonly LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  readonly [key: string]: string | undefined;
}

// Brand type for nominal typing
export type Brand<T, B> = T & { readonly __brand: B };

// Example branded types
export type PoolId = Brand<string, 'PoolId'>;
export type UserId = Brand<string, 'UserId'>;
export type TokenAmount = Brand<string, 'TokenAmount'>;
export type ChainId = Brand<number, 'ChainId'>;

// Type guards
export function isAddress(value: any): value is Address {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isHexString(value: any): value is HexString {
  return typeof value === 'string' && /^0x[a-fA-F0-9]*$/.test(value);
}

export function isHash(value: any): value is Hash {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

// Utility function types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type ValuesOfType<T, U> = T[KeysOfType<T, U>];

// Promise utilities
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

// Function utilities
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;