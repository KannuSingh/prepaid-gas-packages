/**
 * @private-prepaid-gas/data
 * 
 * Data layer with fluent query builders for subgraph interaction
 * Core package should import specific query builders, not the full package
 */

// Export base client for advanced usage
export { SubgraphClient } from './client/SubgraphClient';
export type { QueryResult, SubgraphClientOptions } from './client/SubgraphClient';

// Note: Specific query builders should be imported directly:
// import { getPoolMembers } from '@private-prepaid-gas/data/queries/pool-members';