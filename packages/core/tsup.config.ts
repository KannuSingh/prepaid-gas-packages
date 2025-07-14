import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  external: [
    '@private-prepaid-gas/contracts',
    '@private-prepaid-gas/types',
    '@semaphore-protocol/core',
    '@semaphore-protocol/group',
    '@semaphore-protocol/identity',
    '@semaphore-protocol/proof',
    'poseidon-lite',
    'viem',
  ],
});
