import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'rollup-dist/bundle.js',
    format: 'es',
    sourcemap: true,
  },
  external: [
    // Node.js built-ins
    'crypto', 'fs', 'path', 'os', 'http', 'https', 'zlib', 'net', 'stream', 'tls', 'url',
    'node:fs', 'node:fs/promises', 'node:path', 'node:os', 'node:crypto',
    // Large dependencies we want to keep external
    'snarkjs',
    '@semaphore-protocol/core',
    '@semaphore-protocol/group', 
    '@semaphore-protocol/identity',
    '@semaphore-protocol/proof',
    'viem',
    'poseidon-lite',
    // Workspace packages
    '@prepaid-gas/data',
    '@prepaid-gas/constants'
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      browser: false,
      exportConditions: ['node'],
    }),
    commonjs({
      ignoreDynamicRequires: true,
    }),
    typescript({
      tsconfig: 'tsconfig.json',
      outDir: 'rollup-dist', // Fix the outDir issue
      declaration: false, // Disable declaration generation for analysis
      declarationMap: false,
    }),
    visualizer({
      filename: 'rollup-dist/bundle-analysis.html',
      template: 'treemap', // 'sunburst', 'network', 'raw-data', 'list'
      title: 'Prepaid Gas Core Bundle Analysis (Rollup)',
      sourcemap: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
