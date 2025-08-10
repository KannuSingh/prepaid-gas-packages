import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle-analysis.js',
    format: 'esm',
  },
  external: [
    // Mark peer dependencies as external
    'viem',
    // Mark any other external dependencies here
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
    }),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      title: '@prepaid-gas/constants Bundle Analysis',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: false,
      sourcemap: false,
    }),
  ],
});
